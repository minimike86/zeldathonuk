"""Twitch Helix integration — push the local schedule to the Twitch channel
schedule, and fetch the live `currently playing` from the channel info.

Requires:
- TWITCH_CLIENT_ID
- TWITCH_CLIENT_SECRET  (used to refresh the user OAuth token)
- TWITCH_ACCESS_TOKEN   (user OAuth token with channel:manage:schedule for push,
                        channel:read:schedule to read) — bootstrap only; persisted
                        in TwitchOAuthToken once first used.
- TWITCH_REFRESH_TOKEN  (refresh_token returned alongside the access token by the
                        Twitch CLI) — bootstrap only; rotated and persisted.

Optional:
- TWITCH_BROADCASTER_ID (your channel's numeric Twitch user id). Usually NOT
                        needed — it's auto-resolved from the user token, since
                        schedule management uses the broadcaster's own token.
                        Set only to force a specific id.

Get tokens via Twitch CLI: `twitch token -u -s channel:manage:schedule`
"""
from __future__ import annotations

import logging
import re
from datetime import timedelta
from urllib.parse import urlparse

import requests
from django.conf import settings
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.request import Request
from rest_framework.response import Response

from . import models

logger = logging.getLogger(__name__)


HELIX = 'https://api.twitch.tv/helix'
TOKEN_URL = 'https://id.twitch.tv/oauth2/token'
DEVICE_URL = 'https://id.twitch.tv/oauth2/device'
DEVICE_GRANT = 'urn:ietf:params:oauth:grant-type:device_code'

# Refresh proactively when the token has this little time left, so a long-running
# request can't get half-way and then hit a 401.
REFRESH_LEEWAY = timedelta(seconds=60)

# Every scope a broadcaster (the primary / bot channel) token may need across
# the app's Twitch features — what's wired today plus headroom for the planned
# chat / redemption / prediction phase — so a single authorisation covers
# everything and no re-auth is needed when those ship. (channel.raid needs no
# scope.) Additional charity-only channels request just `channel:read:charity`.
USER_SCOPES = [
    'channel:manage:schedule',         # push to Twitch schedule
    'moderator:read:followers',        # channel.follow
    'channel:read:subscriptions',      # channel.subscribe / .gift / .message
    'bits:read',                       # channel.cheer
    'channel:read:redemptions',        # channel-points redemptions (read)
    'channel:read:charity',            # Twitch Charity campaign donations
    'channel:read:hype_train',         # hype train begin/progress/end
    'channel:read:ads',                # channel.ad_break.begin (auto-BRB)
    'channel:read:goals',              # creator goals
    'channel:read:polls',              # poll results
    'channel:read:predictions',        # prediction results
    'user:read:chat',                  # read chat (EventSub channel.chat.message)
    'chat:read',                       # read chat over IRC
    'user:write:chat',                 # send chat as the user/bot (Helix)
    'chat:edit',                       # send chat over IRC
    'channel:bot',                     # act as a bot in this channel
    'channel:manage:broadcast',        # set title/category, stream markers
    'clips:edit',                      # auto-create clips
    'channel:edit:commercial',         # start / snooze ad breaks
    'moderator:manage:announcements',  # /announce milestones
    'moderator:manage:shoutouts',      # /shoutout runners & guests
    'channel:manage:redemptions',      # create / fulfill channel-point rewards
    'channel:manage:polls',            # run polls
    'channel:manage:predictions',      # run gameplay predictions
    'channel:manage:raids',            # raid out at the end of the event
]
DEFAULT_USER_SCOPES = ' '.join(USER_SCOPES)


class TwitchAuthError(RuntimeError):
    """Raised when we can't produce a valid user access token."""


def _seed_from_env(tok: 'models.TwitchOAuthToken') -> bool:
    """Copy env-provided bootstrap values into a blank row. Returns True if anything changed."""
    changed = False
    if not tok.access_token and settings.TWITCH_ACCESS_TOKEN:
        tok.access_token = settings.TWITCH_ACCESS_TOKEN
        changed = True
    if not tok.refresh_token and settings.TWITCH_REFRESH_TOKEN:
        tok.refresh_token = settings.TWITCH_REFRESH_TOKEN
        changed = True
    return changed


def _refresh(tok: 'models.TwitchOAuthToken') -> None:
    """Exchange the refresh_token for a new access_token (and rotate the refresh_token)."""
    if not tok.refresh_token:
        raise TwitchAuthError('No refresh_token available — set TWITCH_REFRESH_TOKEN.')
    if not settings.TWITCH_CLIENT_ID or not settings.TWITCH_CLIENT_SECRET:
        raise TwitchAuthError('TWITCH_CLIENT_ID and TWITCH_CLIENT_SECRET required to refresh.')
    resp = requests.post(
        TOKEN_URL,
        data={
            'grant_type': 'refresh_token',
            'refresh_token': tok.refresh_token,
            'client_id': settings.TWITCH_CLIENT_ID,
            'client_secret': settings.TWITCH_CLIENT_SECRET,
        },
        timeout=15,
    )
    if not resp.ok:
        raise TwitchAuthError(f'Twitch refresh failed ({resp.status_code}): {resp.text}')
    data = resp.json()
    tok.access_token = data['access_token']
    # Twitch rotates the refresh_token on every successful refresh.
    tok.refresh_token = data.get('refresh_token', tok.refresh_token)
    tok.expires_at = timezone.now() + timedelta(seconds=int(data['expires_in']))
    scope = data.get('scope') or []
    tok.scopes = ' '.join(scope) if isinstance(scope, list) else str(scope)
    tok.save()


def get_user_access_token(force_refresh: bool = False) -> str:
    """Return a currently-valid user OAuth access token, refreshing if needed."""
    tok = models.TwitchOAuthToken.get()
    if _seed_from_env(tok):
        tok.save()
    if not tok.access_token and not tok.refresh_token:
        raise TwitchAuthError(
            'No Twitch user token configured. Set TWITCH_ACCESS_TOKEN and '
            'TWITCH_REFRESH_TOKEN, or populate the TwitchOAuthToken row in admin.'
        )

    expiring = tok.expires_at is not None and tok.expires_at <= timezone.now() + REFRESH_LEEWAY
    if force_refresh or expiring:
        _refresh(tok)
    return tok.access_token


def _auth_headers() -> dict[str, str]:
    return {
        'Authorization': f'Bearer {get_user_access_token()}',
        'Client-Id': settings.TWITCH_CLIENT_ID,
        'Content-Type': 'application/json',
    }


def _request(method: str, url: str, **kwargs) -> requests.Response:
    """Helix request wrapper that refreshes the token + retries once on 401."""
    headers = kwargs.pop('headers', None) or _auth_headers()
    resp = requests.request(method, url, headers=headers, timeout=15, **kwargs)
    if resp.status_code == 401:
        # Token expired between proactive checks (or was revoked) — try once more.
        get_user_access_token(force_refresh=True)
        headers = _auth_headers()
        resp = requests.request(method, url, headers=headers, timeout=15, **kwargs)
    return resp


def valid_token_for(tok) -> str:
    """Return a valid access token for ANY token-bearing row — the primary
    ``TwitchOAuthToken`` singleton or a ``TwitchChannelConnection`` — refreshing
    when within ``REFRESH_LEEWAY`` of expiry. Both models share the field names
    ``_refresh`` reads/writes, so it works on either."""
    if not (tok.access_token or tok.refresh_token):
        raise TwitchAuthError('No token stored for this channel.')
    expiring = (
        tok.expires_at is not None
        and tok.expires_at <= timezone.now() + REFRESH_LEEWAY
    )
    if expiring:
        _refresh(tok)
    return tok.access_token


def _token_headers(token_str: str) -> dict[str, str]:
    return {
        'Authorization': f'Bearer {token_str}',
        'Client-Id': settings.TWITCH_CLIENT_ID,
        'Content-Type': 'application/json',
    }


def _request_as(tok, method: str, url: str, *, timeout: int = 15, **kwargs) -> requests.Response:
    """Helix request signed with a SPECIFIC token row; refresh + retry once on 401.

    The ``_request`` above implicitly uses the primary singleton; this variant
    lets the poller read an additional channel's charity data with that
    channel's own token (Twitch requires the broadcaster's own token + matching
    broadcaster_id for charity endpoints). ``timeout`` is overridable so
    best-effort callers (chat sends in the request path) can fail fast."""
    resp = requests.request(
        method, url, headers=_token_headers(valid_token_for(tok)), timeout=timeout, **kwargs,
    )
    if resp.status_code == 401:
        _refresh(tok)
        resp = requests.request(
            method, url, headers=_token_headers(tok.access_token), timeout=timeout, **kwargs,
        )
    return resp


def _broadcaster_id() -> str:
    return getattr(settings, 'TWITCH_BROADCASTER_ID', '')


def resolve_broadcaster_id() -> str:
    """The numeric Twitch user id of the channel we manage.

    Prefers the explicit TWITCH_BROADCASTER_ID override when set; otherwise
    resolves it from the user OAuth token — managing a channel's schedule
    requires that channel's own token, so a Helix Get-Users call with no
    id/login returns the authenticated user, whose id IS the broadcaster id.
    Returns '' when it can't be determined (no/invalid token).
    """
    explicit = _broadcaster_id()
    if explicit:
        return explicit
    try:
        resp = _request('GET', f'{HELIX}/users')
    except (TwitchAuthError, requests.RequestException):
        return ''
    if not resp.ok:
        return ''
    data = resp.json().get('data') or []
    return data[0].get('id', '') if data else ''


_TWITCH_LOGIN_RE = re.compile(r'^[a-zA-Z0-9_]{1,25}$')


def extract_twitch_login(url: str) -> str | None:
    """Pull the channel login out of a twitch.tv URL, or return None."""
    if not url:
        return None
    try:
        parsed = urlparse(url if '://' in url else f'https://{url}')
    except ValueError:
        return None
    host = (parsed.hostname or '').lower()
    if not host.endswith('twitch.tv'):
        return None
    parts = [p for p in parsed.path.split('/') if p]
    if not parts:
        return None
    login = parts[0]
    return login if _TWITCH_LOGIN_RE.match(login) else None


# App access token (client credentials) cache — used for public Helix endpoints
# like /users that don't need a user OAuth scope. Kept in-memory; refreshed on
# expiry. Safe to lose on restart since minting a new one is cheap.
_APP_TOKEN: dict = {'value': None, 'expires_at': None}


def get_app_access_token(force_refresh: bool = False) -> str:
    """Return a valid app access token (client credentials grant)."""
    if not settings.TWITCH_CLIENT_ID or not settings.TWITCH_CLIENT_SECRET:
        raise TwitchAuthError('TWITCH_CLIENT_ID and TWITCH_CLIENT_SECRET required.')
    expires_at = _APP_TOKEN['expires_at']
    valid = (
        _APP_TOKEN['value']
        and expires_at is not None
        and expires_at > timezone.now() + REFRESH_LEEWAY
    )
    if valid and not force_refresh:
        return _APP_TOKEN['value']
    resp = requests.post(
        TOKEN_URL,
        data={
            'grant_type': 'client_credentials',
            'client_id': settings.TWITCH_CLIENT_ID,
            'client_secret': settings.TWITCH_CLIENT_SECRET,
        },
        timeout=15,
    )
    if not resp.ok:
        raise TwitchAuthError(f'App token mint failed ({resp.status_code}): {resp.text}')
    data = resp.json()
    _APP_TOKEN['value'] = data['access_token']
    _APP_TOKEN['expires_at'] = timezone.now() + timedelta(seconds=int(data['expires_in']))
    return _APP_TOKEN['value']


def _app_auth_headers() -> dict[str, str]:
    return {
        'Authorization': f'Bearer {get_app_access_token()}',
        'Client-Id': settings.TWITCH_CLIENT_ID,
    }


def list_eventsub_subscriptions() -> list[dict]:
    """All EventSub subscriptions for this app (app-token call). Paginates."""
    out: list[dict] = []
    cursor = None
    while True:
        params = {'after': cursor} if cursor else {}
        resp = requests.get(
            f'{HELIX}/eventsub/subscriptions',
            headers=_app_auth_headers(), params=params, timeout=15,
        )
        if resp.status_code == 401:
            resp = requests.get(
                f'{HELIX}/eventsub/subscriptions',
                headers={**_app_auth_headers(),
                         'Authorization': f'Bearer {get_app_access_token(force_refresh=True)}'},
                params=params, timeout=15,
            )
        if not resp.ok:
            raise TwitchAuthError(
                f'List EventSub subs failed ({resp.status_code}): {resp.text}'
            )
        body = resp.json()
        out.extend(body.get('data', []) or [])
        cursor = (body.get('pagination') or {}).get('cursor')
        if not cursor:
            return out


def create_eventsub_subscription(
    sub_type: str, version: str, condition: dict, callback: str, secret: str,
) -> requests.Response:
    """Register one webhook EventSub subscription (app-token call)."""
    headers = {**_app_auth_headers(), 'Content-Type': 'application/json'}
    return requests.post(
        f'{HELIX}/eventsub/subscriptions',
        headers=headers,
        json={
            'type': sub_type,
            'version': version,
            'condition': condition,
            'transport': {'method': 'webhook', 'callback': callback, 'secret': secret},
        },
        timeout=15,
    )


def delete_eventsub_subscription(sub_id: str) -> requests.Response:
    """Delete one EventSub subscription by id (app-token call)."""
    return requests.delete(
        f'{HELIX}/eventsub/subscriptions',
        headers=_app_auth_headers(), params={'id': sub_id}, timeout=15,
    )


def fetch_user_profile(login: str) -> dict | None:
    """Look up a Twitch user by login. Returns the Helix user dict or None.

    Uses an app access token — works without a user OAuth grant.
    """
    headers = _app_auth_headers()
    resp = requests.get(
        f'{HELIX}/users', headers=headers, params={'login': login}, timeout=15
    )
    if resp.status_code == 401:
        headers = {**_app_auth_headers(), 'Authorization': f'Bearer {get_app_access_token(force_refresh=True)}'}
        resp = requests.get(
            f'{HELIX}/users', headers=headers, params={'login': login}, timeout=15
        )
    if not resp.ok:
        return None
    data = resp.json().get('data') or []
    return data[0] if data else None


def fetch_stream(login: str) -> dict | None:
    """Return Helix /streams entry for `login` when the channel is live, else None.

    The endpoint omits offline channels entirely, so a None return == offline.
    Uses an app access token (no user OAuth scope needed).
    """
    headers = _app_auth_headers()
    resp = requests.get(
        f'{HELIX}/streams', headers=headers, params={'user_login': login}, timeout=15
    )
    if resp.status_code == 401:
        headers = {
            **_app_auth_headers(),
            'Authorization': f'Bearer {get_app_access_token(force_refresh=True)}',
        }
        resp = requests.get(
            f'{HELIX}/streams', headers=headers, params={'user_login': login}, timeout=15
        )
    if not resp.ok:
        return None
    data = resp.json().get('data') or []
    return data[0] if data else None


# ── Device-code OAuth (in-app channel connect) ──────────────────────────────
# Lets an operator connect a channel from the control panel without the CLI:
# start() returns a short user code + Twitch URL the broadcaster opens on their
# own device; the UI polls until they authorise, then we persist the token as a
# TwitchChannelConnection. Same grant the twitch_login command uses.


def start_device_authorization(scopes: str) -> dict:
    """Begin the device-code flow. Returns Twitch's response: device_code,
    user_code, verification_uri, interval, expires_in."""
    if not settings.TWITCH_CLIENT_ID:
        raise TwitchAuthError('TWITCH_CLIENT_ID is not set.')
    resp = requests.post(
        DEVICE_URL,
        data={'client_id': settings.TWITCH_CLIENT_ID, 'scopes': scopes},
        timeout=15,
    )
    if not resp.ok:
        raise TwitchAuthError(
            f'Device authorization request failed ({resp.status_code}): {resp.text}'
        )
    return resp.json()


def poll_device_token(device_code: str) -> dict:
    """Poll the token endpoint once for a device_code. Returns
    ``{'status': 'authorized', 'token': {...}}`` on success, else
    ``{'status': 'pending'|'slow_down'|'expired'|'error', 'message': ...}``."""
    if not settings.TWITCH_CLIENT_ID:
        raise TwitchAuthError('TWITCH_CLIENT_ID is not set.')
    resp = requests.post(
        TOKEN_URL,
        data={
            'client_id': settings.TWITCH_CLIENT_ID,
            'device_code': device_code,
            'grant_type': DEVICE_GRANT,
        },
        timeout=15,
    )
    if resp.ok:
        return {'status': 'authorized', 'token': resp.json()}
    message = ''
    try:
        message = (resp.json() or {}).get('message', '') or ''
    except ValueError:
        pass
    low = message.lower()
    if 'authorization_pending' in low or 'pending' in low:
        return {'status': 'pending'}
    if 'slow_down' in low:
        return {'status': 'slow_down'}
    if 'expired' in low:
        return {'status': 'expired', 'message': message}
    return {'status': 'error', 'message': message or resp.text[:200]}


def save_connection(login_hint: str, token: dict) -> 'models.TwitchChannelConnection':
    """Upsert a TwitchChannelConnection from a token response, resolving the
    channel's login / id / display name from the token (Get Users with no id
    returns the authenticated user)."""
    access = token['access_token']
    info: dict = {}
    resp = requests.get(
        f'{HELIX}/users',
        headers={'Authorization': f'Bearer {access}',
                 'Client-Id': settings.TWITCH_CLIENT_ID},
        timeout=15,
    )
    if resp.ok:
        rows = resp.json().get('data') or []
        info = rows[0] if rows else {}
    login = (info.get('login') or login_hint or '').strip().lower()
    scope = token.get('scope') or []
    conn, _ = models.TwitchChannelConnection.objects.update_or_create(
        login=login,
        defaults={
            'broadcaster_id': info.get('id', '') or '',
            'display_name': info.get('display_name', '') or '',
            'access_token': access,
            'refresh_token': token.get('refresh_token', '') or '',
            'expires_at': timezone.now() + timedelta(seconds=int(token['expires_in'])),
            'scopes': ' '.join(scope) if isinstance(scope, list) else str(scope or ''),
            'is_active': True,
        },
    )
    # Link this connection to every event channel of the same login so a single
    # connect wires up the channel wherever it's used.
    models.EventTwitchChannel.objects.filter(login=login).update(connection=conn)
    return conn


def fetch_active_charity_campaign(tok=None, broadcaster_id: str = '') -> dict | None:
    """Return a channel's active Twitch Charity campaign, or None.

    Helix ``GET /charity/campaigns`` returns the single in-progress campaign for
    that broadcaster (empty when none is running). Defaults to the PRIMARY
    broadcaster (singleton token, id auto-resolved); pass an explicit ``tok``
    (e.g. a ``TwitchChannelConnection``) + ``broadcaster_id`` to read an additional
    channel. Needs ``channel:read:charity`` on the token used.
    """
    if tok is None:
        tok = models.TwitchOAuthToken.get()
        if not broadcaster_id:
            broadcaster_id = resolve_broadcaster_id()
    if not broadcaster_id:
        return None
    resp = _request_as(
        tok, 'GET', f'{HELIX}/charity/campaigns',
        params={'broadcaster_id': broadcaster_id},
    )
    if not resp.ok:
        return None
    data = resp.json().get('data') or []
    return data[0] if data else None


def fetch_charity_donations(
    campaign_id: str = '', tok=None, broadcaster_id: str = '', page_limit: int = 20,
) -> list[dict]:
    """All donations for a channel's active charity campaign via Helix
    ``GET /charity/donations``.

    Paginates (100/page) up to ``page_limit`` pages as a sanity cap. Defaults to
    the primary broadcaster; pass ``tok`` + ``broadcaster_id`` for an additional
    channel. Each item carries a stable ``id`` we use as the Donation
    ``external_id`` — the same id the EventSub donate event sends — so polled and
    pushed rows dedupe against each other.
    """
    if tok is None:
        tok = models.TwitchOAuthToken.get()
        if not broadcaster_id:
            broadcaster_id = resolve_broadcaster_id()
    if not broadcaster_id:
        return []
    out: list[dict] = []
    cursor = None
    for _ in range(page_limit):
        params = {'broadcaster_id': broadcaster_id, 'first': 100}
        if cursor:
            params['after'] = cursor
        resp = _request_as(tok, 'GET', f'{HELIX}/charity/donations', params=params)
        if not resp.ok:
            break
        body = resp.json()
        out.extend(body.get('data', []) or [])
        cursor = (body.get('pagination') or {}).get('cursor')
        if not cursor:
            break
    return out


def ensure_connection_broadcaster_id(conn) -> str:
    """Return a connection's broadcaster id, resolving + persisting it from the
    connection's own token (Get Users with no id) the first time. Returns ''
    when it can't be determined."""
    if conn.broadcaster_id:
        return conn.broadcaster_id
    try:
        resp = _request_as(conn, 'GET', f'{HELIX}/users')
    except (TwitchAuthError, requests.RequestException):
        return ''
    if not resp.ok:
        return ''
    data = resp.json().get('data') or []
    if not data:
        return ''
    conn.broadcaster_id = data[0].get('id', '') or ''
    if not conn.display_name:
        conn.display_name = data[0].get('display_name', '') or ''
    if conn.broadcaster_id:
        conn.save()
    return conn.broadcaster_id


def charity_poll_sources() -> list[tuple[str, object, str]]:
    """Every channel whose charity donations we poll, derived from the ACTIVE
    event: each ``EventTwitchChannel`` with ``track_charity`` and a linked
    ``TwitchChannelConnection``. Returns ``(login, connection, broadcaster_id)``
    — the login is for log output; the real source-channel tag comes from each
    campaign's ``broadcaster_login`` at ingest time.
    """
    active = models.Event.objects.filter(is_active=True).first()
    if not active:
        return []
    sources: list[tuple[str, object, str]] = []
    channels = (
        active.twitch_channels
        .filter(is_active=True, track_charity=True, connection__isnull=False)
        .select_related('connection')
    )
    for ch in channels:
        conn = ch.connection
        if not (conn.is_active and (conn.access_token or conn.refresh_token)):
            continue
        bid = ensure_connection_broadcaster_id(conn)
        if bid:
            sources.append((ch.login, conn, bid))
    return sources


def event_primary_connection(event):
    """The connection that should act for an event (chat / predictions): its
    primary connected channel, falling back to any connected channel. Returns
    None when there's no usable connection."""
    if event is None:
        return None
    ch = (
        event.twitch_channels
        .filter(is_primary=True, connection__isnull=False)
        .select_related('connection')
        .first()
        or event.twitch_channels
        .filter(connection__isnull=False)
        .select_related('connection')
        .first()
    )
    if not ch or not ch.connection:
        return None
    conn = ch.connection
    if not conn.is_active or not (conn.access_token or conn.refresh_token):
        return None
    return conn


# ── Chat: announcements + shoutouts ─────────────────────────────────────────


def send_chat_announcement(conn, broadcaster_id: str, message: str,
                           color: str = 'primary') -> requests.Response:
    """Post a highlighted /announce to the channel's chat (needs
    moderator:manage:announcements). ``color`` ∈ blue/green/orange/purple/
    primary. broadcaster_id == moderator_id (the channel announces in its own
    chat). Returns the Helix response (204 on success)."""
    return _request_as(
        conn, 'POST', f'{HELIX}/chat/announcements', timeout=5,
        params={'broadcaster_id': broadcaster_id, 'moderator_id': broadcaster_id},
        json={'message': message[:500], 'color': color or 'primary'},
    )


def fetch_custom_rewards(conn, broadcaster_id: str) -> list[dict]:
    """List the channel's custom channel-point rewards (id, title, cost) for the
    reward-action picker. Needs channel:read:redemptions. Returns [] on error."""
    try:
        resp = _request_as(
            conn, 'GET', f'{HELIX}/channel_points/custom_rewards',
            params={'broadcaster_id': broadcaster_id},
        )
    except (TwitchAuthError, requests.RequestException):
        return []
    if not resp.ok:
        return []
    return resp.json().get('data') or []


def fetch_global_emotes() -> list[dict]:
    """Twitch global emotes (name + 1x image url) for the chat composer's emote
    picker. App-token call (no user scope); returns [] on error. Sending an
    emote's *name* in a chat message is what makes Twitch render the emote."""
    try:
        resp = requests.get(
            f'{HELIX}/chat/emotes/global', headers=_app_auth_headers(), timeout=15,
        )
        if resp.status_code == 401:
            resp = requests.get(
                f'{HELIX}/chat/emotes/global',
                headers={**_app_auth_headers(),
                         'Authorization': f'Bearer {get_app_access_token(force_refresh=True)}'},
                timeout=15,
            )
    except (TwitchAuthError, requests.RequestException):
        return []
    if not resp.ok:
        return []
    out = []
    for e in resp.json().get('data') or []:
        imgs = e.get('images') or {}
        out.append({
            'id': e.get('id'),
            'name': e.get('name'),
            'url': imgs.get('url_1x') or '',
        })
    return out


def modify_channel(conn, broadcaster_id: str, *, game_id: str | None = None,
                   title: str | None = None) -> requests.Response | None:
    """Set the channel's category (game_id) and/or stream title via Helix
    ``PATCH /channels`` (needs channel:manage:broadcast). Returns the response,
    or None when there's nothing to change. (204 on success.)"""
    body: dict = {}
    if game_id is not None:
        body['game_id'] = str(game_id)
    if title is not None:
        body['title'] = title[:140]
    if not body:
        return None
    return _request_as(
        conn, 'PATCH', f'{HELIX}/channels', timeout=5,
        params={'broadcaster_id': broadcaster_id}, json=body,
    )


def update_channel_for_game(event, entry) -> bool:
    """Best-effort: on a game change, set the event's primary channel category
    (+ optional title) to match ``entry``'s game, when the event opts in. Never
    raises. Returns True only when a change was actually pushed."""
    try:
        if event is None or not getattr(event, 'update_twitch_category', False):
            return False
        if entry is None or not getattr(entry, 'game_id', None):
            return False
        game = entry.game
        game_id = (game.twitch_game_id or '').strip()
        if not game_id:
            return False
        conn = event_primary_connection(event)
        if not conn or 'channel:manage:broadcast' not in (conn.scopes or '').split():
            return False
        bid = ensure_connection_broadcaster_id(conn)
        if not bid:
            return False
        title = None
        tpl = (getattr(event, 'twitch_title_template', '') or '').strip()
        if tpl:
            from .chat import render_template
            title = render_template(tpl, _title_context(event, entry, game, conn)).strip() or None
        resp = modify_channel(conn, bid, game_id=game_id, title=title)
        return bool(getattr(resp, 'ok', False))
    except Exception:  # noqa: BLE001 — must never break the schedule advance
        logger.exception('update_channel_for_game failed')
        return False


def _title_context(event, entry, game, conn) -> dict:
    """Placeholder values for the on-game-change stream title."""
    position = ''
    game_number: int | str = ''
    game_total: int | str = ''
    try:
        ids = list(
            event.schedule
            .filter(slot_type='game', parent_entry__isnull=True)
            .order_by('order').values_list('id', flat=True)
        )
        if entry.id in ids:
            game_number = ids.index(entry.id) + 1
            game_total = len(ids)
            position = f'{game_number} of {game_total}'
    except Exception:  # noqa: BLE001
        pass
    charity = ''
    try:
        link = (
            event.event_charities.filter(is_primary=True).select_related('charity').first()
            or event.event_charities.select_related('charity').first()
        )
        if link:
            charity = link.charity.name
    except Exception:  # noqa: BLE001
        pass
    return {
        'game': game.title,
        'event': event.name,
        'channel': (conn.display_name or conn.login or '') if conn else '',
        'charity': charity,
        'position': position,
        'game_number': game_number,
        'game_total': game_total,
    }


def send_shoutout(conn, from_broadcaster_id: str, to_broadcaster_id: str,
                  moderator_id: str) -> requests.Response:
    """Send a Twitch /shoutout from one channel to another (needs
    moderator:manage:shoutouts). Twitch enforces a 2-min global + 60-min
    per-target cooldown and requires the from-channel to be live. Returns the
    Helix response (204 on success)."""
    return _request_as(
        conn, 'POST', f'{HELIX}/chat/shoutouts', timeout=5,
        params={
            'from_broadcaster_id': from_broadcaster_id,
            'to_broadcaster_id': to_broadcaster_id,
            'moderator_id': moderator_id,
        },
    )


# ── Predictions (gameplay bets — operator-driven) ───────────────────────────
# Twitch limits: title ≤45 chars, 2-10 outcomes (title ≤25), window 30-1800s.


def create_prediction(conn, broadcaster_id: str, title: str,
                      outcomes: list[str], window_seconds: int) -> dict | None:
    """Open a prediction on the channel. Returns the Helix prediction dict."""
    body = {
        'broadcaster_id': broadcaster_id,
        'title': title[:45],
        'outcomes': [{'title': str(o)[:25]} for o in outcomes if str(o).strip()],
        'prediction_window': max(30, min(1800, int(window_seconds))),
    }
    resp = _request_as(conn, 'POST', f'{HELIX}/predictions', json=body)
    if not resp.ok:
        raise TwitchAuthError(
            f'Create prediction failed ({resp.status_code}): {resp.text[:300]}'
        )
    data = resp.json().get('data') or []
    return data[0] if data else None


def end_prediction(conn, broadcaster_id: str, prediction_id: str, status: str,
                   winning_outcome_id: str = '') -> dict | None:
    """Resolve / cancel / lock a prediction. ``status`` is one of RESOLVED,
    CANCELED, LOCKED; RESOLVED requires ``winning_outcome_id``."""
    body = {
        'broadcaster_id': broadcaster_id,
        'id': prediction_id,
        'status': status,
    }
    if status == 'RESOLVED' and winning_outcome_id:
        body['winning_outcome_id'] = winning_outcome_id
    resp = _request_as(conn, 'PATCH', f'{HELIX}/predictions', json=body)
    if not resp.ok:
        raise TwitchAuthError(
            f'End prediction failed ({resp.status_code}): {resp.text[:300]}'
        )
    data = resp.json().get('data') or []
    return data[0] if data else None


@api_view(['GET'])
def stream_status(request: Request) -> Response:
    """Return whether a Twitch channel is currently live.

    Query params: ?login=<channel-login>. Falls back to the active event's
    primary Twitch channel when omitted, so the homepage can call it without
    threading the channel into the URL. Lightweight response shape so
    consumers can poll on a short cadence without dragging metadata in.
    """
    login = (request.query_params.get('login') or '').strip().lower()
    if not login:
        event = models.Event.objects.filter(is_active=True).first()
        if event:
            primary = (
                event.twitch_channels.filter(is_primary=True).first()
                or event.twitch_channels.first()
            )
            if primary:
                login = primary.login.strip().lower()
    if not login or not _TWITCH_LOGIN_RE.match(login):
        return Response(
            {'error': 'login required'}, status=status.HTTP_400_BAD_REQUEST,
        )
    try:
        stream = fetch_stream(login)
    except (TwitchAuthError, requests.RequestException) as exc:
        # Network blips / token issues shouldn't blank the homepage —
        # report unknown state with the error so the client can decide.
        return Response(
            {'login': login, 'is_live': False, 'error': str(exc)},
            status=status.HTTP_200_OK,
        )
    if not stream:
        return Response({'login': login, 'is_live': False})
    return Response({
        'login': login,
        'is_live': True,
        # `user_name` is the broadcaster's preferred display name with
        # original casing (e.g. "MSec"), whereas `user_login` is forced
        # lowercase. Surface both so the UI can show the styled name
        # while keeping the lowercase handle for URLs.
        'user_name': stream.get('user_name') or '',
        'started_at': stream.get('started_at'),
        'game_name': stream.get('game_name') or '',
        'title': stream.get('title') or '',
        'viewer_count': stream.get('viewer_count') or 0,
    })


def _all_segment_ids(bid: str) -> list[str]:
    """Every scheduled segment id for the broadcaster, paginating the Helix
    schedule so a long marathon (>25 segments) is fully covered."""
    ids: list[str] = []
    cursor: str | None = None
    for _ in range(50):  # safety bound — far more than any real schedule
        url = f'{HELIX}/schedule?broadcaster_id={bid}&first=25'
        if cursor:
            url += f'&after={cursor}'
        resp = _request('GET', url)
        if not resp.ok:
            break
        body = resp.json()
        segments = (body.get('data') or {}).get('segments') or []
        ids.extend(str(s['id']) for s in segments if s.get('id'))
        cursor = (body.get('pagination') or {}).get('cursor')
        if not cursor or not segments:
            break
    return ids


def _delete_all_segments(bid: str) -> int:
    """Delete every scheduled segment for the broadcaster. Returns the count
    actually removed."""
    base = f'{HELIX}/schedule/segment?broadcaster_id={bid}'
    deleted = 0
    for seg_id in _all_segment_ids(bid):
        if _request('DELETE', f'{base}&id={seg_id}').ok:
            deleted += 1
    return deleted


def _schedule_broadcaster() -> tuple[str | None, Response | None]:
    """Shared guard for the schedule actions: require a user token + resolved
    broadcaster id. Returns (broadcaster_id, None) on success, else (None,
    error Response)."""
    try:
        get_user_access_token()
    except TwitchAuthError as exc:
        return None, Response({'error': str(exc)}, status=status.HTTP_400_BAD_REQUEST)
    bid = resolve_broadcaster_id()
    if not bid:
        return None, Response(
            {'error': 'Could not resolve broadcaster id from the Twitch token.'},
            status=status.HTTP_400_BAD_REQUEST,
        )
    return bid, None


@api_view(['POST'])
def push_schedule(_req: Request) -> Response:  # noqa: ARG001 — unused; named _req so it doesn't shadow the module-level _request() Helix helper
    """Replace the Twitch channel schedule with the active event's lineup.

    Each game entry becomes a segment titled with the game, and — when the game
    carries a ``twitch_game_id`` — tagged with that Twitch **category** so the
    schedule shows the right box art. Break/start/end slots are skipped but
    still advance the clock."""
    bid, err = _schedule_broadcaster()
    if err is not None:
        return err

    event = models.Event.objects.filter(is_active=True).first()
    if not event:
        return Response({'error': 'no active event'}, status=400)

    entries = list(
        event.schedule.select_related('game').order_by('order')
    )
    if not entries:
        return Response({'error': 'no schedule entries'}, status=400)

    base = f'{HELIX}/schedule/segment?broadcaster_id={bid}'

    # 1) Clear the existing schedule first (idempotent re-push).
    deleted = _delete_all_segments(bid)

    # 2) Post each GAME entry as a new segment. Break/start/end slots have no
    #    game — skip them as segments, but still advance the cursor over their
    #    duration so the following game's start time accounts for the gap.
    cursor = event.start_time
    created = []
    categorised = 0
    for entry in entries:
        duration_min = entry.effective_minutes
        if entry.game is not None:
            body = {
                'start_time': cursor.isoformat().replace('+00:00', 'Z'),
                'timezone': 'Europe/London',
                'duration': str(duration_min),
                'title': entry.game.title,
            }
            # Twitch category (game) id, so the segment shows the right box art.
            category_id = (entry.game.twitch_game_id or '').strip()
            if category_id:
                body['category_id'] = category_id
            resp = _request('POST', base, json=body)
            if resp.ok:
                created.append(entry.id)
                if category_id:
                    categorised += 1
        cursor = cursor + timedelta(minutes=duration_min)

    return Response(
        {
            'event': event.name,
            'deleted_segments': deleted,
            'created_entries': created,
            'segment_count': len(created),
            'categorised_count': categorised,
        }
    )


@api_view(['POST'])
def clear_schedule(_req: Request) -> Response:  # noqa: ARG001 — see push_schedule
    """Delete every segment from the Twitch channel schedule."""
    bid, err = _schedule_broadcaster()
    if err is not None:
        return err
    deleted = _delete_all_segments(bid)
    return Response({'deleted_segments': deleted})

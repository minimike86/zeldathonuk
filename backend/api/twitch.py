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


HELIX = 'https://api.twitch.tv/helix'
TOKEN_URL = 'https://id.twitch.tv/oauth2/token'

# Refresh proactively when the token has this little time left, so a long-running
# request can't get half-way and then hit a 401.
REFRESH_LEEWAY = timedelta(seconds=60)


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


@api_view(['GET'])
def stream_status(request: Request) -> Response:
    """Return whether a Twitch channel is currently live.

    Query params: ?login=<channel-login>. Falls back to the active event's
    `twitch_channel` when omitted, so the homepage can call it without
    threading the channel into the URL. Lightweight response shape so
    consumers can poll on a short cadence without dragging metadata in.
    """
    login = (request.query_params.get('login') or '').strip().lower()
    if not login:
        event = models.Event.objects.filter(is_active=True).first()
        if event and event.twitch_channel:
            login = event.twitch_channel.strip().lower()
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


@api_view(['POST'])
def push_schedule(_req: Request) -> Response:  # noqa: ARG001 — unused; named _req so it doesn't shadow the module-level _request() Helix helper
    """Replace the Twitch channel schedule with the active event's lineup."""
    # Token first — gives a clear "no token configured" message rather than the
    # (now auto-resolved) broadcaster id being the apparent blocker.
    try:
        get_user_access_token()
    except TwitchAuthError as exc:
        return Response({'error': str(exc)}, status=status.HTTP_400_BAD_REQUEST)

    bid = resolve_broadcaster_id()
    if not bid:
        return Response(
            {'error': 'Could not resolve broadcaster id from the Twitch token.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    event = models.Event.objects.filter(is_active=True).first()
    if not event:
        return Response({'error': 'no active event'}, status=400)

    entries = list(
        event.schedule.select_related('game').order_by('order')
    )
    if not entries:
        return Response({'error': 'no schedule entries'}, status=400)

    base = f'{HELIX}/schedule/segment?broadcaster_id={bid}'

    # 1) Pull existing scheduled segments and delete them (idempotency).
    list_url = f'{HELIX}/schedule?broadcaster_id={bid}'
    existing = _request('GET', list_url)
    deleted = 0
    if existing.ok:
        segments = existing.json().get('data', {}).get('segments', []) or []
        for seg in segments:
            seg_id = seg.get('id')
            if seg_id:
                _request('DELETE', f'{base}&id={seg_id}')
                deleted += 1

    # 2) Post each GAME entry as a new segment. Break/start/end slots have no
    #    game — skip them as segments, but still advance the cursor over their
    #    duration so the following game's start time accounts for the gap.
    cursor = event.start_time
    created = []
    for entry in entries:
        duration_min = entry.effective_minutes
        if entry.game is not None:
            body = {
                'start_time': cursor.isoformat().replace('+00:00', 'Z'),
                'timezone': 'Europe/London',
                'duration': str(duration_min),
                'title': entry.game.title,
            }
            resp = _request('POST', base, json=body)
            if resp.ok:
                created.append(entry.id)
        cursor = cursor + timedelta(minutes=duration_min)

    return Response(
        {
            'event': event.name,
            'deleted_segments': deleted,
            'created_entries': created,
            'segment_count': len(created),
        }
    )

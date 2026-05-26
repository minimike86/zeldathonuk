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
- TWITCH_BROADCASTER_ID (your channel's numeric Twitch user id)

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


@api_view(['POST'])
def push_schedule(_request: Request) -> Response:
    """Replace the Twitch channel schedule with the active event's lineup."""
    if not _broadcaster_id():
        return Response(
            {'error': 'TWITCH_BROADCASTER_ID required'},
            status=status.HTTP_400_BAD_REQUEST,
        )
    try:
        get_user_access_token()
    except TwitchAuthError as exc:
        return Response({'error': str(exc)}, status=status.HTTP_400_BAD_REQUEST)

    event = models.Event.objects.filter(is_active=True).first()
    if not event:
        return Response({'error': 'no active event'}, status=400)

    entries = list(
        event.schedule.select_related('game').order_by('order')
    )
    if not entries:
        return Response({'error': 'no schedule entries'}, status=400)

    bid = _broadcaster_id()
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

    # 2) Post each schedule entry as a new segment.
    cursor = event.start_time
    created = []
    for entry in entries:
        duration_min = entry.effective_minutes
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

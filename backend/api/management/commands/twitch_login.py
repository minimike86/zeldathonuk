"""`python manage.py twitch_login` — mint a Twitch user OAuth token via the
OAuth 2.0 Device Code flow and save it into the TwitchOAuthToken singleton.

A drop-in replacement for `twitch token -u …` when the Twitch CLI isn't
installed. No redirect URI to register, no client secret needed for the grant —
just open a URL in a browser and authorise. Uses the app's TWITCH_CLIENT_ID
(the server still self-refreshes afterwards with the client secret, exactly as
it does for a CLI-minted token).

    docker compose exec backend python manage.py twitch_login
    # open the printed URL, authorise, done.

By default it requests every scope the app's Twitch features use (see
DEFAULT_SCOPES below). Pass --scopes "a b c" to request a different set.
"""
from __future__ import annotations

import time
from datetime import timedelta

import requests
from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone

from api import models
from api.twitch import DEFAULT_USER_SCOPES

DEVICE_URL = 'https://id.twitch.tv/oauth2/device'
TOKEN_URL = 'https://id.twitch.tv/oauth2/token'
DEVICE_GRANT = 'urn:ietf:params:oauth:grant-type:device_code'

# The full broadcaster scope set lives in api.twitch (shared with the in-app
# connect endpoints), so a single authorisation covers every Twitch feature.
DEFAULT_SCOPES = DEFAULT_USER_SCOPES


class Command(BaseCommand):
    help = 'Mint a Twitch user OAuth token via the device code flow (no Twitch CLI).'

    def add_arguments(self, parser):
        parser.add_argument(
            '--scopes', default='',
            help='Space-separated OAuth scopes. Defaults to the full set for the '
                 'primary channel, or just "channel:read:charity" with --channel.',
        )
        parser.add_argument(
            '--channel', default='',
            help='Mint a token for an ADDITIONAL channel (broadcaster login), '
                 'saved to a TwitchChannelConnection row instead of the primary '
                 'singleton. The broadcaster must authorise in the browser. '
                 'Scopes default to channel:read:charity. (The in-app Connect '
                 'button in /control/events does the same thing.)',
        )

    def handle(self, *args, **opts):
        client_id = settings.TWITCH_CLIENT_ID
        if not client_id:
            raise CommandError('TWITCH_CLIENT_ID is not set — configure it first.')
        channel = (opts.get('channel') or '').strip().lower()
        # Extra charity channels only need read:charity; the primary needs the
        # full feature set. An explicit --scopes always wins.
        scopes = opts['scopes'] or (
            'channel:read:charity' if channel else DEFAULT_SCOPES
        )

        # 1) Request a device + user code.
        resp = requests.post(
            DEVICE_URL, data={'client_id': client_id, 'scopes': scopes}, timeout=15,
        )
        if not resp.ok:
            raise CommandError(f'Device request failed ({resp.status_code}): {resp.text}')
        dev = resp.json()
        device_code = dev['device_code']
        interval = int(dev.get('interval', 5))
        deadline = time.time() + int(dev.get('expires_in', 1800))
        verify = dev.get('verification_uri_complete') or dev.get('verification_uri')

        self.stdout.write(self.style.MIGRATE_HEADING('\n  Authorise this device:'))
        self.stdout.write(f'    1. Open:  {verify}')
        if dev.get('user_code'):
            self.stdout.write(f'    2. Enter code:  {dev["user_code"]}')
        self.stdout.write(f'\n  Scopes: {scopes}')
        self.stdout.write('  Waiting for you to authorise…')
        self.stdout.flush()

        # 2) Poll the token endpoint until authorised (or it times out).
        while time.time() < deadline:
            time.sleep(interval)
            tr = requests.post(
                TOKEN_URL,
                data={
                    'client_id': client_id,
                    'scopes': scopes,
                    'device_code': device_code,
                    'grant_type': DEVICE_GRANT,
                },
                timeout=15,
            )
            if tr.ok:
                if channel:
                    ch = self._save_channel(tr.json(), channel)
                    self.stdout.write(self.style.SUCCESS(
                        f'\n  ✓ Token saved for charity channel "{ch.login}" '
                        f'(id {ch.broadcaster_id or "?"}). Run `twitch_eventsub` '
                        'to register its charity subscriptions, and '
                        '`poll_donations --twitch` to pull its donations.'
                    ))
                else:
                    self._save(tr.json())
                    self.stdout.write(self.style.SUCCESS(
                        '\n  ✓ Token saved to the TwitchOAuthToken row. '
                        'Push to Twitch schedule will work now.'
                    ))
                return
            message = ''
            try:
                message = (tr.json() or {}).get('message', '') or ''
            except ValueError:
                pass
            low = message.lower()
            if 'authorization_pending' in low or 'pending' in low:
                continue  # still waiting on the browser
            if 'slow_down' in low:
                interval += 2
                continue
            raise CommandError(f'Token poll failed ({tr.status_code}): {tr.text}')

        raise CommandError('Timed out waiting for authorisation. Run the command again.')

    def _save(self, data: dict) -> None:
        tok = models.TwitchOAuthToken.get()
        tok.access_token = data['access_token']
        tok.refresh_token = data.get('refresh_token', '')
        tok.expires_at = timezone.now() + timedelta(seconds=int(data['expires_in']))
        scope = data.get('scope') or []
        tok.scopes = ' '.join(scope) if isinstance(scope, list) else str(scope)
        tok.save()

    def _save_channel(self, data: dict, login_hint: str) -> 'models.TwitchChannelConnection':
        """Persist an additional channel's token into a TwitchChannelConnection,
        via the shared twitch.save_connection helper (resolves id/login/display
        from the freshly-minted token)."""
        from api import twitch  # local import: avoids loading requests at module import

        return twitch.save_connection(login_hint, data)

"""`python manage.py twitch_eventsub` — register (sync) the Twitch EventSub
webhook subscriptions this app consumes, pointed at the public
/api/twitch/eventsub/ endpoint.

Idempotent: lists the app's existing subscriptions and only creates the ones
that are missing (matched on type + condition). Pass --prune to also delete
any of OUR managed types that are stale (wrong callback, or in a
failed/revoked state). Other apps' subscriptions are never touched.

Requires (settings / .env):
  - TWITCH_CLIENT_ID + TWITCH_CLIENT_SECRET   (app token, minted automatically)
  - TWITCH_EVENTSUB_SECRET                    (HMAC secret; also verified on intake)
  - TWITCH_EVENTSUB_CALLBACK_URL              (public https URL of the endpoint)
  - a configured Twitch user token            (broadcaster id auto-resolved)

The broadcaster must have authorised the scopes each type needs (run
`manage.py twitch_login`). channel.raid needs no scope.

    docker compose exec backend python manage.py twitch_eventsub
    docker compose exec backend python manage.py twitch_eventsub --prune --dry-run
"""
from __future__ import annotations

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError

from api import twitch


def _desired(bid: str) -> list[dict]:
    """The subscription set we consume. `key` is a stable (type, sorted-
    condition) identity used to match against existing subs so re-running
    doesn't duplicate. channel.follow is v2 (needs a moderator id)."""
    broadcaster = {'broadcaster_user_id': bid}
    return [
        {'type': 'channel.follow', 'version': '2',
         'condition': {'broadcaster_user_id': bid, 'moderator_user_id': bid}},
        {'type': 'channel.subscribe', 'version': '1', 'condition': broadcaster},
        {'type': 'channel.subscription.gift', 'version': '1', 'condition': broadcaster},
        {'type': 'channel.subscription.message', 'version': '1', 'condition': broadcaster},
        {'type': 'channel.cheer', 'version': '1', 'condition': broadcaster},
        {'type': 'channel.raid', 'version': '1', 'condition': {'to_broadcaster_user_id': bid}},
        {'type': 'channel.charity_campaign.donate', 'version': '1', 'condition': broadcaster},
        {'type': 'channel.charity_campaign.start', 'version': '1', 'condition': broadcaster},
        {'type': 'channel.charity_campaign.progress', 'version': '1', 'condition': broadcaster},
        {'type': 'channel.charity_campaign.stop', 'version': '1', 'condition': broadcaster},
    ]


def _identity(sub_type: str, condition: dict) -> tuple:
    return (sub_type, tuple(sorted((condition or {}).items())))


class Command(BaseCommand):
    help = 'Register/sync the Twitch EventSub webhook subscriptions. Idempotent.'

    def add_arguments(self, parser):
        parser.add_argument('--prune', action='store_true',
                             help='Delete our managed subscriptions that are stale '
                                  '(wrong callback or failed/revoked state).')
        parser.add_argument('--dry-run', action='store_true',
                             help='Show what would change without calling Twitch to create/delete.')
        parser.add_argument('--list', action='store_true',
                             help='List current subscriptions + statuses and exit (read-only). '
                                  'Only needs TWITCH_CLIENT_ID/SECRET.')

    def handle(self, *args, **opts):
        # Listing is read-only and only needs the app credentials.
        for name in ('TWITCH_CLIENT_ID', 'TWITCH_CLIENT_SECRET'):
            if not getattr(settings, name, ''):
                raise CommandError(f'{name} is not set — configure it first.')
        if opts['list']:
            self._list()
            return

        for name in ('TWITCH_EVENTSUB_SECRET', 'TWITCH_EVENTSUB_CALLBACK_URL'):
            if not getattr(settings, name, ''):
                raise CommandError(f'{name} is not set — configure it first.')
        callback = settings.TWITCH_EVENTSUB_CALLBACK_URL.strip()
        if not callback.startswith('https://'):
            raise CommandError(
                'TWITCH_EVENTSUB_CALLBACK_URL must be an https:// URL (Twitch requires TLS).'
            )
        # The Django route is /api/twitch/eventsub/ (trailing slash). Register
        # the exact served path so Twitch's verification POST isn't 301-redirected
        # (it doesn't follow redirects, which would fail verification).
        if not callback.endswith('/'):
            callback += '/'
        secret = settings.TWITCH_EVENTSUB_SECRET
        dry = opts['dry_run']

        bid = twitch.resolve_broadcaster_id()
        if not bid:
            raise CommandError(
                'Could not resolve broadcaster id — run `manage.py twitch_login` first.'
            )

        desired = _desired(bid)
        desired_ids = {_identity(d['type'], d['condition']) for d in desired}
        our_types = {d['type'] for d in desired}

        try:
            existing = twitch.list_eventsub_subscriptions()
        except twitch.TwitchAuthError as exc:
            raise CommandError(str(exc))

        # Index existing by identity → keep the first per identity.
        existing_by_id: dict[tuple, dict] = {}
        for sub in existing:
            existing_by_id.setdefault(_identity(sub.get('type', ''), sub.get('condition', {})), sub)

        created = skipped = pruned = failed = 0

        # Create the missing (or stale-callback / dead-status) ones.
        for d in desired:
            ident = _identity(d['type'], d['condition'])
            cur = existing_by_id.get(ident)
            healthy = (
                cur
                and cur.get('status') == 'enabled'
                and (cur.get('transport') or {}).get('callback') == callback
            )
            if healthy:
                skipped += 1
                self.stdout.write(f'  = {d["type"]} (already enabled)')
                continue
            self.stdout.write(self.style.MIGRATE_HEADING(f'  + {d["type"]}'))
            if dry:
                created += 1
                continue
            resp = twitch.create_eventsub_subscription(
                d['type'], d['version'], d['condition'], callback, secret,
            )
            if resp.ok:
                created += 1
            else:
                failed += 1
                self.stdout.write(self.style.ERROR(
                    f'    ! {resp.status_code}: {resp.text[:300]}'
                ))

        # Prune our managed subs that are stale (wrong callback or dead status).
        if opts['prune']:
            for sub in existing:
                if sub.get('type') not in our_types:
                    continue  # never touch other apps' / other types
                ident = _identity(sub.get('type', ''), sub.get('condition', {}))
                wrong_cb = (sub.get('transport') or {}).get('callback') != callback
                dead = sub.get('status') != 'enabled'
                if ident in desired_ids and not wrong_cb and not dead:
                    continue  # healthy + wanted → keep
                self.stdout.write(self.style.WARNING(
                    f'  - prune {sub.get("type")} [{sub.get("status")}] {sub.get("id")}'
                ))
                if not dry:
                    twitch.delete_eventsub_subscription(sub.get('id'))
                pruned += 1

        verb = 'Would change' if dry else 'Done'
        self.stdout.write(self.style.SUCCESS(
            f'\n{verb}. created {created}, kept {skipped}, pruned {pruned}, failed {failed}.'
        ))

    def _list(self):
        """Read-only: print every EventSub subscription + status + callback."""
        try:
            subs = twitch.list_eventsub_subscriptions()
        except twitch.TwitchAuthError as exc:
            raise CommandError(str(exc))
        if not subs:
            self.stdout.write('No EventSub subscriptions registered.')
            return
        from collections import Counter
        counts = Counter(s.get('status') for s in subs)
        for s in sorted(subs, key=lambda x: (x.get('status', ''), x.get('type', ''))):
            status = s.get('status', '?')
            callback = (s.get('transport') or {}).get('callback', '')
            line = f'  {status:38} {s.get("type"):34} {callback}'
            style = self.style.SUCCESS if status == 'enabled' else self.style.ERROR
            self.stdout.write(style(line))
        summary = ', '.join(f'{k}={v}' for k, v in counts.items())
        self.stdout.write(self.style.SUCCESS(f'\n{len(subs)} subscription(s): {summary}'))

"""`python manage.py poll_donations` — pull recent donations from Tiltify and
JustGiving and ingest them through the same code path as the webhooks.

Run on a cron / docker-compose tick / GitHub Actions schedule when you don't
have webhook URLs configured.
"""
from __future__ import annotations

from django.conf import settings
from django.core.management.base import BaseCommand
from django.utils import timezone

from api import models
from api.webhooks import _active_event, _ingest


class Command(BaseCommand):
    help = 'Poll Tiltify + JustGiving for recent donations and ingest them.'

    def add_arguments(self, parser):
        parser.add_argument('--tiltify', action='store_true', help='Only poll Tiltify')
        parser.add_argument('--justgiving', action='store_true', help='Only poll JustGiving')
        parser.add_argument('--twitch', action='store_true', help='Only poll Twitch Charity')

    def handle(self, *args, **options):
        both = not (options['tiltify'] or options['justgiving'] or options['twitch'])
        if both or options['tiltify']:
            self._tiltify()
        if both or options['justgiving']:
            self._justgiving()
        if both or options['twitch']:
            self._twitch()

    # ──────────────────────────────────────────────────────────────────────
    # Tiltify v5 — campaign donations (per-event, OAuth2). Campaign id(s) come
    # from the active event's Tiltify DonationPages; the OAuth token, fetch +
    # ingest logic lives in api/tiltify.py so this command and the
    # /api/tiltify/test/ button share one path.
    # ──────────────────────────────────────────────────────────────────────
    def _tiltify(self) -> None:
        from api import tiltify
        creds = (settings.TILTIFY_CLIENT_ID and settings.TILTIFY_CLIENT_SECRET) \
            or settings.TILTIFY_ACCESS_TOKEN
        if not creds:
            self.stderr.write(
                'TILTIFY_CLIENT_ID/SECRET (or TILTIFY_ACCESS_TOKEN) not set; '
                'skipping Tiltify.'
            )
            return
        event = _active_event()
        if not event:
            self.stderr.write('Tiltify: no active event; skipping.')
            return
        if not tiltify.event_pages(event):
            self.stderr.write(
                'Tiltify: no Tiltify Donation Page linked to the active event; '
                'skipping.'
            )
            return
        try:
            result = tiltify.ingest_event(event)
        except tiltify.TiltifyError as exc:
            self.stderr.write(f'Tiltify: {exc}')
            return
        for page in result['pages']:
            self.stdout.write(self.style.SUCCESS(
                f"Tiltify [{page['campaign_id']}]: ingested {page['ingested']} "
                f"of {page['fetched']} fetched"
            ))

    # ──────────────────────────────────────────────────────────────────────
    # JustGiving — fundraising page donations (per-event, polling-only).
    # Page short name(s) come from the active event's DonationPages; the
    # fetch + ingest logic lives in api/justgiving.py so this command and the
    # /api/justgiving/test/ button share one path.
    # ──────────────────────────────────────────────────────────────────────
    def _justgiving(self) -> None:
        from api import justgiving
        if not settings.JUSTGIVING_API_KEY:
            self.stderr.write('JUSTGIVING_API_KEY not set; skipping JustGiving.')
            return
        event = _active_event()
        if not event:
            self.stderr.write('JustGiving: no active event; skipping.')
            return
        if not justgiving.event_pages(event):
            self.stderr.write(
                'JustGiving: no JustGiving Donation Page linked to the active '
                'event; skipping.'
            )
            return
        try:
            result = justgiving.ingest_event(event)
        except justgiving.JustGivingError as exc:
            self.stderr.write(f'JustGiving: {exc}')
            return
        for page in result['pages']:
            self.stdout.write(self.style.SUCCESS(
                f"JustGiving [{page['short_name']}]: ingested {page['ingested']} "
                f"of {page['fetched']} fetched"
            ))

    # ──────────────────────────────────────────────────────────────────────
    # Twitch Charity — Helix /charity/campaigns + /charity/donations
    # Fallback for when the EventSub webhook can't be reached (no public
    # HTTPS callback). Uses the broadcaster's user OAuth token.
    # ──────────────────────────────────────────────────────────────────────
    def _twitch(self) -> None:
        # Imported lazily so the command still runs (Tiltify/JustGiving) even
        # if the Twitch helpers fail to import for any reason.
        from api import twitch
        from api.eventsub import _charity_amount, _charity_currency, _upsert_charity_campaign

        # Poll the primary broadcaster plus every active extra channel. Each
        # needs its OWN token (Twitch charity endpoints are per-broadcaster).
        for label, tok, bid in twitch.charity_poll_sources():
            try:
                campaign = twitch.fetch_active_charity_campaign(tok=tok, broadcaster_id=bid)
            except twitch.TwitchAuthError as exc:
                self.stderr.write(f'Twitch charity [{label}]: {exc}')
                continue
            if not campaign:
                self.stdout.write(f'Twitch charity [{label}]: no active campaign; skipping.')
                continue
            # Mirror Twitch's own running total / target into the campaign row so
            # the goal display stays fresh even between EventSub progress pushes.
            _upsert_charity_campaign(
                campaign, 'channel.charity_campaign.progress', timezone.now()
            )
            # Tag every donation from this source with the campaign's channel so
            # they merge into one total while staying attributable.
            source_channel = (campaign.get('broadcaster_login') or '').strip().lower()
            donations = twitch.fetch_charity_donations(
                str(campaign.get('id') or ''), tok=tok, broadcaster_id=bid,
            )
            # Twitch's currency field is unreliable ('USD'); use the event's.
            currency = _charity_currency()
            count = 0
            for d in donations:
                amount = _charity_amount(d.get('amount'))
                if amount is None or amount <= 0:
                    continue
                donation = _ingest(
                    platform=models.DonationPlatform.TWITCH_CHARITY,
                    external_id=str(d.get('id') or ''),
                    donor_name=d.get('user_name', 'Anonymous') or 'Anonymous',
                    amount=amount,
                    currency=currency,
                    source_channel=source_channel,
                )
                if donation:
                    count += 1
            self.stdout.write(self.style.SUCCESS(
                f'Twitch charity [{label}]: ingested {count} donations'
            ))

"""`python manage.py poll_donations` — pull recent donations from Tiltify and
JustGiving and ingest them through the same code path as the webhooks.

Run on a cron / docker-compose tick / GitHub Actions schedule when you don't
have webhook URLs configured.
"""
from __future__ import annotations

from datetime import datetime
from decimal import Decimal

import requests
from django.conf import settings
from django.core.management.base import BaseCommand
from django.utils import timezone

from api import models
from api.webhooks import _ingest


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
    # Tiltify v5 — campaign donations endpoint
    # https://developers.tiltify.com
    # ──────────────────────────────────────────────────────────────────────
    def _tiltify(self) -> None:
        token = settings.TILTIFY_ACCESS_TOKEN
        cid = settings.TILTIFY_CAMPAIGN_ID
        if not token or not cid:
            self.stderr.write('TILTIFY_ACCESS_TOKEN + TILTIFY_CAMPAIGN_ID not set; skipping.')
            return
        url = f'https://v5api.tiltify.com/api/public/campaigns/{cid}/donations'
        resp = requests.get(
            url, headers={'Authorization': f'Bearer {token}'}, timeout=20
        )
        if not resp.ok:
            self.stderr.write(f'Tiltify error {resp.status_code}: {resp.text[:200]}')
            return
        items = resp.json().get('data', []) or []
        count = 0
        for d in items:
            amt = d.get('amount') or {}
            donation = _ingest(
                platform=models.DonationPlatform.TILTIFY,
                external_id=str(d.get('id', '')),
                donor_name=d.get('donor_name', 'Anonymous'),
                amount=Decimal(str(amt.get('value', '0'))),
                currency=amt.get('currency', 'GBP'),
                message=d.get('donor_comment', '') or '',
                donated_at=_parse_iso(d.get('completed_at')),
            )
            if donation:
                count += 1
        self.stdout.write(self.style.SUCCESS(f'Tiltify: ingested {count} donations'))

    # ──────────────────────────────────────────────────────────────────────
    # JustGiving — fundraising page donations
    # ──────────────────────────────────────────────────────────────────────
    def _justgiving(self) -> None:
        api_key = settings.JUSTGIVING_API_KEY
        page = settings.JUSTGIVING_PAGE_SHORTNAME
        if not api_key or not page:
            self.stderr.write('JUSTGIVING_API_KEY + JUSTGIVING_PAGE_SHORTNAME not set; skipping.')
            return
        url = f'https://api.justgiving.com/{api_key}/v1/fundraising/pages/{page}/donations'
        resp = requests.get(
            url, headers={'Accept': 'application/json'}, timeout=20
        )
        if not resp.ok:
            self.stderr.write(f'JustGiving error {resp.status_code}: {resp.text[:200]}')
            return
        items = resp.json().get('donations', []) or []
        count = 0
        for d in items:
            donation = _ingest(
                platform=models.DonationPlatform.JUSTGIVING,
                external_id=str(d.get('id') or d.get('donationRef', '')),
                donor_name=d.get('donorDisplayName', 'Anonymous'),
                amount=Decimal(str(d.get('amount', '0'))),
                currency=d.get('currencyCode', 'GBP'),
                message=d.get('message', '') or '',
                donated_at=_parse_jg_date(d.get('donationDate', '')),
                gift_aid_amount=(
                    Decimal(str(d['estimatedTaxReclaim']))
                    if d.get('estimatedTaxReclaim')
                    else None
                ),
                image_url=d.get('image', '') or '',
            )
            if donation:
                count += 1
        self.stdout.write(self.style.SUCCESS(f'JustGiving: ingested {count} donations'))

    # ──────────────────────────────────────────────────────────────────────
    # Twitch Charity — Helix /charity/campaigns + /charity/donations
    # Fallback for when the EventSub webhook can't be reached (no public
    # HTTPS callback). Uses the broadcaster's user OAuth token.
    # ──────────────────────────────────────────────────────────────────────
    def _twitch(self) -> None:
        # Imported lazily so the command still runs (Tiltify/JustGiving) even
        # if the Twitch helpers fail to import for any reason.
        from api import twitch
        from api.eventsub import _charity_amount, _upsert_charity_campaign

        try:
            campaign = twitch.fetch_active_charity_campaign()
        except twitch.TwitchAuthError as exc:
            self.stderr.write(f'Twitch charity: {exc}')
            return
        if not campaign:
            self.stdout.write('Twitch charity: no active campaign; skipping.')
            return
        # Mirror Twitch's own running total / target into the campaign row so
        # the goal display stays fresh even between EventSub progress pushes.
        _upsert_charity_campaign(
            campaign, 'channel.charity_campaign.progress', timezone.now()
        )
        donations = twitch.fetch_charity_donations(str(campaign.get('id') or ''))
        count = 0
        for d in donations:
            amount = _charity_amount(d.get('amount'))
            if amount is None or amount <= 0:
                continue
            currency = ((d.get('amount') or {}).get('currency') or 'GBP')[:3].upper()
            donation = _ingest(
                platform=models.DonationPlatform.TWITCH_CHARITY,
                external_id=str(d.get('id') or ''),
                donor_name=d.get('user_name', 'Anonymous') or 'Anonymous',
                amount=amount,
                currency=currency,
            )
            if donation:
                count += 1
        self.stdout.write(self.style.SUCCESS(f'Twitch charity: ingested {count} donations'))


def _parse_iso(value: str | None):
    if not value:
        return timezone.now()
    try:
        return datetime.fromisoformat(value.replace('Z', '+00:00'))
    except ValueError:
        return timezone.now()


def _parse_jg_date(value: str) -> 'datetime':
    """JustGiving emits `/Date(1610767455000+0000)/`. Pull the millis out."""
    try:
        millis = int(value[6:-7])
        return datetime.fromtimestamp(millis / 1000, tz=timezone.utc)
    except (ValueError, IndexError):
        return timezone.now()

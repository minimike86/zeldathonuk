"""Tests for the Twitch Charity EventSub intake.

Cover the path that turns a ``channel.charity_campaign.donate`` delivery into a
``Donation`` row, the (platform, external_id) dedupe across re-deliveries, the
minor-units amount conversion, the campaign progress upsert, and signature
rejection. The endpoint must accept *anonymous* POSTs (Twitch authenticates via
the HMAC signature, not a Clerk JWT) — a regression guard for the AllowAny fix.
"""
from __future__ import annotations

import hashlib
import hmac
import json
from decimal import Decimal

from django.test import TestCase, override_settings
from django.urls import reverse
from django.utils import timezone

from api import models
from api.eventsub import _charity_amount


SECRET = 'test-eventsub-secret'


def _sign(msg_id: str, ts: str, body: bytes, secret: str = SECRET) -> str:
    payload = msg_id.encode() + ts.encode() + body
    return 'sha256=' + hmac.new(secret.encode(), payload, hashlib.sha256).hexdigest()


@override_settings(TWITCH_EVENTSUB_SECRET=SECRET)
class CharityEventSubTests(TestCase):
    def setUp(self):
        self.url = reverse('twitch-eventsub')
        self.event = models.Event.objects.create(
            name='Test Zeldathon', start_time=timezone.now(), is_active=True,
        )

    def _post(self, payload: dict, *, msg_id='msg-1', msg_type='notification',
              secret=SECRET):
        raw = json.dumps(payload).encode()
        ts = '2026-06-03T12:00:00Z'
        headers = {
            'HTTP_TWITCH_EVENTSUB_MESSAGE_ID': msg_id,
            'HTTP_TWITCH_EVENTSUB_MESSAGE_TIMESTAMP': ts,
            'HTTP_TWITCH_EVENTSUB_MESSAGE_TYPE': msg_type,
            'HTTP_TWITCH_EVENTSUB_MESSAGE_SIGNATURE': _sign(msg_id, ts, raw, secret),
        }
        return self.client.post(
            self.url, data=raw, content_type='application/json', **headers,
        )

    @staticmethod
    def _donate_payload(donation_id='don-1', value=1234):
        return {
            'subscription': {
                'id': 'sub-1', 'type': 'channel.charity_campaign.donate',
                'version': '1',
            },
            'event': {
                'id': donation_id,
                'campaign_id': 'camp-1',
                'broadcaster_id': '123',
                'broadcaster_login': 'zeldathonuk',
                'user_id': '456',
                'user_name': 'TestDonor',
                'charity_name': 'SpecialEffect',
                'amount': {'value': value, 'decimal_places': 2, 'currency': 'GBP'},
            },
        }

    def test_anonymous_post_accepted(self):
        """The regression guard: no Clerk auth header, yet intake succeeds."""
        resp = self._post(self._donate_payload())
        self.assertEqual(resp.status_code, 202)

    def test_donate_creates_donation(self):
        self._post(self._donate_payload(value=1234))
        donation = models.Donation.objects.get(
            platform=models.DonationPlatform.TWITCH_CHARITY, external_id='don-1',
        )
        self.assertEqual(donation.amount, Decimal('12.34'))
        self.assertEqual(donation.donor_name, 'TestDonor')
        self.assertEqual(donation.currency, 'GBP')
        self.assertEqual(donation.event_id, self.event.id)
        self.assertEqual(donation.source_channel, 'zeldathonuk')

    def test_donate_tags_source_channel(self):
        # A second channel's donation merges into the same event but is tagged.
        payload = self._donate_payload(donation_id='don-msec')
        payload['event']['broadcaster_login'] = 'MSec'  # mixed case from Twitch
        self._post(payload)
        donation = models.Donation.objects.get(external_id='don-msec')
        self.assertEqual(donation.source_channel, 'msec')  # normalised lowercase
        self.assertEqual(donation.event_id, self.event.id)  # same combined total

    def test_redelivery_dedupes(self):
        # Same donation id, different message id (a real Twitch retry) → still one row.
        self._post(self._donate_payload(donation_id='don-2'), msg_id='msg-a')
        self._post(self._donate_payload(donation_id='don-2'), msg_id='msg-b')
        self.assertEqual(
            models.Donation.objects.filter(external_id='don-2').count(), 1,
        )

    def test_no_active_event_is_noop(self):
        models.Event.objects.update(is_active=False)
        resp = self._post(self._donate_payload(donation_id='don-3'))
        self.assertEqual(resp.status_code, 202)  # ack so Twitch doesn't retry
        self.assertFalse(models.Donation.objects.filter(external_id='don-3').exists())

    def test_progress_upserts_campaign(self):
        payload = {
            'subscription': {
                'type': 'channel.charity_campaign.progress', 'version': '1',
            },
            'event': {
                'id': 'camp-1',
                'broadcaster_id': '123',
                'charity_name': 'SpecialEffect',
                'charity_logo': 'https://example.test/logo.png',
                'current_amount': {'value': 260000, 'decimal_places': 2, 'currency': 'GBP'},
                'target_amount': {'value': 1500000, 'decimal_places': 2, 'currency': 'GBP'},
            },
        }
        self._post(payload)
        campaign = models.TwitchCharityCampaign.objects.get(campaign_id='camp-1')
        self.assertEqual(campaign.current_amount, Decimal('2600.00'))
        self.assertEqual(campaign.target_amount, Decimal('15000.00'))
        self.assertTrue(campaign.is_active)
        self.assertEqual(campaign.charity_name, 'SpecialEffect')

    def test_stop_marks_campaign_inactive(self):
        models.TwitchCharityCampaign.objects.create(
            campaign_id='camp-1', charity_name='SpecialEffect', is_active=True,
        )
        payload = {
            'subscription': {'type': 'channel.charity_campaign.stop', 'version': '1'},
            'event': {'id': 'camp-1', 'broadcaster_id': '123'},
        }
        self._post(payload)
        campaign = models.TwitchCharityCampaign.objects.get(campaign_id='camp-1')
        self.assertFalse(campaign.is_active)
        self.assertIsNotNone(campaign.stopped_at)

    def test_bad_signature_rejected(self):
        raw = json.dumps(self._donate_payload(donation_id='don-9')).encode()
        ts = '2026-06-03T12:00:00Z'
        headers = {
            'HTTP_TWITCH_EVENTSUB_MESSAGE_ID': 'msg-9',
            'HTTP_TWITCH_EVENTSUB_MESSAGE_TIMESTAMP': ts,
            'HTTP_TWITCH_EVENTSUB_MESSAGE_TYPE': 'notification',
            'HTTP_TWITCH_EVENTSUB_MESSAGE_SIGNATURE': 'sha256=deadbeef',
        }
        resp = self.client.post(
            self.url, data=raw, content_type='application/json', **headers,
        )
        self.assertEqual(resp.status_code, 403)
        self.assertFalse(models.Donation.objects.filter(external_id='don-9').exists())

    def test_verification_challenge_echoed(self):
        challenge = 'abc123-challenge'
        payload = {
            'subscription': {'type': 'channel.charity_campaign.donate', 'version': '1'},
            'challenge': challenge,
        }
        resp = self._post(payload, msg_type='webhook_callback_verification')
        self.assertEqual(resp.status_code, 200)
        # Must be the raw string, not JSON-quoted, or Twitch's match fails.
        self.assertEqual(resp.content.decode(), challenge)


class CharityAmountTests(TestCase):
    def test_minor_units_to_decimal(self):
        self.assertEqual(
            _charity_amount({'value': 1234, 'decimal_places': 2}), Decimal('12.34'),
        )

    def test_three_decimal_places(self):
        self.assertEqual(
            _charity_amount({'value': 12345, 'decimal_places': 3}), Decimal('12.35'),
        )

    def test_bad_shapes_return_none(self):
        self.assertIsNone(_charity_amount(None))
        self.assertIsNone(_charity_amount('nope'))
        self.assertIsNone(_charity_amount({'value': 'x'}))

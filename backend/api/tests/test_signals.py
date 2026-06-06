"""Signal receivers: CORS origin allow-list + milestone-on-donation + chat
announce on a fresh donation."""
from __future__ import annotations

from decimal import Decimal
from unittest.mock import patch

from django.test import RequestFactory, TestCase
from django.utils import timezone

from api import models, signals


class CorsSignalTests(TestCase):
    def test_no_origin_returns_false(self):
        req = RequestFactory().get('/')
        self.assertFalse(signals.cors_allow_configured_origins(None, req))

    def test_configured_origin_allowed(self):
        cfg = models.AuthConfig.get()
        cfg.web_origins = 'https://allowed.example'
        cfg.save()
        req = RequestFactory().get('/', HTTP_ORIGIN='https://allowed.example')
        self.assertTrue(signals.cors_allow_configured_origins(None, req))

    def test_unknown_origin_denied(self):
        req = RequestFactory().get('/', HTTP_ORIGIN='https://nope.example')
        self.assertFalse(signals.cors_allow_configured_origins(None, req))


class DonationMilestoneSignalTests(TestCase):
    def setUp(self):
        self.event = models.Event.objects.create(
            name='E', start_time=timezone.now(), is_active=True, currency_symbol='£',
        )
        self.milestone = models.Milestone.objects.create(
            event=self.event, name='£10', threshold_amount=Decimal('10'),
        )

    @patch('api.chat.announce')
    def test_donation_crossing_marks_milestone_and_announces(self, mock_announce):
        models.Donation.objects.create(
            event=self.event, donor_name='Kris', amount=Decimal('15'),
            platform=models.DonationPlatform.DIRECT, external_id='d-sig-1',
        )
        self.milestone.refresh_from_db()
        self.assertTrue(self.milestone.is_reached)
        # Both the milestone and the donation announcements fire.
        kinds = {c.args[1] for c in mock_announce.call_args_list}
        self.assertIn('milestone', kinds)
        self.assertIn('donation', kinds)

    @patch('api.chat.announce')
    def test_muted_donation_skips_announce(self, mock_announce):
        models.Donation.objects.create(
            event=self.event, donor_name='Quiet', amount=Decimal('3'),
            platform=models.DonationPlatform.DIRECT, external_id='d-sig-2',
            mute_reason=models.MuteReason.OTHER,
        )
        kinds = {c.args[1] for c in mock_announce.call_args_list}
        self.assertNotIn('donation', kinds)

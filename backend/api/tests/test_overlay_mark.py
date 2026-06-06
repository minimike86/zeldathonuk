"""Tests for the overlay-driven 'mark read / mark announced' actions.

OBS browser sources are unauthenticated, so /api/donations/<id>/mark_read/
and /api/milestones/<id>/mark_announced/ are AllowAny. These lock in that
they (a) work anonymously, (b) set the right state, and (c) don't clobber
a stronger existing mute. Also covers the milestone reset clearing both
reached_at and announced.
"""
from __future__ import annotations

from decimal import Decimal

from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APITestCase

from api import models


def _event():
    return models.Event.objects.create(
        name='Mark Event', start_time=timezone.now(), is_active=True,
        currency_symbol='£',
    )


def _donation(event, *, reason=models.MuteReason.NONE):
    return models.Donation.objects.create(
        event=event, platform='justgiving', donor_name='Kris',
        amount=Decimal('10.00'), currency='GBP', message='gg',
        donated_at=timezone.now(), external_id='x', mute_reason=reason,
    )


class DonationMarkReadTests(APITestCase):
    def setUp(self):
        self.event = _event()

    def test_marks_unmuted_donation_already_announced_anonymously(self):
        d = _donation(self.event)
        # No auth credentials on the client → exercises AllowAny.
        res = self.client.post(f'/api/donations/{d.id}/mark_read/')
        self.assertEqual(res.status_code, 200)
        d.refresh_from_db()
        self.assertEqual(d.mute_reason, models.MuteReason.ALREADY_ANNOUNCED)
        self.assertTrue(d.is_muted)

    def test_does_not_clobber_a_stronger_mute(self):
        d = _donation(self.event, reason=models.MuteReason.NAUGHTY_MESSAGE)
        res = self.client.post(f'/api/donations/{d.id}/mark_read/')
        self.assertEqual(res.status_code, 200)
        d.refresh_from_db()
        self.assertEqual(d.mute_reason, models.MuteReason.NAUGHTY_MESSAGE)

    def test_still_counts_toward_totals(self):
        d = _donation(self.event)
        self.client.post(f'/api/donations/{d.id}/mark_read/')
        res = self.client.get(f'/api/donations/totals/?event={self.event.id}')
        self.assertEqual(Decimal(str(res.data['grand_total'])), Decimal('10.00'))
        self.assertEqual(res.data['donation_count'], 1)


class MilestoneMarkAnnouncedTests(APITestCase):
    def setUp(self):
        self.event = _event()
        self.m = models.Milestone.objects.create(
            event=self.event, name='£5k', threshold_amount=Decimal('5000'),
            reached_at=timezone.now(),
        )

    def test_marks_announced_anonymously(self):
        self.assertFalse(self.m.announced)
        res = self.client.post(f'/api/milestones/{self.m.id}/mark_announced/')
        self.assertEqual(res.status_code, 200)
        self.m.refresh_from_db()
        self.assertTrue(self.m.announced)

    def test_reset_clears_reached_and_announced(self):
        self.m.announced = True
        self.m.save(update_fields=['announced'])
        # reset is operator-only; force-authenticate an operator.
        user = get_user_model().objects.create_user(username='op', password='x')
        models.Profile.objects.create(
            user=user, clerk_user_id='clerk_op',
            role=models.Profile.ROLE_OPERATOR,
        )
        self.client.force_authenticate(user=user)
        res = self.client.post(f'/api/milestones/{self.m.id}/reset/')
        self.assertEqual(res.status_code, 200)
        self.m.refresh_from_db()
        self.assertIsNone(self.m.reached_at)
        self.assertFalse(self.m.announced)

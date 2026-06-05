"""EventViewSet create/update (active-switch + seeding), raffle draw with an
eligible pool, and the remaining failure-hint category branches."""
from __future__ import annotations

from decimal import Decimal

from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APITestCase

from api import models


def _operator(client):
    user = get_user_model().objects.create_user(username='vf-op', password='x')
    models.Profile.objects.create(user=user, clerk_user_id='vf-clerk',
                                  role=models.Profile.ROLE_OPERATOR)
    client.force_authenticate(user=user)


class EventCreateUpdateTests(APITestCase):
    def setUp(self):
        _operator(self.client)
        self.existing = models.Event.objects.create(
            name='Old', start_time=timezone.now(), is_active=True,
        )

    def test_create_active_event_deactivates_others_and_seeds(self):
        res = self.client.post('/api/events/', {
            'name': 'New Event', 'start_time': timezone.now().isoformat(),
            'is_active': True, 'currency_symbol': '£',
        }, format='json')
        self.assertIn(res.status_code, (200, 201))
        self.existing.refresh_from_db()
        self.assertFalse(self.existing.is_active)  # demoted
        new = models.Event.objects.get(name='New Event')
        # Announcements seeded for the new event.
        self.assertTrue(new.chat_announcements.exists())

    def test_update_to_active_deactivates_others(self):
        other = models.Event.objects.create(name='Other', start_time=timezone.now())
        res = self.client.patch(f'/api/events/{other.id}/', {'is_active': True}, format='json')
        self.assertEqual(res.status_code, 200)
        self.existing.refresh_from_db()
        self.assertFalse(self.existing.is_active)


class RaffleDrawPoolTests(APITestCase):
    def setUp(self):
        _operator(self.client)
        self.event = models.Event.objects.create(
            name='E', start_time=timezone.now(), is_active=True,
        )
        self.raffle = models.Raffle.objects.create(event=self.event, name='Prize', is_active=True)

    def _post(self, url, body=None):
        return self.client.post(url, body or {}, format='json')

    def test_draw_picks_weighted_winners(self):
        # Open first, THEN create donations so they fall inside the window.
        self._post(f'/api/raffles/{self.raffle.id}/open/')
        for i in range(4):
            models.Donation.objects.create(
                event=self.event, platform='justgiving', donor_name=f'D{i}',
                amount=Decimal('20'), currency='GBP', donated_at=timezone.now(),
                external_id=f'rfd{i}',
            )
        self._post(f'/api/raffles/{self.raffle.id}/close/')
        res = self._post(f'/api/raffles/{self.raffle.id}/draw/', {'quantity': 2})
        self.assertEqual(res.status_code, 200)
        self.assertGreaterEqual(models.RaffleWinner.objects.filter(raffle=self.raffle).count(), 1)


class FailureHintCategoryTests(APITestCase):
    def setUp(self):
        _operator(self.client)

    def test_hint_categories(self):
        Cat = models.ActivityLog.Category
        for cat in [Cat.OPERATOR_ACTION, Cat.WEBHOOK, Cat.SYSTEM]:
            models.ActivityLog.objects.create(
                category=cat, action='x.failed', summary='boom', level='error',
                status_code=404,
            )
        self.assertEqual(self.client.get('/api/queue/').status_code, 200)
        self.assertEqual(self.client.get('/api/activity-log/?level=error').status_code, 200)

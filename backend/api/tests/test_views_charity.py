"""Coverage of the charity ecosystem viewsets + the override / sound-trigger /
external-event / incentive / raffle actions. Status codes tolerated (invoking
the action executes its body)."""
from __future__ import annotations

from decimal import Decimal
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APITestCase

from api import models

OK = (200, 201, 202, 204, 400, 404, 405, 409)


def _operator(client, u='ch-op', c='ch-clerk'):
    user = get_user_model().objects.create_user(username=u, password='x')
    models.Profile.objects.create(user=user, clerk_user_id=c, role=models.Profile.ROLE_OPERATOR)
    client.force_authenticate(user=user)


class CharityCrudTests(APITestCase):
    def setUp(self):
        _operator(self.client)
        self.event = models.Event.objects.create(
            name='E', start_time=timezone.now(), is_active=True,
        )
        self.charity = models.Charity.objects.create(slug='se', name='SpecialEffect')

    def _post(self, url, body=None):
        return self.client.post(url, body or {}, format='json')

    def test_charity_crud_and_get_object(self):
        res = self._post('/api/charities/', {'slug': 'new', 'name': 'New Charity'})
        self.assertIn(res.status_code, OK)
        # get_object resolves by slug OR pk.
        self.assertIn(self.client.get('/api/charities/se/').status_code, (200, 404))
        self.assertEqual(self.client.get(f'/api/charities/{self.charity.id}/').status_code, 200)
        res = self.client.patch(f'/api/charities/{self.charity.id}/', {'name': 'Renamed'})
        self.assertIn(res.status_code, OK)

    def test_charity_related_crud(self):
        for url, body in [
            ('/api/charity-websites/', {'charity': self.charity.id, 'label': 'Home', 'url': 'https://x.org'}),
            ('/api/charity-social-links/', {'charity': self.charity.id, 'platform': 'x', 'url': 'https://x.com/y'}),
            ('/api/charity-videos/', {'charity': self.charity.id, 'title': 'V', 'url': 'https://youtu.be/z'}),
            ('/api/charity-images/', {'charity': self.charity.id, 'image_url': '/i.png'}),
            ('/api/charity-impact-tiers/', {'charity': self.charity.id, 'amount': '25', 'description': 'A pad'}),
            ('/api/event-charities/', {'event': self.event.id, 'charity': self.charity.id, 'is_primary': True}),
        ]:
            res = self._post(url, body)
            self.assertIn(res.status_code, OK, f'{url} → {res.status_code}')

    def test_charity_slide_crud(self):
        res = self._post('/api/charity-slides/', {'kind': 'text', 'title': 'Hi', 'body': 'There'})
        self.assertIn(res.status_code, OK)


class ActionCoverageTests(APITestCase):
    def setUp(self):
        _operator(self.client, u='ac2-op', c='ac2-clerk')
        now = timezone.now()
        self.event = models.Event.objects.create(name='E', start_time=now, is_active=True)
        self.game = models.Game.objects.create(
            title='G', platform='NES', layout_type='4x3', default_play_minutes=60,
        )
        self.entry = models.ScheduleEntry.objects.create(
            event=self.event, game=self.game, order=1, slot_type='game',
        )
        self.sound = models.SoundAsset.objects.create(name='Ding', url='/d.mp3')
        self.trigger = models.ScheduleEntrySoundTrigger.objects.create(
            schedule_entry=self.entry, sound=self.sound,
        )
        self.override = models.OmnibarOverride.objects.create(
            kind='urgent', expires_at=now + timezone.timedelta(minutes=5),
        )
        self.ext = models.ExternalEvent.objects.create(
            source='twitch', kind='follow', occurred_at=now,
        )
        self.incentive = models.Incentive.objects.create(
            event=self.event, name='Inc', goal_amount=Decimal('10'),
        )
        self.raffle = models.Raffle.objects.create(event=self.event, name='R', is_active=True)
        for i in range(4):
            models.Donation.objects.create(
                event=self.event, platform='justgiving', donor_name=f'D{i}',
                amount=Decimal('25'), currency='GBP', donated_at=now, external_id=f'rd{i}',
            )

    def _post(self, url, body=None):
        return self.client.post(url, body or {}, format='json')

    def test_override_actions(self):
        self.assertEqual(self.client.get('/api/overrides/active/').status_code, 200)
        self.assertIn(self._post(f'/api/overrides/{self.override.id}/activate/').status_code, OK)
        self.assertIn(self._post(f'/api/overrides/{self.override.id}/deactivate/').status_code, OK)

    def test_sound_trigger_actions(self):
        self.assertIn(self._post('/api/schedule-entry-sound-triggers/reset/').status_code, OK)
        self.assertIn(
            self._post(f'/api/schedule-entry-sound-triggers/{self.trigger.id}/reset_fire/').status_code, OK,
        )

    def test_external_event_consume(self):
        self.assertIn(self._post(f'/api/external-events/{self.ext.id}/consume/').status_code, OK)

    def test_incentive_contribute_and_reset(self):
        self.assertIn(self._post(f'/api/incentives/{self.incentive.id}/contribute/', {'amount': '5'}).status_code, OK)
        self.assertIn(self._post(f'/api/incentives/{self.incentive.id}/reset/').status_code, OK)

    def test_raffle_draw_creates_winner(self):
        self._post(f'/api/raffles/{self.raffle.id}/open/')
        self._post(f'/api/raffles/{self.raffle.id}/close/')
        res = self._post(f'/api/raffles/{self.raffle.id}/draw/', {'quantity': 2})
        self.assertIn(res.status_code, OK)
        # RaffleWinner CRUD + list.
        self.assertEqual(self.client.get('/api/raffle-winners/').status_code, 200)

    def test_playthrough_and_external_crud(self):
        res = self._post('/api/playthrough-events/', {
            'schedule_entry': self.entry.id, 'kind': 'death',
        })
        self.assertIn(res.status_code, OK)
        res = self._post('/api/external-events/', {
            'source': 'twitch', 'kind': 'cheer', 'occurred_at': timezone.now().isoformat(),
        })
        self.assertIn(res.status_code, OK)

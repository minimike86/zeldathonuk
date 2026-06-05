"""The incentive contribute 'option' voting path + cascade through item sets."""
from __future__ import annotations

from decimal import Decimal

from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APITestCase

from api import models


def _operator(client):
    user = get_user_model().objects.create_user(username='iv-op', password='x')
    models.Profile.objects.create(user=user, clerk_user_id='iv-clerk',
                                  role=models.Profile.ROLE_OPERATOR)
    client.force_authenticate(user=user)


class IncentiveVoteTests(APITestCase):
    def setUp(self):
        _operator(self.client)
        self.event = models.Event.objects.create(name='E', start_time=timezone.now(), is_active=True)

    def test_contribute_to_option(self):
        inc = models.Incentive.objects.create(
            event=self.event, name='Name the hero', goal_amount=Decimal('50'),
            payload={'options': [{'id': 'a', 'label': 'Link', 'votes': 0},
                                 {'id': 'b', 'label': 'Zelda', 'votes': 0}]},
        )
        c = lambda body: self.client.post(  # noqa: E731
            f'/api/incentives/{inc.id}/contribute/', body, format='json')
        self.assertEqual(c({'amount': '10', 'option': 'a'}).status_code, 200)
        self.assertEqual(c({'amount': '5', 'option': 'b'}).status_code, 200)
        # Unknown option → 400.
        self.assertEqual(c({'amount': '5', 'option': 'zzz'}).status_code, 400)
        # Crossing the goal marks reached.
        c({'amount': '100', 'option': 'a'})
        inc.refresh_from_db()
        self.assertIsNotNone(inc.reached_at)


class ItemSetCascadeTests(APITestCase):
    def setUp(self):
        _operator(self.client)
        self.event = models.Event.objects.create(name='E', start_time=timezone.now(), is_active=True)
        self.game = models.Game.objects.create(
            title='G', platform='N64', layout_type='4x3', default_play_minutes=60,
        )
        self.iset = models.GameItemSet.objects.create(game=self.game, name='Medallions', kind='set', order=0)
        self.a = models.GameItem.objects.create(game=self.game, name='Bombos', category='weapon', order=0)
        self.b = models.GameItem.objects.create(game=self.game, name='Ether', category='weapon', order=1)
        self.a.sets.add(self.iset)
        self.b.sets.add(self.iset)
        self.a.unlocks_with.add(self.b)
        self.entry = models.ScheduleEntry.objects.create(
            event=self.event, game=self.game, order=1, slot_type='game',
        )
        cp = models.CurrentlyPlaying.get()
        cp.schedule_entry = self.entry
        cp.save()

    def test_collect_cascades_through_set_and_unlocks(self):
        r = self.client.post(
            f'/api/schedule/{self.entry.id}/toggle_collected/', {'item_id': self.a.id}, format='json')
        self.assertEqual(r.status_code, 200)
        detail = self.client.get(f'/api/schedule/{self.entry.id}/').data
        # The unlocks_with partner is collected together.
        self.assertIn(self.b.id, detail['collected_item_ids'])

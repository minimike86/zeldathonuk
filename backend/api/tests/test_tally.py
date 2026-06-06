"""The set_objective_status tally path (count_delta) + a few more action paths."""
from __future__ import annotations

from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APITestCase

from api import models


def _operator(client):
    user = get_user_model().objects.create_user(username='tl-op', password='x')
    models.Profile.objects.create(user=user, clerk_user_id='tl-clerk',
                                  role=models.Profile.ROLE_OPERATOR)
    client.force_authenticate(user=user)


class TallyPathTests(APITestCase):
    def setUp(self):
        _operator(self.client)
        self.event = models.Event.objects.create(name='E', start_time=timezone.now(), is_active=True)
        self.game = models.Game.objects.create(
            title='G', platform='N64', layout_type='4x3', default_play_minutes=60,
        )
        self.key = models.GameItem.objects.create(
            game=self.game, name='Small Key', category='dungeon-item', countable=True, order=0,
        )
        self.tally = models.GameObjective.objects.create(
            game=self.game, name='Keys', order=0, category='item-get',
            linked_item=self.key, link_mode='tally',
        )
        self.entry = models.ScheduleEntry.objects.create(
            event=self.event, game=self.game, order=1, slot_type='game',
        )
        cp = models.CurrentlyPlaying.get()
        cp.schedule_entry = self.entry
        cp.save()

    def _set(self, body):
        return self.client.post(
            f'/api/schedule/{self.entry.id}/set_objective_status/', body, format='json')

    def test_count_delta_tally(self):
        # Increment the tally three times via count_delta.
        for _ in range(3):
            r = self._set({'objective_id': self.tally.id, 'count_delta': 1})
            self.assertEqual(r.status_code, 200)
        self.assertEqual(r.data['count'], 3)
        # Decrement.
        self.assertEqual(self._set({'objective_id': self.tally.id, 'count_delta': -1}).data['count'], 2)
        # Drain to zero (deletes the row).
        self.assertEqual(self._set({'objective_id': self.tally.id, 'count_delta': -5}).data['count'], 0)

    def test_count_delta_invalid(self):
        self.assertEqual(
            self._set({'objective_id': self.tally.id, 'count_delta': 'x'}).status_code, 400,
        )

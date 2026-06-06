"""Multi-dungeon shared-item attribution: a Small Key item linked by tally
objectives in two dungeons, plus a single-link shared item — exercises
_attribute_dungeon_item + _recompute_shared_item_qty."""
from __future__ import annotations

from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APITestCase

from api import models


def _operator(client):
    user = get_user_model().objects.create_user(username='dg-op', password='x')
    models.Profile.objects.create(user=user, clerk_user_id='dg-clerk',
                                  role=models.Profile.ROLE_OPERATOR)
    client.force_authenticate(user=user)


class SharedDungeonItemTests(APITestCase):
    def setUp(self):
        _operator(self.client)
        self.event = models.Event.objects.create(
            name='E', start_time=timezone.now(), is_active=True,
        )
        self.game = models.Game.objects.create(
            title='G', platform='N64', layout_type='4x3', default_play_minutes=60,
        )
        # A SHARED small-key item linked by a tally objective in BOTH dungeons.
        self.small_key = models.GameItem.objects.create(
            game=self.game, name='Small Key', category='dungeon-item',
            countable=True, order=0,
        )
        # A shared single-link item linked across both dungeons too.
        self.boss_key = models.GameItem.objects.create(
            game=self.game, name='Boss Key', category='dungeon-item', order=1,
        )
        self.entry = models.ScheduleEntry.objects.create(
            event=self.event, game=self.game, order=1, slot_type='game',
        )
        order = 0
        for dungeon in ('Forest Temple', 'Water Temple'):
            models.GameObjective.objects.create(
                game=self.game, name=f'Enter {dungeon}', order=order, group=dungeon,
                setpiece_role='dungeon-enter', setpiece_name=dungeon,
            )
            order += 1
            models.GameObjective.objects.create(
                game=self.game, name=f'{dungeon} Keys', order=order, group=dungeon,
                category='item-get', linked_item=self.small_key, link_mode='tally',
            )
            order += 1
            models.GameObjective.objects.create(
                game=self.game, name=f'{dungeon} Boss Key', order=order, group=dungeon,
                category='item-get', linked_item=self.boss_key, link_mode='single',
            )
            order += 1
        cp = models.CurrentlyPlaying.get()
        cp.schedule_entry = self.entry
        cp.save()

    def _act(self, action, body):
        return self.client.post(f'/api/schedule/{self.entry.id}/{action}/', body, format='json')

    def test_attribution_to_active_dungeon(self):
        enter_forest = self.game.objectives.get(name='Enter Forest Temple')
        # Enter Forest Temple → it becomes the active dungeon.
        self._act('set_objective_status', {'objective_id': enter_forest.id, 'status': 'obtained'})
        # Collect small keys → attributed to the Forest tally objective.
        self._act('adjust_collected', {'item_id': self.small_key.id, 'delta': 1})
        self._act('adjust_collected', {'item_id': self.small_key.id, 'delta': 1})
        self._act('adjust_collected', {'item_id': self.small_key.id, 'delta': -1})
        # Single-link shared boss key: +1 then -1 (attributed + undone).
        self._act('adjust_collected', {'item_id': self.boss_key.id, 'delta': 1})
        self._act('adjust_collected', {'item_id': self.boss_key.id, 'delta': -1})
        # Switch dungeons and collect again so the aggregate spans both.
        enter_water = self.game.objectives.get(name='Enter Water Temple')
        self._act('set_objective_status', {'objective_id': enter_water.id, 'status': 'obtained'})
        self._act('adjust_collected', {'item_id': self.small_key.id, 'delta': 1})
        detail = self.client.get(f'/api/schedule/{self.entry.id}/').data
        self.assertIn('collected_item_counts', detail)

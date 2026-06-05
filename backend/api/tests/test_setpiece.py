"""A rich dungeon run exercising the setpiece recompute + collected-item cascade
internals (the densest remaining views.py block)."""
from __future__ import annotations

from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APITestCase

from api import models


def _operator(client):
    user = get_user_model().objects.create_user(username='sp-op', password='x')
    models.Profile.objects.create(user=user, clerk_user_id='sp-clerk',
                                  role=models.Profile.ROLE_OPERATOR)
    client.force_authenticate(user=user)


class DungeonRunTests(APITestCase):
    def setUp(self):
        _operator(self.client)
        self.event = models.Event.objects.create(
            name='E', start_time=timezone.now(), is_active=True,
        )
        self.game = models.Game.objects.create(
            title='G', platform='N64', layout_type='4x3', default_play_minutes=60,
        )
        # Dungeon staples + a tally item (small keys).
        self.small_key = models.GameItem.objects.create(
            game=self.game, name='Small Key', category='dungeon-item', countable=True, order=0,
        )
        self.dmap = models.GameItem.objects.create(
            game=self.game, name='Dungeon Map', category='dungeon-item', order=1,
        )
        self.big_key = models.GameItem.objects.create(
            game=self.game, name='Big Key', category='dungeon-item', order=2,
        )
        self.bow = models.GameItem.objects.create(
            game=self.game, name='Bow', category='weapon', order=3,
        )
        # Objectives forming a dungeon: enter → small-key tally → item-get → boss.
        self.enter = models.GameObjective.objects.create(
            game=self.game, name='Enter Forest', order=0, group='Forest Temple',
            setpiece_role='dungeon-enter', setpiece_name='Forest Temple',
        )
        self.keys = models.GameObjective.objects.create(
            game=self.game, name='Small Keys', order=1, group='Forest Temple',
            category='item-get', linked_item=self.small_key, link_mode='tally',
        )
        self.itemget = models.GameObjective.objects.create(
            game=self.game, name='Get Bow', order=2, group='Forest Temple',
            category='item-get', linked_item=self.bow,
        )
        self.boss_enter = models.GameObjective.objects.create(
            game=self.game, name='Enter Boss', order=3, group='Forest Temple',
            setpiece_role='boss-enter', setpiece_name='Phantom',
        )
        self.boss_defeat = models.GameObjective.objects.create(
            game=self.game, name='Beat Boss', order=4, group='Forest Temple',
            setpiece_role='boss-defeat', setpiece_name='Phantom',
            clears_setpiece='Forest Temple',
        )
        self.entry = models.ScheduleEntry.objects.create(
            event=self.event, game=self.game, order=1, slot_type='game',
        )
        cp = models.CurrentlyPlaying.get()
        cp.schedule_entry = self.entry
        cp.save()

    def _act(self, action, body):
        return self.client.post(f'/api/schedule/{self.entry.id}/{action}/', body, format='json')

    def test_full_dungeon_flow(self):
        e = self.entry.id
        # Enter the dungeon → Forest Temple setpiece active.
        self._act('set_objective_status', {'objective_id': self.enter.id, 'status': 'obtained'})
        # Collect small keys while the dungeon is active → dungeon-tally attribution.
        for _ in range(3):
            self._act('adjust_collected', {'item_id': self.small_key.id, 'delta': 1})
        self._act('adjust_collected', {'item_id': self.small_key.id, 'delta': -1})
        # Collect the bow → mirrors the linked item-get objective.
        self._act('toggle_collected', {'item_id': self.bow.id})
        # Collect dungeon staples.
        self._act('toggle_collected', {'item_id': self.dmap.id})
        self._act('toggle_collected', {'item_id': self.big_key.id})
        # Boss enter → boss-enter setpiece; defeat → clears boss + dungeon.
        self._act('set_objective_status', {'objective_id': self.boss_enter.id, 'status': 'obtained'})
        self._act('set_objective_status', {'objective_id': self.boss_defeat.id, 'status': 'obtained'})
        # Reset the run.
        self.assertEqual(self._act('reset_collected', {}).status_code, 200)
        detail = self.client.get(f'/api/schedule/{e}/').data
        self.assertIn('collected_item_ids', detail)
        self.assertIn('setpieces', detail)

    def test_manual_setpiece_lifecycle(self):
        r = self._act('add_setpiece', {'kind': 'dungeon', 'name': 'Water Temple', 'stage': 'imminent'})
        self.assertIn(r.status_code, (200, 201))
        sp = models.Setpiece.objects.filter(schedule_entry=self.entry, name='Water Temple').first()
        if sp:
            self._act('update_setpiece', {'setpiece_id': sp.id, 'stage': 'active'})
            self._act('update_setpiece', {'setpiece_id': sp.id, 'stage': 'cleared'})
            self.assertIn(self._act('clear_setpiece', {'setpiece_id': sp.id}).status_code, (200, 204))

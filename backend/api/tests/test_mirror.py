"""Objective→item mirroring (set_objective_status on linked objectives) plus a
couple of remaining function-view paths (charity get_object by slug)."""
from __future__ import annotations

from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APITestCase

from api import models


def _operator(client):
    user = get_user_model().objects.create_user(username='mir-op', password='x')
    models.Profile.objects.create(user=user, clerk_user_id='mir-clerk',
                                  role=models.Profile.ROLE_OPERATOR)
    client.force_authenticate(user=user)


class ObjectiveMirrorTests(APITestCase):
    def setUp(self):
        _operator(self.client)
        self.event = models.Event.objects.create(
            name='E', start_time=timezone.now(), is_active=True,
        )
        self.game = models.Game.objects.create(
            title='G', platform='N64', layout_type='4x3', default_play_minutes=60,
        )
        self.bow = models.GameItem.objects.create(game=self.game, name='Bow', category='weapon', order=0)
        self.key = models.GameItem.objects.create(
            game=self.game, name='Small Key', category='dungeon-item', countable=True, order=1,
        )
        # Item-get objective linked to the bow (single) and a tally objective.
        self.obj_single = models.GameObjective.objects.create(
            game=self.game, name='Get Bow', order=0, category='item-get', linked_item=self.bow,
        )
        self.obj_tally = models.GameObjective.objects.create(
            game=self.game, name='Keys', order=1, category='item-get',
            linked_item=self.key, link_mode='tally',
        )
        self.entry = models.ScheduleEntry.objects.create(
            event=self.event, game=self.game, order=1, slot_type='game',
        )
        cp = models.CurrentlyPlaying.get()
        cp.schedule_entry = self.entry
        cp.save()

    def _act(self, action, body):
        return self.client.post(f'/api/schedule/{self.entry.id}/{action}/', body, format='json')

    def test_set_objective_mirrors_item(self):
        # Marking the linked objective obtained collects the bow.
        self._act('set_objective_status', {'objective_id': self.obj_single.id, 'status': 'obtained'})
        detail = self.client.get(f'/api/schedule/{self.entry.id}/').data
        self.assertIn(self.bow.id, detail['collected_item_ids'])
        # Back to outstanding → uncollects.
        self._act('set_objective_status', {'objective_id': self.obj_single.id, 'status': 'outstanding'})
        detail = self.client.get(f'/api/schedule/{self.entry.id}/').data
        self.assertNotIn(self.bow.id, detail['collected_item_ids'])
        # Skipped status too.
        self._act('set_objective_status', {'objective_id': self.obj_single.id, 'status': 'skipped'})

    def test_tally_objective_obtained(self):
        # Marking a tally objective obtained seeds a count on the linked item.
        self._act('set_objective_status', {'objective_id': self.obj_tally.id, 'status': 'obtained'})
        self._act('set_objective_status', {'objective_id': self.obj_tally.id, 'status': 'outstanding'})


class CharitySlugTests(APITestCase):
    def setUp(self):
        _operator(self.client)
        self.charity = models.Charity.objects.create(slug='specialeffect', name='SpecialEffect')

    def test_get_by_slug_and_pk(self):
        self.assertEqual(self.client.get(f'/api/charities/{self.charity.slug}/').status_code, 200)
        self.assertEqual(self.client.get(f'/api/charities/{self.charity.id}/').status_code, 200)
        self.assertEqual(self.client.get('/api/charities/nonexistent-slug/').status_code, 404)

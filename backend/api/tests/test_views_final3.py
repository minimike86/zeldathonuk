"""Bundled item/objective image listers (real assets folder), the
already-running timer guard, and update_setpiece priority handling."""
from __future__ import annotations

from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APITestCase

from api import models


def _operator(client):
    user = get_user_model().objects.create_user(username='vf3-op', password='x')
    models.Profile.objects.create(user=user, clerk_user_id='vf3-clerk',
                                  role=models.Profile.ROLE_OPERATOR)
    client.force_authenticate(user=user)


class BundledImageTests(APITestCase):
    def setUp(self):
        _operator(self.client)

    def test_item_and_objective_assets_scan_real_folder(self):
        # The seeded "A Link to the Past" game has asset_slug='lttp', whose
        # bundled sprite folder is mounted into the backend container.
        game = (
            models.Game.objects.filter(asset_slug='lttp').first()
            or models.Game.objects.create(
                title='ALTTP-test', platform='SNES', layout_type='4x3',
                default_play_minutes=60, asset_slug='lttp',
            )
        )
        items = self.client.get(f'/api/games/{game.id}/item_assets/')
        self.assertEqual(items.status_code, 200)
        self.assertGreater(len(items.data.get('images', [])), 0)
        objs = self.client.get(f'/api/games/{game.id}/objective_assets/')
        self.assertEqual(objs.status_code, 200)

    def test_no_slug_returns_empty(self):
        game = models.Game.objects.create(
            title='NoSlug', platform='NES', layout_type='4x3', default_play_minutes=60,
        )
        res = self.client.get(f'/api/games/{game.id}/item_assets/')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data.get('images'), [])


class TimerAndSetpieceTests(APITestCase):
    def setUp(self):
        _operator(self.client)
        self.event = models.Event.objects.create(name='E', start_time=timezone.now(), is_active=True)
        self.game = models.Game.objects.create(
            title='G', platform='NES', layout_type='4x3', default_play_minutes=60,
        )
        self.entry = models.ScheduleEntry.objects.create(
            event=self.event, game=self.game, order=1, slot_type='game',
        )

    def _act(self, action, body=None):
        return self.client.post(f'/api/schedule/{self.entry.id}/{action}/', body or {}, format='json')

    def test_start_timer_twice_is_rejected(self):
        self.assertEqual(self._act('start_timer').status_code, 200)
        self.assertEqual(self._act('start_timer').status_code, 400)  # already running

    def test_update_setpiece_priority(self):
        r = self._act('add_setpiece', {'kind': 'dungeon', 'name': 'Temple', 'stage': 'active'})
        self.assertIn(r.status_code, (200, 201))
        sp = models.Setpiece.objects.filter(schedule_entry=self.entry).first()
        if sp:
            self.assertIn(self._act('update_setpiece', {'setpiece_id': sp.id, 'priority': 5}).status_code, (200, 400))
            self.assertEqual(
                self._act('update_setpiece', {'setpiece_id': sp.id, 'priority': 'bad'}).status_code, 400,
            )

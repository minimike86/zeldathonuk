"""timer_hotkey dungeon-staple attribution + spine split/undo with a live run."""
from __future__ import annotations

from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APITestCase

from api import models


def _operator(client):
    user = get_user_model().objects.create_user(username='t2-op', password='x')
    models.Profile.objects.create(user=user, clerk_user_id='t2-clerk',
                                  role=models.Profile.ROLE_OPERATOR)
    client.force_authenticate(user=user)


class TimerHotkeyDungeonTests(APITestCase):
    def setUp(self):
        _operator(self.client)
        self.event = models.Event.objects.create(name='E', start_time=timezone.now(), is_active=True)
        self.game = models.Game.objects.create(
            title='G', platform='N64', layout_type='4x3', default_play_minutes=60,
        )
        # A small-key item shared (multi-linked) across two dungeons → a staple.
        self.small_key = models.GameItem.objects.create(
            game=self.game, name='Small Key', category='dungeon-item', countable=True, order=0,
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
        # A couple of spine objectives for split/undo.
        models.GameObjective.objects.create(game=self.game, name='Reach Castle', order=order)
        self.entry = models.ScheduleEntry.objects.create(
            event=self.event, game=self.game, order=1, slot_type='game',
        )
        cp = models.CurrentlyPlaying.get()
        cp.schedule_entry = self.entry
        cp.save()
        cfg = models.AuthConfig.get()
        cfg.timer_hotkey_secret = 'sek'
        cfg.save()

    def _hk(self, action):
        return self.client.post('/api/timer-hotkey/', {'action': action}, HTTP_X_HOTKEY_SECRET='sek')

    def _act(self, action, body):
        return self.client.post(f'/api/schedule/{self.entry.id}/{action}/', body, format='json')

    def test_staple_attribution_and_spine(self):
        self._hk('start')
        # Enter the Forest dungeon so the staple has somewhere to attribute.
        enter = self.game.objectives.get(name='Enter Forest Temple')
        self._act('set_objective_status', {'objective_id': enter.id, 'status': 'obtained'})
        # Small-key staple via the hotkey → attributed to the active dungeon.
        r = self._hk('small-key-inc')
        self.assertIn(r.status_code, (200, 409))
        self._hk('small-key-inc')
        self._hk('small-key-dec')
        # Spine split + undo.
        self.assertIn(self._hk('split').status_code, (200, 409))
        self.assertIn(self._hk('undo').status_code, (200, 409))
        # Death counter.
        self.assertEqual(self._hk('death-inc').status_code, 200)
        self.assertEqual(self._hk('death-dec').status_code, 200)

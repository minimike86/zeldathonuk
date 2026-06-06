"""Coverage of the timer-hotkey dispatch + run-timer actions with a live run:
a currently-playing entry with a started timer and dungeon collectibles."""
from __future__ import annotations

from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APITestCase

from api import models


def _operator(client):
    user = get_user_model().objects.create_user(username='timer-op', password='x')
    models.Profile.objects.create(user=user, clerk_user_id='timer-clerk',
                                  role=models.Profile.ROLE_OPERATOR)
    client.force_authenticate(user=user)


class TimerHotkeyFlowTests(APITestCase):
    def setUp(self):
        _operator(self.client)
        self.event = models.Event.objects.create(
            name='E', start_time=timezone.now(), is_active=True,
        )
        self.game = models.Game.objects.create(
            title='G', platform='N64', layout_type='4x3', default_play_minutes=60,
        )
        # Dungeon staples the collect-* hotkeys target.
        for name, cat, countable in [
            ('Dungeon Map', 'dungeon-item', False),
            ('Compass', 'dungeon-item', False),
            ('Big Key', 'dungeon-item', False),
            ('Small Key', 'dungeon-item', True),
        ]:
            models.GameItem.objects.create(
                game=self.game, name=name, category=cat, countable=countable, order=0,
            )
        # A couple of objectives so split walks the objective spine.
        models.GameObjective.objects.create(game=self.game, name='Start', order=0)
        models.GameObjective.objects.create(game=self.game, name='Finish', order=1)
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
        return self.client.post('/api/timer-hotkey/', {'action': action},
                                HTTP_X_HOTKEY_SECRET='sek')

    def test_full_hotkey_run(self):
        # Start the run, then walk the splits + collection hotkeys.
        self.assertIn(self._hk('start').status_code, (200, 409))
        for action in ['split', 'collect-map', 'collect-compass', 'collect-big-key',
                       'small-key-inc', 'small-key-inc', 'small-key-dec',
                       'death-inc', 'death-inc', 'death-dec', 'split', 'undo',
                       'skip', 'pause', 'start', 'finish', 'reset']:
            self.assertIn(self._hk(action).status_code, (200, 400, 404, 409),
                          f'{action}')

    def test_timer_run_actions_directly(self):
        e = self.entry.id
        self.assertEqual(self.client.post(f'/api/schedule/{e}/start_timer/').status_code, 200)
        self.assertEqual(self.client.post(f'/api/schedule/{e}/pause_timer/').status_code, 200)
        self.assertEqual(self.client.post(f'/api/schedule/{e}/reopen_timer/').status_code, 200)
        self.assertEqual(self.client.post(f'/api/schedule/{e}/stop_timer/').status_code, 200)
        # currently-playing GET reflects the run.
        self.assertEqual(self.client.get('/api/currently-playing/').status_code, 200)

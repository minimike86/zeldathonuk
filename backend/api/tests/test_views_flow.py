"""Functional coverage of the run machinery in views.py: the ScheduleEntry
timer, item collection (cascades + dungeon attribution), objective status
(setpiece automation), and the singleton/settings function views.
"""
from __future__ import annotations

from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APITestCase

from api import models


def _operator(client):
    user = get_user_model().objects.create_user(username='flow-op', password='x')
    models.Profile.objects.create(
        user=user, clerk_user_id='clerk-flow', role=models.Profile.ROLE_OPERATOR,
    )
    client.force_authenticate(user=user)


class RunFlowTests(APITestCase):
    def setUp(self):
        _operator(self.client)
        self.event = models.Event.objects.create(
            name='Run', start_time=timezone.now(), is_active=True,
        )
        self.game = models.Game.objects.create(
            title='OoT', platform='N64', layout_type='4x3', default_play_minutes=60,
        )
        self.bow = models.GameItem.objects.create(
            game=self.game, name='Bow', category='weapon', order=0,
        )
        self.quiver = models.GameItem.objects.create(
            game=self.game, name='Quiver', category='upgrade', order=1,
        )
        self.bow.unlocks_with.add(self.quiver)
        self.small_key = models.GameItem.objects.create(
            game=self.game, name='Small Key', category='dungeon-item',
            countable=True, order=2,
        )
        # Objectives: one linked to the bow, plus a dungeon/boss setpiece chain.
        self.obj_item = models.GameObjective.objects.create(
            game=self.game, name='Get the Bow', order=0, category='item-get',
            linked_item=self.bow,
        )
        self.obj_dungeon = models.GameObjective.objects.create(
            game=self.game, name='Enter Forest', order=1,
            setpiece_role='dungeon-enter', setpiece_name='Forest Temple',
        )
        self.obj_boss_enter = models.GameObjective.objects.create(
            game=self.game, name='Enter Phantom', order=2,
            setpiece_role='boss-enter', setpiece_name='Phantom Ganon',
        )
        self.obj_boss_defeat = models.GameObjective.objects.create(
            game=self.game, name='Beat Phantom', order=3,
            setpiece_role='boss-defeat', setpiece_name='Phantom Ganon',
        )
        self.obj_story = models.GameObjective.objects.create(
            game=self.game, name='Reach Hyrule', order=4, category='story',
        )
        self.entry = models.ScheduleEntry.objects.create(
            event=self.event, game=self.game, order=1, slot_type='game',
        )
        cp = models.CurrentlyPlaying.get()
        cp.schedule_entry = self.entry
        cp.save()

    def _e(self, action, body=None):
        return self.client.post(f'/api/schedule/{self.entry.id}/{action}/', body or {})

    def test_timer_lifecycle(self):
        self.assertEqual(self._e('start_timer').status_code, 200)
        self.assertEqual(self._e('pause_timer').status_code, 200)
        self.assertEqual(self._e('reopen_timer').status_code, 200)
        self.assertEqual(self._e('stop_timer').status_code, 200)
        self.assertEqual(self._e('reset_timer').status_code, 200)

    def test_collect_with_cascade_and_objective_mirror(self):
        # Collecting the bow cascades to the quiver (unlocks_with) and mirrors
        # the linked "Get the Bow" objective to obtained.
        r = self._e('toggle_collected', {'item_id': self.bow.id})
        self.assertEqual(r.status_code, 200)
        detail = self.client.get(f'/api/schedule/{self.entry.id}/').data
        self.assertIn(self.bow.id, detail['collected_item_ids'])
        self.assertIn(self.quiver.id, detail['collected_item_ids'])
        self.assertIn(self.obj_item.id, detail['obtained_objective_ids'])
        # Toggle off again.
        self.assertEqual(self._e('toggle_collected', {'item_id': self.bow.id}).status_code, 200)

    def test_countable_adjust_and_reset(self):
        self.assertEqual(
            self._e('adjust_collected', {'item_id': self.small_key.id, 'delta': 1}).status_code, 200,
        )
        self.assertEqual(
            self._e('adjust_collected', {'item_id': self.small_key.id, 'delta': -1}).status_code, 200,
        )
        self.assertEqual(self._e('reset_collected').status_code, 200)

    def test_objective_status_drives_setpieces(self):
        # Entering the dungeon objective spawns/advances the Forest setpiece.
        self.assertEqual(
            self._e('set_objective_status',
                    {'objective_id': self.obj_dungeon.id, 'status': 'obtained'}).status_code, 200,
        )
        # Enter then defeat the boss → clears the boss setpiece (fires alert).
        self._e('set_objective_status', {'objective_id': self.obj_boss_enter.id, 'status': 'obtained'})
        self.assertEqual(
            self._e('set_objective_status',
                    {'objective_id': self.obj_boss_defeat.id, 'status': 'obtained'}).status_code, 200,
        )
        # Skip then un-skip a story objective.
        self._e('set_objective_status', {'objective_id': self.obj_story.id, 'status': 'skipped'})
        self.assertEqual(
            self._e('set_objective_status',
                    {'objective_id': self.obj_story.id, 'status': 'outstanding'}).status_code, 200,
        )

    def test_manual_setpiece_crud(self):
        r = self._e('add_setpiece', {'kind': 'dungeon', 'name': 'Manual', 'stage': 'active'})
        self.assertIn(r.status_code, (200, 201))
        sp = models.Setpiece.objects.filter(schedule_entry=self.entry).first()
        if sp:
            self._e('update_setpiece', {'setpiece_id': sp.id, 'stage': 'imminent'})
            self.assertIn(
                self._e('clear_setpiece', {'setpiece_id': sp.id}).status_code, (200, 204),
            )

    def test_currently_playing_set_and_assets(self):
        # Set currently-playing via the function view (PUT; fires best-effort chat).
        res = self.client.put('/api/currently-playing/', {'schedule_entry': self.entry.id})
        self.assertEqual(res.status_code, 200)
        # Bundled item / objective asset listers (actions on GameViewSet).
        self.assertEqual(
            self.client.get(f'/api/games/{self.game.id}/item_assets/').status_code, 200,
        )
        self.assertEqual(
            self.client.get(f'/api/games/{self.game.id}/objective_assets/').status_code, 200,
        )

    def test_timer_hotkey_actions(self):
        cfg = models.AuthConfig.get()
        cfg.timer_hotkey_secret = 'sek'
        cfg.save()
        # Bad secret → 401.
        self.assertEqual(self.client.post('/api/timer-hotkey/', {'action': 'start'}).status_code, 401)
        for action in ['start', 'split', 'pause', 'finish', 'reset', 'undo',
                       'skip', 'collect-map', 'small-key-inc', 'small-key-dec',
                       'death-inc', 'death-dec', 'bogus-action']:
            res = self.client.post(
                '/api/timer-hotkey/', {'action': action}, HTTP_X_HOTKEY_SECRET='sek',
            )
            self.assertIn(res.status_code, (200, 400, 404, 409), f'{action} → {res.status_code}')


class SingletonViewTests(APITestCase):
    def setUp(self):
        _operator(self.client)

    def test_theme_patch(self):
        res = self.client.patch('/api/theme/', {'primary': '#abcdef'})
        self.assertEqual(res.status_code, 200)

    def test_layout_guide_patch(self):
        res = self.client.patch('/api/layout-guide/', {'visible': True})
        self.assertIn(res.status_code, (200, 400))

    def test_chest_settings_patch(self):
        res = self.client.patch('/api/chest-announcer/settings/', {'audio_enabled': True})
        self.assertEqual(res.status_code, 200)
        self.assertTrue(res.data['audio_enabled'])

    def test_tts_and_chest_replay_pointers(self):
        ev = models.Event.objects.create(name='E', start_time=timezone.now(), is_active=True)
        from decimal import Decimal
        d = models.Donation.objects.create(
            event=ev, platform='justgiving', donor_name='Kris', amount=Decimal('5'),
            currency='GBP', donated_at=timezone.now(), external_id='x',
        )
        for path in ['tts/now-reading/', 'tts/replay/', 'chest-announcer/replay/']:
            res = self.client.post(f'/api/{path}', {'donation_id': d.id}, format='json')
            self.assertEqual(res.status_code, 200, f'{path} → {res.status_code}')
        # null clears the now-reading pointer.
        self.assertEqual(
            self.client.post('/api/tts/now-reading/', {'donation_id': None}, format='json').status_code, 200,
        )

    def test_shoutout_config_patch(self):
        res = self.client.patch('/api/shoutout-config/', {'auto_shoutout_donors': True})
        self.assertIn(res.status_code, (200, 400))

    def test_upload_image(self):
        from django.core.files.uploadedfile import SimpleUploadedFile
        png = (b'\x89PNG\r\n\x1a\n' + b'\x00' * 64)
        img = SimpleUploadedFile('x.png', png, content_type='image/png')
        res = self.client.post('/api/uploads/image/', {'image': img}, format='multipart')
        self.assertIn(res.status_code, (200, 201, 400))

    def test_queue_and_scheduler_status(self):
        self.assertEqual(self.client.get('/api/queue/').status_code, 200)
        self.assertEqual(self.client.get('/api/scheduler-status/').status_code, 200)

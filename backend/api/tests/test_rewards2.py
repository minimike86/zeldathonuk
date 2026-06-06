"""rewards.handle_redemption across all action types (chat / shoutout / death)."""
from __future__ import annotations

from unittest.mock import MagicMock, patch

from django.test import TestCase
from django.utils import timezone

from api import models, rewards


class RewardActionTypeTests(TestCase):
    def setUp(self):
        self.event = models.Event.objects.create(
            name='E', start_time=timezone.now(), is_active=True,
        )
        self.mapping = models.RewardMapping.objects.create(
            event=self.event, reward_title='Hydrate', reward_id='r1', enabled=True,
        )

    def test_no_event_or_no_mapping(self):
        self.assertEqual(rewards.handle_redemption(None, {'title': 'X'}), 0)
        self.assertEqual(rewards.handle_redemption(self.event, {'title': 'Nope'}), 0)

    @patch('api.chat._send_to_event', return_value=True)
    def test_chat_action(self, _m):
        models.RewardAction.objects.create(
            mapping=self.mapping, action_type=models.RewardActionType.CHAT,
            enabled=True, params={'template': '{user} redeemed {reward}'},
        )
        fired = rewards.handle_redemption(
            self.event, {'id': 'r1', 'title': 'Hydrate', 'cost': 100},
            user_login='kris', user_name='Kris',
        )
        self.assertEqual(fired, 1)

    def test_shoutout_action(self):
        models.RewardAction.objects.create(
            mapping=self.mapping, action_type=models.RewardActionType.SHOUTOUT,
            enabled=True, params={},
        )
        fired = rewards.handle_redemption(
            self.event, {'id': 'r1', 'title': 'Hydrate'}, user_login='friend',
        )
        self.assertEqual(fired, 1)
        self.assertTrue(models.ShoutoutRequest.objects.filter(target_login='friend').exists())

    def test_death_counter_action(self):
        game = models.Game.objects.create(
            title='G', platform='NES', layout_type='4x3', default_play_minutes=60,
        )
        entry = models.ScheduleEntry.objects.create(
            event=self.event, game=game, order=1, slot_type='game',
        )
        cp = models.CurrentlyPlaying.get()
        cp.schedule_entry = entry
        cp.save()
        models.RewardAction.objects.create(
            mapping=self.mapping, action_type=models.RewardActionType.DEATH_COUNTER,
            enabled=True, params={'delta': 2},
        )
        fired = rewards.handle_redemption(self.event, {'id': 'r1', 'title': 'Hydrate'})
        self.assertEqual(fired, 1)
        entry.refresh_from_db()
        self.assertEqual(entry.death_count, 2)

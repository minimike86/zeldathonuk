"""Tests for channel-point reward → action mapping (api.rewards): matching +
executing chat / shoutout / death_counter. Twitch calls are mocked."""
from __future__ import annotations

from unittest.mock import MagicMock, patch

from django.test import TestCase
from django.utils import timezone

from api import models, rewards


def _event():
    return models.Event.objects.create(
        name='Reward Event', start_time=timezone.now(), is_active=True,
    )


def _connected_primary(event):
    conn = models.TwitchChannelConnection.objects.create(
        login='zeldathonuk', broadcaster_id='1', access_token='t',
        scopes='user:write:chat', is_active=True,
    )
    models.EventTwitchChannel.objects.create(
        event=event, login='zeldathonuk', is_primary=True, connection=conn,
    )
    return conn


class MatchTests(TestCase):
    def setUp(self):
        self.event = _event()

    def test_matches_by_id_when_set(self):
        m = models.RewardMapping.objects.create(
            event=self.event, reward_id='abc', reward_title='Add a death',
        )
        self.assertTrue(m.matches('abc', 'whatever'))
        self.assertFalse(m.matches('xyz', 'Add a death'))

    def test_matches_by_title_when_no_id(self):
        m = models.RewardMapping.objects.create(
            event=self.event, reward_id='', reward_title='Add a Death',
        )
        self.assertTrue(m.matches('', 'add a death'))  # case-insensitive
        self.assertFalse(m.matches('', 'Hydrate'))


class ExecuteTests(TestCase):
    def setUp(self):
        self.event = _event()
        _connected_primary(self.event)

    @patch('api.chat.send_chat_message')
    def test_chat_action_runs(self, mock_send):
        mock_send.return_value = MagicMock(ok=True)
        m = models.RewardMapping.objects.create(event=self.event, reward_title='Hi')
        models.RewardAction.objects.create(
            mapping=m, action_type='chat',
            params={'template': 'Thanks {user} for {reward}!'},
        )
        fired = rewards.handle_redemption(
            self.event, {'title': 'Hi'}, user_login='kris', user_name='Kris',
        )
        self.assertEqual(fired, 1)
        self.assertEqual(mock_send.call_args.args[2], 'Thanks Kris for Hi!')

    def test_shoutout_action_queues(self):
        m = models.RewardMapping.objects.create(event=self.event, reward_title='SO')
        models.RewardAction.objects.create(mapping=m, action_type='shoutout')
        rewards.handle_redemption(
            self.event, {'title': 'SO'}, user_login='kris', user_name='Kris',
        )
        # force=True bypasses the master shoutout enable gate.
        self.assertTrue(
            self.event.shoutout_requests.filter(target_login='kris', status='pending').exists(),
        )

    def test_death_counter_action(self):
        # currently-playing entry with a death count.
        runner_event = self.event
        entry = models.ScheduleEntry.objects.create(event=runner_event, order=0)
        cp = models.CurrentlyPlaying.get()
        cp.schedule_entry = entry
        cp.save()
        m = models.RewardMapping.objects.create(event=self.event, reward_title='Death')
        models.RewardAction.objects.create(
            mapping=m, action_type='death_counter', params={'delta': 2},
        )
        rewards.handle_redemption(self.event, {'title': 'Death'})
        entry.refresh_from_db()
        self.assertEqual(entry.death_count, 2)

    def test_no_mapping_no_actions(self):
        self.assertEqual(
            rewards.handle_redemption(self.event, {'title': 'Unmapped'}), 0,
        )

    def test_disabled_action_skipped(self):
        m = models.RewardMapping.objects.create(event=self.event, reward_title='X')
        models.RewardAction.objects.create(
            mapping=m, action_type='death_counter', params={'delta': 1}, enabled=False,
        )
        self.assertEqual(rewards.handle_redemption(self.event, {'title': 'X'}), 0)

"""Tests for the Twitch shoutout queue (api.shoutouts): enqueue gating + the
cooldown-aware drain. Twitch calls are mocked."""
from __future__ import annotations

from datetime import timedelta
from decimal import Decimal
from unittest.mock import MagicMock, patch

from django.test import TestCase
from django.utils import timezone

from api import models, shoutouts


def _event():
    return models.Event.objects.create(
        name='SO Event', start_time=timezone.now(), is_active=True,
    )


def _connected_primary(event, login='zeldathonuk'):
    conn = models.TwitchChannelConnection.objects.create(
        login=login, broadcaster_id='111', access_token='t', is_active=True,
    )
    models.EventTwitchChannel.objects.create(
        event=event, login=login, is_primary=True, connection=conn,
    )
    return conn


class EnqueueTests(TestCase):
    def setUp(self):
        self.event = _event()
        self.cfg = shoutouts.get_config(self.event)
        self.cfg.enabled = True
        self.cfg.save()

    def test_disabled_does_not_queue(self):
        self.cfg.enabled = False
        self.cfg.save()
        self.assertIsNone(shoutouts.enqueue(self.event, 'kris', reason='donation'))
        self.assertEqual(self.event.shoutout_requests.count(), 0)

    def test_below_min_donation_skipped(self):
        self.cfg.min_donation_amount = Decimal('10.00')
        self.cfg.save()
        self.assertIsNone(
            shoutouts.enqueue(self.event, 'kris', reason='donation', amount=Decimal('5')),
        )

    def test_above_min_queued(self):
        self.cfg.min_donation_amount = Decimal('10.00')
        self.cfg.save()
        req = shoutouts.enqueue(self.event, 'Kris', reason='donation', amount=Decimal('15'))
        self.assertIsNotNone(req)
        self.assertEqual(req.target_login, 'kris')  # normalised

    def test_self_not_queued(self):
        _connected_primary(self.event, login='zeldathonuk')
        self.assertIsNone(shoutouts.enqueue(self.event, 'zeldathonuk', reason='raid'))

    def test_pending_duplicate_skipped(self):
        shoutouts.enqueue(self.event, 'kris', reason='donation')
        shoutouts.enqueue(self.event, 'kris', reason='donation')
        self.assertEqual(
            self.event.shoutout_requests.filter(target_login='kris').count(), 1,
        )


@patch('api.twitch.fetch_stream', return_value={'id': 'live'})
class ProcessTests(TestCase):
    def setUp(self):
        self.event = _event()
        _connected_primary(self.event)
        self.cfg = shoutouts.get_config(self.event)
        self.cfg.enabled = True
        self.cfg.save()

    @patch('api.twitch.send_shoutout')
    @patch('api.twitch.fetch_user_profile', return_value={'id': '999', 'display_name': 'Kris'})
    def test_sends_oldest_first(self, _mock_prof, mock_send, _mock_stream):
        mock_send.return_value = MagicMock(ok=True, status_code=204)
        shoutouts.enqueue(self.event, 'kris', reason='donation')
        sent = shoutouts.process_one(self.event)
        self.assertIsNotNone(sent)
        self.assertEqual(sent.status, 'sent')
        self.assertEqual(mock_send.call_count, 1)

    @patch('api.twitch.send_shoutout')
    @patch('api.twitch.fetch_user_profile', return_value={'id': '999'})
    def test_global_cooldown_blocks_second(self, _mock_prof, mock_send, _mock_stream):
        mock_send.return_value = MagicMock(ok=True, status_code=204)
        shoutouts.enqueue(self.event, 'a', reason='donation')
        shoutouts.enqueue(self.event, 'b', reason='donation')
        first = shoutouts.process_one(self.event)
        self.assertIsNotNone(first)
        # Second call within the global cooldown sends nothing.
        second = shoutouts.process_one(self.event)
        self.assertIsNone(second)
        self.assertEqual(mock_send.call_count, 1)

    @patch('api.twitch.send_shoutout')
    @patch('api.twitch.fetch_user_profile', return_value={'id': '999'})
    def test_offline_skips_when_only_when_live(self, _mock_prof, mock_send, mock_stream):
        mock_stream.return_value = None  # offline
        shoutouts.enqueue(self.event, 'kris', reason='donation')
        self.assertIsNone(shoutouts.process_one(self.event))
        mock_send.assert_not_called()

    @patch('api.twitch.send_shoutout')
    @patch('api.twitch.fetch_user_profile', return_value={'id': '999'})
    def test_target_cooldown_leaves_pending(self, _mock_prof, mock_send, _mock_stream):
        mock_send.return_value = MagicMock(ok=True, status_code=204)
        # A recent SENT to the same target within the per-target cooldown.
        models.ShoutoutRequest.objects.create(
            event=self.event, target_login='kris', status='sent',
            sent_at=timezone.now() - timedelta(minutes=5),
        )
        # And an old global send so the global cooldown isn't the blocker.
        models.ShoutoutRequest.objects.filter(target_login='kris').update(
            sent_at=timezone.now() - timedelta(minutes=5),
        )
        shoutouts.enqueue(self.event, 'kris', reason='donation')
        self.assertIsNone(shoutouts.process_one(self.event))  # on target cooldown
        mock_send.assert_not_called()
        self.assertTrue(
            self.event.shoutout_requests.filter(target_login='kris', status='pending').exists(),
        )

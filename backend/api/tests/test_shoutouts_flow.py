"""shoutouts.enqueue gates + process_one send/cooldown/failure branches."""
from __future__ import annotations

from decimal import Decimal
from unittest.mock import MagicMock, patch

from django.test import TestCase
from django.utils import timezone

from api import models, shoutouts


def _event():
    return models.Event.objects.create(name='E', start_time=timezone.now(), is_active=True)


def _conn(event):
    conn = models.TwitchChannelConnection.objects.create(
        login='host', broadcaster_id='999', access_token='t',
        scopes='moderator:manage:shoutouts', is_active=True,
    )
    models.EventTwitchChannel.objects.create(
        event=event, login='host', is_primary=True, connection=conn,
    )
    return conn


class EnqueueGateTests(TestCase):
    def setUp(self):
        self.event = _event()
        _conn(self.event)

    def test_blank_login_returns_none(self):
        self.assertIsNone(shoutouts.enqueue(self.event, '', reason=models.ShoutoutReason.DONATION))

    def test_master_disabled(self):
        cfg = shoutouts.get_config(self.event)
        cfg.enabled = False
        cfg.save()
        self.assertIsNone(shoutouts.enqueue(self.event, 'friend', reason=models.ShoutoutReason.DONATION))

    def test_donation_below_threshold(self):
        cfg = shoutouts.get_config(self.event)
        cfg.enabled = True
        cfg.shout_donations = True
        cfg.min_donation_amount = Decimal('25')
        cfg.save()
        self.assertIsNone(shoutouts.enqueue(
            self.event, 'friend', reason=models.ShoutoutReason.DONATION, amount=Decimal('5'),
        ))

    def test_raid_disabled(self):
        cfg = shoutouts.get_config(self.event)
        cfg.enabled = True
        cfg.shout_raids = False
        cfg.save()
        self.assertIsNone(shoutouts.enqueue(self.event, 'raider', reason=models.ShoutoutReason.RAID))

    def test_never_shout_host(self):
        cfg = shoutouts.get_config(self.event)
        cfg.enabled = True
        cfg.save()
        self.assertIsNone(shoutouts.enqueue(
            self.event, 'host', reason=models.ShoutoutReason.DONATION, force=True,
        ))

    def test_duplicate_pending_skipped(self):
        models.ShoutoutRequest.objects.create(
            event=self.event, target_login='friend', reason=models.ShoutoutReason.DONATION,
            status=models.ShoutoutStatus.PENDING,
        )
        self.assertIsNone(shoutouts.enqueue(
            self.event, 'friend', reason=models.ShoutoutReason.DONATION, force=True,
        ))

    def test_force_enqueues(self):
        row = shoutouts.enqueue(
            self.event, 'newfriend', reason=models.ShoutoutReason.DONATION, force=True,
        )
        self.assertIsNotNone(row)


class ProcessOneTests(TestCase):
    def setUp(self):
        self.event = _event()
        self.conn = _conn(self.event)
        cfg = shoutouts.get_config(self.event)
        cfg.only_when_live = True
        cfg.save()
        models.ShoutoutRequest.objects.create(
            event=self.event, target_login='friend', reason=models.ShoutoutReason.DONATION,
            status=models.ShoutoutStatus.PENDING,
        )

    @patch('api.twitch.send_shoutout')
    @patch('api.twitch.fetch_user_profile', return_value={'id': '42', 'display_name': 'Friend'})
    @patch('api.twitch.ensure_connection_broadcaster_id', return_value='999')
    @patch('api.twitch.fetch_stream', return_value={'id': 's'})
    @patch('api.twitch.event_primary_connection')
    def test_success(self, mock_conn, *_):
        mock_conn.return_value = self.conn
        with patch('api.twitch.send_shoutout', return_value=MagicMock(ok=True, status_code=204)):
            sent = shoutouts.process_one(self.event)
        self.assertIsNotNone(sent)
        self.assertEqual(sent.status, models.ShoutoutStatus.SENT)

    @patch('api.twitch.fetch_stream', return_value=None)  # offline
    @patch('api.twitch.event_primary_connection')
    def test_offline_skips(self, mock_conn, _stream):
        mock_conn.return_value = self.conn
        self.assertIsNone(shoutouts.process_one(self.event))

    @patch('api.twitch.fetch_stream', side_effect=RuntimeError('boom'))
    @patch('api.twitch.event_primary_connection')
    def test_fetch_stream_raises_returns_none(self, mock_conn, _stream):
        mock_conn.return_value = self.conn
        self.assertIsNone(shoutouts.process_one(self.event))

    @patch('api.twitch.ensure_connection_broadcaster_id', return_value='')
    @patch('api.twitch.fetch_stream', return_value={'id': 's'})
    @patch('api.twitch.event_primary_connection')
    def test_no_broadcaster_id(self, mock_conn, *_):
        mock_conn.return_value = self.conn
        self.assertIsNone(shoutouts.process_one(self.event))

    @patch('api.twitch.fetch_user_profile', return_value=None)  # channel not found
    @patch('api.twitch.ensure_connection_broadcaster_id', return_value='999')
    @patch('api.twitch.fetch_stream', return_value={'id': 's'})
    @patch('api.twitch.event_primary_connection')
    def test_channel_not_found_marks_failed(self, mock_conn, *_):
        mock_conn.return_value = self.conn
        shoutouts.process_one(self.event)
        req = self.event.shoutout_requests.get(target_login='friend')
        self.assertEqual(req.status, models.ShoutoutStatus.FAILED)

    @patch('api.twitch.send_shoutout', side_effect=RuntimeError('net'))
    @patch('api.twitch.fetch_user_profile', return_value={'id': '42'})
    @patch('api.twitch.ensure_connection_broadcaster_id', return_value='999')
    @patch('api.twitch.fetch_stream', return_value={'id': 's'})
    @patch('api.twitch.event_primary_connection')
    def test_send_raises_returns_none(self, mock_conn, *_):
        mock_conn.return_value = self.conn
        self.assertIsNone(shoutouts.process_one(self.event))

    @patch('api.twitch.fetch_user_profile', return_value={'id': '42'})
    @patch('api.twitch.ensure_connection_broadcaster_id', return_value='999')
    @patch('api.twitch.fetch_stream', return_value={'id': 's'})
    @patch('api.twitch.event_primary_connection')
    def test_helix_429_leaves_pending(self, mock_conn, *_):
        mock_conn.return_value = self.conn
        resp = MagicMock(ok=False, status_code=429)
        resp.text = 'too fast'
        with patch('api.twitch.send_shoutout', return_value=resp):
            self.assertIsNone(shoutouts.process_one(self.event))
        req = self.event.shoutout_requests.get(target_login='friend')
        self.assertEqual(req.status, models.ShoutoutStatus.PENDING)

    @patch('api.twitch.fetch_user_profile', return_value={'id': '42'})
    @patch('api.twitch.ensure_connection_broadcaster_id', return_value='999')
    @patch('api.twitch.fetch_stream', return_value={'id': 's'})
    @patch('api.twitch.event_primary_connection')
    def test_helix_other_error_marks_failed(self, mock_conn, *_):
        mock_conn.return_value = self.conn
        resp = MagicMock(ok=False, status_code=403)
        resp.text = 'forbidden'
        with patch('api.twitch.send_shoutout', return_value=resp):
            self.assertIsNone(shoutouts.process_one(self.event))
        req = self.event.shoutout_requests.get(target_login='friend')
        self.assertEqual(req.status, models.ShoutoutStatus.FAILED)

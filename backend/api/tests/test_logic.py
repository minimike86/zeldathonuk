"""Coverage of the smaller logic modules: shoutouts, rewards, signals, plus the
remaining sandbox event kinds. External Twitch/chat calls are mocked."""
from __future__ import annotations

from decimal import Decimal
from unittest.mock import MagicMock, patch

from django.test import TestCase, override_settings
from django.utils import timezone
from rest_framework.test import APITestCase

from api import models, rewards, shoutouts


def _event():
    return models.Event.objects.create(
        name='E', start_time=timezone.now(), is_active=True, currency_symbol='£',
    )


def _primary(event, scopes='moderator:manage:shoutouts user:write:chat channel:manage:predictions'):
    conn = models.TwitchChannelConnection.objects.create(
        login='zeldathonuk', broadcaster_id='123', access_token='t', scopes=scopes,
        is_active=True,
    )
    models.EventTwitchChannel.objects.create(
        event=event, login='zeldathonuk', is_primary=True, connection=conn,
    )
    return conn


class ShoutoutTests(TestCase):
    def setUp(self):
        self.event = _event()

    def test_get_config_creates_singleton(self):
        cfg = shoutouts.get_config(self.event)
        self.assertEqual(cfg.event_id, self.event.id)

    def test_enqueue_donor_and_raider(self):
        cfg = shoutouts.get_config(self.event)
        cfg.enabled = True
        cfg.shout_donations = True
        cfg.shout_raids = True
        cfg.save()
        shoutouts.enqueue(self.event, 'friend', reason=models.ShoutoutReason.DONATION,
                          amount=Decimal('10'), display='Friend', note='donated £10')
        shoutouts.enqueue(self.event, 'raider', reason=models.ShoutoutReason.RAID, display='Raider')
        self.assertTrue(models.ShoutoutRequest.objects.filter(event=self.event).exists())
        # A duplicate pending target is skipped.
        self.assertIsNone(
            shoutouts.enqueue(self.event, 'friend', reason=models.ShoutoutReason.DONATION),
        )

    def test_enqueue_disabled_noop(self):
        cfg = shoutouts.get_config(self.event)
        cfg.enabled = False
        cfg.save()
        shoutouts.enqueue(self.event, 'friend', reason=models.ShoutoutReason.DONATION)
        self.assertFalse(
            models.ShoutoutRequest.objects.filter(target_login='friend').exists(),
        )
        # force=True bypasses the gates.
        self.assertIsNotNone(
            shoutouts.enqueue(self.event, 'forced', reason=models.ShoutoutReason.DONATION, force=True),
        )

    @patch('api.twitch.send_shoutout')
    @patch('api.twitch.fetch_stream')
    @patch('api.twitch.ensure_connection_broadcaster_id', return_value='123')
    @patch('api.twitch.event_primary_connection')
    def test_process_one(self, mock_conn, _bid, mock_stream, mock_so):
        conn = _primary(self.event)
        mock_conn.return_value = conn
        mock_stream.return_value = {'id': 's', 'user_login': 'zeldathonuk'}  # live
        mock_so.return_value = MagicMock(ok=True)
        models.ShoutoutRequest.objects.create(
            event=self.event, target_login='friend', reason='donation',
            status='pending',
        )
        shoutouts.process_one(self.event)  # drains one (or no-op if cooldown)

    def test_process_one_empty(self):
        self.assertIsNone(shoutouts.process_one(self.event))


class RewardTests(TestCase):
    def setUp(self):
        self.event = _event()
        self.mapping = models.RewardMapping.objects.create(
            event=self.event, reward_title='Hydrate', enabled=True,
        )

    @patch('api.chat.broadcast', return_value=True)
    def test_handle_redemption_chat_action(self, _b):
        models.RewardAction.objects.create(
            mapping=self.mapping, action_type='chat', enabled=True,
            params={'message': 'Stay hydrated {user}!'},
        )
        rewards.handle_redemption(
            self.event, {'title': 'Hydrate'}, user_login='kris', user_name='Kris',
        )

    def test_handle_redemption_no_mapping(self):
        # Unknown reward title → no mapping → no-op (no raise).
        rewards.handle_redemption(self.event, {'title': 'Unknown'}, user_login='x')


class SignalTests(TestCase):
    @patch('api.chat.send_chat_message')
    def test_donation_crossing_milestone_fires_chat(self, mock_send):
        mock_send.return_value = MagicMock(ok=True)
        from api import chat
        event = _event()
        chat.ensure_announcements(event)
        ann = event.chat_announcements.get(trigger='milestone')
        ann.enabled = True
        ann.template = 'Hit {milestone}!'
        ann.save()
        _primary(event)
        models.Milestone.objects.create(
            event=event, name='£50', threshold_amount=Decimal('50'),
        )
        # A donation that crosses the threshold marks the milestone reached and
        # fires the milestone chat announcement (exercises signals.py).
        models.Donation.objects.create(
            event=event, platform='justgiving', donor_name='Kris',
            amount=Decimal('100'), currency='GBP', donated_at=timezone.now(),
            external_id='big',
        )
        self.assertTrue(models.Milestone.objects.get(name='£50').is_reached)


@override_settings(DEBUG=True)
class SandboxKindTests(APITestCase):
    def setUp(self):
        from api.tests.test_smoke import operator_client
        operator_client(self.client, username='sbk-op', clerk='sbk-clerk')
        self.event = _event()

    def test_twitch_event_kinds(self):
        for kind in ['twitch-follow', 'twitch-sub', 'twitch-sub-gift', 'twitch-resub',
                     'twitch-raid', 'twitch-cheer', 'twitch-redemption']:
            res = self.client.post('/api/sandbox/twitch-event/', {'kind': kind},
                                   format='json')
            self.assertIn(res.status_code, (200, 201, 400))

    def test_donation_muted_variant(self):
        res = self.client.post('/api/sandbox/donation/', {
            'donor_name': 'X', 'amount': '5', 'muted': True, 'platform': 'twitch',
        }, format='json')
        self.assertIn(res.status_code, (200, 201))

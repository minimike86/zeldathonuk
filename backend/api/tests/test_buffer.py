"""Buffer coverage: eventsub external-chat for several event types, chat
broadcast/announce paths, and shoutout process variations."""
from __future__ import annotations

from unittest.mock import MagicMock, patch

from django.test import TestCase
from django.utils import timezone

from api import chat, eventsub, models, shoutouts


def _event():
    return models.Event.objects.create(
        name='E', start_time=timezone.now(), is_active=True, currency_symbol='£',
    )


def _primary(event):
    conn = models.TwitchChannelConnection.objects.create(
        login='zeldathonuk', broadcaster_id='123', access_token='t',
        scopes='user:write:chat moderator:manage:announcements moderator:manage:shoutouts',
        is_active=True,
    )
    models.EventTwitchChannel.objects.create(
        event=event, login='zeldathonuk', is_primary=True, connection=conn,
    )
    return conn


class EventsubChatTypeTests(TestCase):
    def setUp(self):
        self.event = _event()
        chat.ensure_announcements(self.event)
        _primary(self.event)

    @patch('api.chat.send_chat_message')
    def test_announce_external_chat_types(self, mock_send):
        mock_send.return_value = MagicMock(ok=True)
        for trigger in ('follow', 'subscription', 'raid', 'cheer'):
            try:
                a = self.event.chat_announcements.get(trigger=trigger)
                a.enabled = True
                a.template = 'Hi {user}'
                a.save()
            except models.ChatAnnouncement.DoesNotExist:
                pass
        cases = [
            ('channel.follow', {'user_name': 'A'}),
            ('channel.subscribe', {'user_name': 'B', 'tier': '1000'}),
            ('channel.raid', {'from_broadcaster_user_name': 'C', 'viewers': 10}),
            ('channel.cheer', {'user_name': 'D', 'bits': 100}),
        ]
        for evtype, payload in cases:
            eventsub._announce_external_chat(evtype, payload)


class ChatBroadcastTests(TestCase):
    def setUp(self):
        self.event = _event()
        _primary(self.event)

    @patch('api.chat.send_chat_message')
    def test_broadcast_and_announce(self, mock_send):
        mock_send.return_value = MagicMock(ok=True)
        self.assertTrue(chat.broadcast(self.event, 'gg everyone'))

    @patch('api.twitch.send_chat_announcement')
    def test_send_to_event_announcement(self, mock_ann):
        mock_ann.return_value = MagicMock(ok=True)
        self.assertTrue(
            chat._send_to_event(self.event, 'Big news', announcement=True, color='green'),
        )

    def test_recurring_context_and_donate_url(self):
        ctx = chat.recurring_context(self.event)
        self.assertIn('donate_url', ctx)
        self.assertIn('total', ctx)


class ShoutoutProcessTests(TestCase):
    def setUp(self):
        self.event = _event()

    @patch('api.twitch.fetch_stream', return_value=None)  # channel offline
    @patch('api.twitch.event_primary_connection')
    def test_process_one_skips_when_offline(self, mock_conn, _stream):
        mock_conn.return_value = _primary(self.event)
        models.ShoutoutRequest.objects.create(
            event=self.event, target_login='friend', reason='donation', status='pending',
        )
        # Offline from-channel → can't shout; the request stays pending / deferred.
        shoutouts.process_one(self.event)

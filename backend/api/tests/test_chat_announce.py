"""Tests for Twitch chat announcements (api.chat).

Covers template rendering and the announce() gating + send path (mocked Twitch),
without making real network calls.
"""
from __future__ import annotations

from unittest.mock import MagicMock, patch

from django.test import TestCase
from django.utils import timezone

from api import chat, models


def _event(active=True, currency='£'):
    return models.Event.objects.create(
        name='Chat Event', start_time=timezone.now(), is_active=active,
        currency_symbol=currency,
    )


def _connected_primary(event, login='zeldathonuk'):
    conn = models.TwitchChannelConnection.objects.create(
        login=login, broadcaster_id='52548232', access_token='tok',
        scopes='user:write:chat', is_active=True,
    )
    models.EventTwitchChannel.objects.create(
        event=event, login=login, is_primary=True, connection=conn,
    )
    return conn


class RenderTemplateTests(TestCase):
    def test_substitutes_known_placeholders(self):
        out = chat.render_template('{donor} gave {currency}{amount}',
                                   {'donor': 'Kris', 'currency': '£', 'amount': '10.00'})
        self.assertEqual(out, 'Kris gave £10.00')

    def test_none_becomes_blank(self):
        self.assertEqual(chat.render_template('msg {x}', {'x': None}), 'msg ')

    def test_unknown_placeholder_left_intact(self):
        self.assertEqual(chat.render_template('hi {nope}', {}), 'hi {nope}')

    def test_malformed_template_returned_raw(self):
        # A stray brace would raise in str.format — we return the raw template.
        self.assertEqual(chat.render_template('100% {oops', {}), '100% {oops')


class AnnounceTests(TestCase):
    def setUp(self):
        self.event = _event()
        chat.ensure_announcements(self.event)

    def _enable(self, trigger, template='{donor}'):
        a = self.event.chat_announcements.get(trigger=trigger)
        a.enabled = True
        a.template = template
        a.save()

    @patch('api.chat.send_chat_message')
    def test_disabled_trigger_does_not_send(self, mock_send):
        _connected_primary(self.event)
        # donation row exists but is disabled by default
        self.assertFalse(chat.announce(self.event, 'donation', {'donor': 'Kris'}))
        mock_send.assert_not_called()

    @patch('api.chat.send_chat_message')
    def test_enabled_without_connection_does_not_send(self, mock_send):
        self._enable('donation')
        # no connected channel on the event
        self.assertFalse(chat.announce(self.event, 'donation', {'donor': 'Kris'}))
        mock_send.assert_not_called()

    @patch('api.chat.send_chat_message')
    def test_enabled_with_connection_sends(self, mock_send):
        mock_send.return_value = MagicMock(ok=True)
        _connected_primary(self.event)
        self._enable('donation', 'Thanks {donor}!')
        ok = chat.announce(self.event, 'donation', {'donor': 'Kris'})
        self.assertTrue(ok)
        self.assertEqual(mock_send.call_count, 1)
        # message is the 3rd positional arg (connection, broadcaster_id, message)
        sent_message = mock_send.call_args.args[2]
        self.assertEqual(sent_message, 'Thanks Kris!')

    @patch('api.chat.send_chat_message', side_effect=RuntimeError('boom'))
    def test_send_failure_is_swallowed(self, _mock_send):
        _connected_primary(self.event)
        self._enable('donation')
        # announce must never raise — returns False on failure
        self.assertFalse(chat.announce(self.event, 'donation', {'donor': 'Kris'}))


class EnsureAnnouncementsTests(TestCase):
    def test_seeds_one_row_per_trigger_idempotently(self):
        event = _event()
        chat.ensure_announcements(event)
        chat.ensure_announcements(event)  # second call must not duplicate
        self.assertEqual(
            event.chat_announcements.count(), len(models.ChatTrigger.values),
        )

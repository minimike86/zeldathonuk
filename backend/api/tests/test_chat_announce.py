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
        scopes='user:write:chat moderator:manage:announcements', is_active=True,
    )
    models.EventTwitchChannel.objects.create(
        event=event, login=login, is_primary=True, connection=conn,
    )
    return conn


def _connected_charity(event, login, bid, *, scopes='user:write:chat'):
    conn = models.TwitchChannelConnection.objects.create(
        login=login, broadcaster_id=bid, access_token='t', scopes=scopes,
        is_active=True,
    )
    models.EventTwitchChannel.objects.create(
        event=event, login=login, track_charity=True, connection=conn,
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

    @patch('api.twitch.send_chat_announcement')
    @patch('api.chat.send_chat_message')
    def test_announcement_mode_uses_announce_endpoint(self, mock_msg, mock_ann):
        mock_ann.return_value = MagicMock(ok=True)
        _connected_primary(self.event)
        a = self.event.chat_announcements.get(trigger='milestone')
        a.enabled = True
        a.template = 'Milestone!'
        a.as_announcement = True
        a.announcement_color = 'green'
        a.save()
        ok = chat.announce(self.event, 'milestone', {})
        self.assertTrue(ok)
        mock_msg.assert_not_called()
        self.assertEqual(mock_ann.call_args.args[2], 'Milestone!')
        self.assertEqual(mock_ann.call_args.args[3], 'green')

    @patch('api.chat.send_chat_message')
    def test_broadcasts_to_all_chat_capable_channels(self, mock_send):
        mock_send.return_value = MagicMock(ok=True)
        _connected_primary(self.event)  # zeldathonuk, chat scope
        _connected_charity(self.event, 'msec', '222')  # charity + chat scope
        # charity-only connection (no chat scope) → must be skipped
        _connected_charity(self.event, 'other', '333', scopes='channel:read:charity')
        self._enable('donation', 'Thanks {donor}!')
        chat.announce(self.event, 'donation', {'donor': 'Kris'})
        sent_bids = {c.args[1] for c in mock_send.call_args_list}
        self.assertEqual(sent_bids, {'52548232', '222'})

    @patch('api.chat.send_chat_message', side_effect=RuntimeError('boom'))
    def test_send_failure_is_swallowed(self, _mock_send):
        _connected_primary(self.event)
        self._enable('donation')
        # announce must never raise — returns False on failure
        self.assertFalse(chat.announce(self.event, 'donation', {'donor': 'Kris'}))


class ExternalChatTriggerTests(TestCase):
    """The EventSub notification path fires the configured chat announcement for
    sub/follow/raid/cheer/redemption on the active event."""

    def setUp(self):
        self.event = _event()
        chat.ensure_announcements(self.event)
        _connected_primary(self.event)

    @patch('api.chat.send_chat_message')
    def test_redemption_fires_chat(self, mock_send):
        mock_send.return_value = MagicMock(ok=True)
        a = self.event.chat_announcements.get(trigger='redemption')
        a.enabled = True
        a.template = '{user} redeemed {reward}'
        a.save()
        from api import eventsub
        eventsub._announce_external_chat(
            'channel.channel_points_custom_reward_redemption.add',
            {'user_name': 'Kris', 'reward': {'title': 'Hydrate'}},
        )
        self.assertEqual(mock_send.call_args.args[2], 'Kris redeemed Hydrate')

    @patch('api.chat.send_chat_message')
    def test_unmapped_type_does_nothing(self, mock_send):
        from api import eventsub
        eventsub._announce_external_chat('channel.unknown.event', {})
        mock_send.assert_not_called()


class BroadcastTests(TestCase):
    @patch('api.chat.send_chat_message')
    def test_broadcast_sends_arbitrary_message(self, mock_send):
        mock_send.return_value = MagicMock(ok=True)
        event = _event()
        _connected_primary(event)
        self.assertTrue(chat.broadcast(event, 'gg everyone Kappa'))
        self.assertEqual(mock_send.call_args.args[2], 'gg everyone Kappa')

    def test_broadcast_blank_message_noop(self):
        event = _event()
        self.assertFalse(chat.broadcast(event, '   '))


class RecurringMessageTests(TestCase):
    def setUp(self):
        self.event = _event(currency='£')

    def test_is_due_logic(self):
        from datetime import timedelta
        m = models.RecurringChatMessage.objects.create(
            event=self.event, template='hi', interval_minutes=10, enabled=True,
        )
        self.assertTrue(m.is_due)  # never posted
        m.last_posted_at = timezone.now()
        self.assertFalse(m.is_due)  # just posted
        m.last_posted_at = timezone.now() - timedelta(minutes=11)
        self.assertTrue(m.is_due)  # past the interval
        m.enabled = False
        self.assertFalse(m.is_due)  # disabled never due

    def test_recurring_context_fields(self):
        ctx = chat.recurring_context(self.event)
        self.assertEqual(set(ctx), {'donate_url', 'total', 'charity', 'channel'})
        self.assertEqual(ctx['total'], '£0.00')

    def test_donate_url_prefers_primary_page(self):
        models.DonationPage.objects.create(
            event=self.event, platform='justgiving',
            url='https://justgiving.com/x', is_primary=True,
        )
        self.assertEqual(chat.event_donate_url(self.event), 'https://justgiving.com/x')

    def test_donate_url_falls_back_to_twitch_charity(self):
        conn = models.TwitchChannelConnection.objects.create(login='msec', access_token='t')
        models.EventTwitchChannel.objects.create(
            event=self.event, login='msec', track_charity=True, connection=conn,
        )
        self.assertEqual(
            chat.event_donate_url(self.event), 'https://www.twitch.tv/charity/msec',
        )

    def test_donate_url_charity_channel_beats_non_primary_page(self):
        # A donation page that's only first-by-order (NOT explicitly primary)
        # loses to the event's charity-tracking Twitch channel.
        models.DonationPage.objects.create(
            event=self.event, platform='tiltify',
            url='https://tiltify.com/@z/x', is_primary=False,
        )
        conn = models.TwitchChannelConnection.objects.create(login='zeldathonuk', access_token='t')
        models.EventTwitchChannel.objects.create(
            event=self.event, login='zeldathonuk', track_charity=True,
            is_primary=True, connection=conn,
        )
        self.assertEqual(
            chat.event_donate_url(self.event),
            'https://www.twitch.tv/charity/zeldathonuk',
        )

    def test_donate_url_explicit_primary_page_overrides_charity_channel(self):
        # An explicitly-primary donation page is an operator override → it wins.
        models.DonationPage.objects.create(
            event=self.event, platform='tiltify',
            url='https://tiltify.com/@z/x', is_primary=True,
        )
        conn = models.TwitchChannelConnection.objects.create(login='zeldathonuk', access_token='t')
        models.EventTwitchChannel.objects.create(
            event=self.event, login='zeldathonuk', track_charity=True,
            is_primary=True, connection=conn,
        )
        self.assertEqual(chat.event_donate_url(self.event), 'https://tiltify.com/@z/x')

    def test_donate_url_non_primary_page_used_when_no_charity_channel(self):
        # No charity channel → fall back to any donation page.
        models.DonationPage.objects.create(
            event=self.event, platform='tiltify',
            url='https://tiltify.com/@z/x', is_primary=False,
        )
        self.assertEqual(chat.event_donate_url(self.event), 'https://tiltify.com/@z/x')

    @patch('api.chat.send_chat_message')
    def test_post_recurring_renders_and_sends(self, mock_send):
        mock_send.return_value = MagicMock(ok=True)
        _connected_primary(self.event)
        m = models.RecurringChatMessage.objects.create(
            event=self.event, template='Donate: {donate_url}', enabled=True,
        )
        models.DonationPage.objects.create(
            event=self.event, platform='tiltify', url='https://tiltify.com/z',
            is_primary=True,
        )
        self.assertTrue(chat.post_recurring(self.event, m))
        self.assertEqual(mock_send.call_args.args[2], 'Donate: https://tiltify.com/z')


class EnsureAnnouncementsTests(TestCase):
    def test_seeds_one_row_per_trigger_idempotently(self):
        event = _event()
        chat.ensure_announcements(event)
        chat.ensure_announcements(event)  # second call must not duplicate
        self.assertEqual(
            event.chat_announcements.count(), len(models.ChatTrigger.values),
        )

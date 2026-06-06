"""Tests for per-event Twitch channels.

Covers the EventTwitchChannel model invariants, event-scoped
``charity_poll_sources()``, the device-code OAuth helpers (mocked Twitch), the
connect→connection linking, and the event serializer's new fields.
"""
from __future__ import annotations

from unittest.mock import MagicMock, patch

from django.test import TestCase, override_settings
from django.utils import timezone

from api import models, serializers, twitch


def _event(name='Event', active=True):
    return models.Event.objects.create(
        name=name, start_time=timezone.now(), is_active=active,
    )


class EventTwitchChannelModelTests(TestCase):
    def setUp(self):
        self.event = _event()

    def test_login_normalised_lowercase(self):
        ch = models.EventTwitchChannel.objects.create(event=self.event, login='MSec')
        ch.refresh_from_db()
        self.assertEqual(ch.login, 'msec')

    def test_single_primary_per_event(self):
        a = models.EventTwitchChannel.objects.create(
            event=self.event, login='zeldathonuk', is_primary=True,
        )
        b = models.EventTwitchChannel.objects.create(
            event=self.event, login='msec', is_primary=True,
        )
        a.refresh_from_db()
        self.assertFalse(a.is_primary)  # demoted
        self.assertTrue(b.is_primary)


class CharityPollSourcesTests(TestCase):
    def test_event_scoped_sources(self):
        active = _event('Active', active=True)
        other = _event('Other', active=False)
        conn = models.TwitchChannelConnection.objects.create(
            login='msec', broadcaster_id='999', access_token='tok',
            scopes='channel:read:charity',
        )
        # charity channel on the active event → included
        models.EventTwitchChannel.objects.create(
            event=active, login='msec', track_charity=True, connection=conn,
        )
        # live-status-only channel (no charity) → excluded
        models.EventTwitchChannel.objects.create(
            event=active, login='zeldathonuk', track_charity=False,
        )
        # charity channel on an inactive event → excluded
        models.EventTwitchChannel.objects.create(
            event=other, login='msec', track_charity=True, connection=conn,
        )
        srcs = twitch.charity_poll_sources()
        self.assertEqual([(login, bid) for login, _c, bid in srcs], [('msec', '999')])

    def test_no_active_event(self):
        _event('Off', active=False)
        self.assertEqual(twitch.charity_poll_sources(), [])

    def test_charity_channel_without_connection_excluded(self):
        active = _event('Active', active=True)
        models.EventTwitchChannel.objects.create(
            event=active, login='msec', track_charity=True, connection=None,
        )
        self.assertEqual(twitch.charity_poll_sources(), [])


@override_settings(TWITCH_CLIENT_ID='test-client-id')
class SaveConnectionTests(TestCase):
    @patch('api.twitch.requests.get')
    def test_save_connection_resolves_and_links(self, mock_get):
        mock_get.return_value = MagicMock(ok=True)
        mock_get.return_value.json.return_value = {
            'data': [{'id': '123', 'login': 'msec', 'display_name': 'MSec'}],
        }
        ev = _event()
        ch = models.EventTwitchChannel.objects.create(
            event=ev, login='msec', track_charity=True,
        )
        token = {'access_token': 'a', 'refresh_token': 'r', 'expires_in': 3600,
                 'scope': ['channel:read:charity']}
        conn = twitch.save_connection('msec', token)
        ch.refresh_from_db()
        self.assertEqual(conn.broadcaster_id, '123')
        self.assertEqual(conn.scopes, 'channel:read:charity')
        self.assertEqual(ch.connection_id, conn.id)  # auto-linked


@override_settings(TWITCH_CLIENT_ID='test-client-id')
class DeviceTokenPollTests(TestCase):
    @patch('api.twitch.requests.post')
    def test_pending(self, mock_post):
        mock_post.return_value = MagicMock(ok=False)
        mock_post.return_value.json.return_value = {'message': 'authorization_pending'}
        self.assertEqual(twitch.poll_device_token('dc')['status'], 'pending')

    @patch('api.twitch.requests.post')
    def test_authorized(self, mock_post):
        mock_post.return_value = MagicMock(ok=True)
        mock_post.return_value.json.return_value = {'access_token': 'a', 'expires_in': 3600}
        res = twitch.poll_device_token('dc')
        self.assertEqual(res['status'], 'authorized')
        self.assertEqual(res['token']['access_token'], 'a')


class EventSerializerTwitchChannelsTests(TestCase):
    def test_primary_and_nested_fields(self):
        ev = _event()
        models.EventTwitchChannel.objects.create(
            event=ev, login='zeldathonuk', is_primary=True,
        )
        data = serializers.EventSerializer(ev).data
        self.assertEqual(data['primary_twitch_channel'], 'zeldathonuk')
        self.assertEqual(len(data['twitch_channels']), 1)
        self.assertNotIn('twitch_channel', data)  # old single field gone
        self.assertFalse(data['twitch_channels'][0]['is_connected'])

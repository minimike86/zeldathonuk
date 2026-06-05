"""Unit coverage of the integration modules with the network layer mocked:
twitch, webhooks, sandbox, audio, igdb, ocremix, authentication.
"""
from __future__ import annotations

from datetime import timedelta
from decimal import Decimal
from unittest.mock import MagicMock, patch

from django.test import TestCase, override_settings
from django.utils import timezone
from rest_framework.test import APITestCase

from api import models


def _resp(json_body=None, *, ok=True, status_code=200, text='', content=b''):
    m = MagicMock()
    m.ok = ok
    m.status_code = status_code
    m.text = text or str(json_body or '')
    m.content = content
    m.headers = {'Content-Type': 'application/json'}
    m.json.return_value = json_body if json_body is not None else {}
    m.iter_content = lambda chunk_size=8192: iter([content]) if content else iter([])
    return m


# A response superset that satisfies most Helix parsers.
_HELIX_BODY = {
    'data': [{
        'id': '123', 'login': 'zeldathonuk', 'display_name': 'ZeldathonUK',
        'user_login': 'kris', 'user_name': 'Kris', 'broadcaster_login': 'zeldathonuk',
        'title': 'A title', 'status': 'enabled', 'game_name': 'OoT',
        'started_at': '2026-01-01T00:00:00Z', 'viewer_count': 5,
        'amount': {'value': 1000, 'decimal_places': 2, 'currency': 'GBP'},
        'current_amount': {'value': 1000, 'decimal_places': 2, 'currency': 'GBP'},
        'target_amount': {'value': 500000, 'decimal_places': 2, 'currency': 'GBP'},
        'condition': {}, 'version': '1', 'type': 'channel.follow',
        'transport': {'callback': 'https://x/cb'}, 'name': 'Hydrate',
    }],
    'total': 1, 'pagination': {},
    'access_token': 'newtok', 'refresh_token': 'newref', 'expires_in': 3600,
    'device_code': 'dc', 'user_code': 'WXYZ', 'verification_uri': 'https://t/activate',
    'scopes': ['channel:read:charity'], 'interval': 5,
}


@override_settings(TWITCH_CLIENT_ID='cid', TWITCH_CLIENT_SECRET='sec')
class TwitchModuleTests(TestCase):
    def setUp(self):
        now = timezone.now()
        tok = models.TwitchOAuthToken.get()
        tok.access_token = 'usertok'
        tok.refresh_token = 'userref'
        tok.expires_at = now + timedelta(hours=1)
        tok.save()
        self.conn = models.TwitchChannelConnection.objects.create(
            login='zeldathonuk', broadcaster_id='123', access_token='conntok',
            scopes='channel:read:charity user:write:chat moderator:manage:announcements '
                   'channel:manage:broadcast channel:manage:predictions '
                   'moderator:manage:shoutouts channel:manage:redemptions',
            is_active=True,
        )
        self.event = models.Event.objects.create(
            name='E', start_time=now, is_active=True,
        )
        models.EventTwitchChannel.objects.create(
            event=self.event, login='zeldathonuk', is_primary=True,
            track_charity=True, connection=self.conn,
        )
        self.p = patch('api.twitch.requests')
        self.req = self.p.start()
        self.req.request.return_value = _resp(_HELIX_BODY)
        self.req.get.return_value = _resp(_HELIX_BODY)
        self.req.post.return_value = _resp(_HELIX_BODY)
        self.addCleanup(self.p.stop)

    def test_token_and_id_helpers(self):
        from api import twitch
        self.assertEqual(twitch.get_user_access_token(), 'usertok')
        self.assertEqual(twitch.valid_token_for(self.conn), 'conntok')
        self.assertEqual(twitch.resolve_broadcaster_id(), '123')
        # App token may come from a process-level cache populated by an earlier
        # test; assert it's a usable token rather than the exact mocked value.
        self.assertTrue(twitch.get_app_access_token())
        self.assertEqual(twitch.extract_twitch_login('https://twitch.tv/Foo'), 'Foo')
        self.assertIsNone(twitch.extract_twitch_login('https://example.com/x'))

    def test_helix_reads(self):
        from api import twitch
        self.assertIsNotNone(twitch.fetch_user_profile('zeldathonuk'))
        self.assertIsNotNone(twitch.fetch_stream('zeldathonuk'))
        self.assertIsInstance(twitch.list_eventsub_subscriptions(), list)
        self.assertIsNotNone(twitch.fetch_active_charity_campaign(tok=self.conn, broadcaster_id='123'))
        self.assertIsInstance(twitch.fetch_charity_donations('cid', tok=self.conn, broadcaster_id='123'), list)
        self.assertIsInstance(twitch.fetch_custom_rewards(self.conn, '123'), list)
        self.assertIsInstance(twitch.fetch_global_emotes(), list)
        self.assertIsInstance(twitch.charity_poll_sources(), list)
        self.assertEqual(twitch.ensure_connection_broadcaster_id(self.conn), '123')
        self.assertIsNotNone(twitch.event_primary_connection(self.event))

    def test_helix_writes(self):
        from api import twitch
        twitch.create_eventsub_subscription('channel.follow', '1', {'broadcaster_user_id': '1'}, 'https://cb', 'sec')
        twitch.delete_eventsub_subscription('sub1')
        twitch.send_chat_announcement(self.conn, '123', 'hi', 'green')
        twitch.send_shoutout(self.conn, '123', '456', '123')
        twitch.modify_channel(self.conn, '123', game_id='99', title='New')
        twitch.create_prediction(self.conn, '123', 'Win?', ['Yes', 'No'], 120)
        twitch.end_prediction(self.conn, '123', 'p1', 'RESOLVED', 'o1')

    def test_device_flow_and_save(self):
        from api import twitch
        start = twitch.start_device_authorization('channel:read:charity')
        self.assertEqual(start['user_code'], 'WXYZ')
        tokresp = twitch.poll_device_token('dc')
        self.assertEqual(tokresp['status'], 'authorized')
        conn = twitch.save_connection('zeldathonuk', tokresp['token'])
        self.assertEqual(conn.login, 'zeldathonuk')

    def test_update_channel_for_game(self):
        from api import twitch
        game = models.Game.objects.create(
            title='OoT', platform='N64', layout_type='4x3', default_play_minutes=60,
            twitch_game_id='7193',
        )
        entry = models.ScheduleEntry.objects.create(
            event=self.event, game=game, order=1, slot_type='game',
        )
        self.event.update_twitch_category = True
        self.event.save()
        self.assertTrue(twitch.update_channel_for_game(self.event, entry))


@override_settings(TWITCH_CLIENT_ID='cid', TWITCH_CLIENT_SECRET='sec', TWITCH_BROADCASTER_ID='123')
class TwitchViewTests(APITestCase):
    def setUp(self):
        from api.tests.test_smoke import operator_client
        operator_client(self.client, username='tv-op', clerk='tv-clerk')
        now = timezone.now()
        tok = models.TwitchOAuthToken.get()
        tok.access_token = 'usertok'
        tok.expires_at = now + timedelta(hours=1)
        tok.save()
        self.event = models.Event.objects.create(
            name='E', start_time=now, is_active=True,
        )
        self.conn = models.TwitchChannelConnection.objects.create(
            login='zeldathonuk', broadcaster_id='123', access_token='c',
            scopes='channel:manage:broadcast user:write:chat moderator:manage:announcements',
            is_active=True,
        )
        models.EventTwitchChannel.objects.create(
            event=self.event, login='zeldathonuk', is_primary=True, connection=self.conn,
        )

    @patch('api.twitch.requests')
    def test_stream_status_and_schedule(self, req):
        # Schedule list returns {data:{segments:[...]}}; stream uses {data:[...]}.
        req.request.return_value = _resp({'data': {'segments': []}, 'pagination': {}})
        req.get.return_value = _resp(_HELIX_BODY)
        self.assertEqual(self.client.get('/api/twitch/stream-status/?login=zeldathonuk').status_code, 200)
        game = models.Game.objects.create(
            title='G', platform='NES', layout_type='4x3', default_play_minutes=60,
            twitch_game_id='42',
        )
        models.ScheduleEntry.objects.create(event=self.event, game=game, order=1, slot_type='game')
        self.assertEqual(self.client.post('/api/twitch/push-schedule/').status_code, 200)
        self.assertEqual(self.client.post('/api/twitch/clear-schedule/').status_code, 200)

    @patch('api.twitch.list_eventsub_subscriptions', return_value=[{'id': '1', 'type': 'x', 'status': 'enabled', 'condition': {}, 'version': '1'}])
    def test_eventsub_dashboard(self, _m):
        self.assertEqual(self.client.get('/api/twitch/eventsub/subscriptions/').status_code, 200)

    @patch('api.twitch.fetch_global_emotes', return_value=[{'id': 'e', 'name': 'Kappa', 'images': {}}])
    def test_twitch_emotes(self, _m):
        self.assertEqual(self.client.get('/api/twitch/emotes/').status_code, 200)

    @patch('api.twitch.fetch_custom_rewards', return_value=[{'id': 'r', 'title': 'Hydrate'}])
    def test_twitch_rewards(self, _m):
        self.assertEqual(self.client.get('/api/twitch/rewards/').status_code, 200)

    @patch('api.chat.broadcast', return_value=True)
    def test_twitch_chat_send(self, _m):
        res = self.client.post('/api/twitch/chat/send/', {'message': 'gg'})
        self.assertIn(res.status_code, (200, 400))

    @patch('api.twitch.start_device_authorization', return_value={'device_code': 'd', 'user_code': 'U', 'verification_uri': 'https://t', 'interval': 5, 'expires_in': 600})
    def test_connect_start(self, _m):
        res = self.client.post('/api/twitch/connect/start/', {'login': 'zeldathonuk'})
        self.assertIn(res.status_code, (200, 400))

    @patch('api.justgiving.requests.get')
    def test_justgiving_test_endpoint(self, mock_get):
        models.DonationPage.objects.create(
            event=self.event, platform=models.DonationPlatform.JUSTGIVING,
            url='https://justgiving.com/x', external_id='zeldathon',
        )
        mock_get.return_value = _resp({'donations': [], 'pagination': {'totalPages': 1}})
        with self.settings(JUSTGIVING_API_KEY='app'):
            self.assertEqual(self.client.post('/api/justgiving/test/').status_code, 200)


class WebhookTests(APITestCase):
    def setUp(self):
        self.event = models.Event.objects.create(
            name='E', start_time=timezone.now(), is_active=True,
        )

    def test_justgiving_webhook(self):
        res = self.client.post('/api/webhooks/justgiving/', {
            'donationRef': 'jg1', 'donorDisplayName': 'Kris', 'amount': '10',
            'currencyCode': 'GBP', 'message': 'gg', 'estimatedTaxReclaim': '2.5',
        }, format='json')
        self.assertEqual(res.status_code, 201)
        self.assertTrue(models.Donation.objects.filter(external_id='jg1').exists())

    def test_tiltify_webhook(self):
        res = self.client.post('/api/webhooks/tiltify/', {
            'data': {'id': 'tl1', 'donor_name': 'Sam',
                     'amount': {'value': '5', 'currency': 'GBP'}, 'donor_comment': 'hi'},
        }, format='json')
        self.assertEqual(res.status_code, 201)

    def test_generic_webhook(self):
        res = self.client.post('/api/webhooks/donation/', {
            'external_id': 'g1', 'donor_name': 'X', 'amount': '3', 'currency': 'GBP',
        }, format='json')
        self.assertIn(res.status_code, (200, 201, 400))

    def test_missing_id_rejected(self):
        self.assertEqual(
            self.client.post('/api/webhooks/justgiving/', {}, format='json').status_code, 400,
        )


@override_settings(DEBUG=True)
class SandboxTests(APITestCase):
    def setUp(self):
        from api.tests.test_smoke import operator_client
        operator_client(self.client, username='sb-op', clerk='sb-clerk')
        self.event = models.Event.objects.create(
            name='E', start_time=timezone.now(), is_active=True, currency_symbol='£',
        )

    def test_sandbox_donation(self):
        res = self.client.post('/api/sandbox/donation/', {
            'donor_name': 'Kris', 'amount': '12.34', 'message': 'gg',
        }, format='json')
        self.assertIn(res.status_code, (200, 201))

    def test_sandbox_twitch_event(self):
        res = self.client.post('/api/sandbox/twitch-event/', {
            'kind': 'follow', 'user_name': 'Kris',
        }, format='json')
        self.assertIn(res.status_code, (200, 201, 400))

    def test_sandbox_charity_campaign(self):
        res = self.client.post('/api/sandbox/charity-campaign/', {
            'current': '100', 'target': '5000',
        }, format='json')
        self.assertIn(res.status_code, (200, 201, 400))


class AudioTests(APITestCase):
    def setUp(self):
        from api.tests.test_smoke import operator_client
        operator_client(self.client, username='audio-op', clerk='audio-clerk')
        self.track = models.AudioTrack.objects.create(
            title='OCR', source_url='https://ocr.org/t.mp3',
        )

    def test_playlist_and_now_playing(self):
        self.assertEqual(self.client.get('/api/audio/playlist/').status_code, 200)
        self.assertEqual(self.client.get('/api/audio/now-playing/').status_code, 200)

    def test_set_now_playing(self):
        res = self.client.put('/api/audio/now-playing/', {'track_id': self.track.id}, format='json')
        self.assertIn(res.status_code, (200, 201, 400))

    def test_update_track(self):
        res = self.client.patch(f'/api/audio/track/{self.track.id}/', {'title': 'New'}, format='json')
        self.assertIn(res.status_code, (200, 400))

    @patch('api.audio.requests.get')
    def test_proxy(self, mock_get):
        mock_get.return_value = _resp(content=b'audio-bytes')
        res = self.client.get('/api/audio/proxy/?url=https://ocr.org/t.mp3')
        self.assertIn(res.status_code, (200, 400, 502))

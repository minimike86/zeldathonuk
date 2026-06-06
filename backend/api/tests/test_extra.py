"""Coverage of Clerk JWT auth, the audio proxy, and the remaining management
command branches. All external calls are mocked."""
from __future__ import annotations

from unittest.mock import MagicMock, patch

from django.core.management import call_command
from django.test import TestCase, override_settings
from django.utils import timezone
from jwt import InvalidTokenError
from rest_framework.test import APIRequestFactory, APITestCase

from api import models
from api.authentication import ClerkJWTAuthentication

_FUTURE = 9999999999


@override_settings(
    CLERK_ISSUERS=['https://clerk.test'],
    CLERK_AUTHORIZED_PARTIES=['http://localhost:5173'],
)
class ClerkAuthTests(TestCase):
    def _req(self, auth=None):
        kw = {'HTTP_AUTHORIZATION': auth} if auth else {}
        return APIRequestFactory().get('/api/me/', **kw)

    def _auth(self, req):
        return ClerkJWTAuthentication().authenticate(req)

    def test_no_or_non_bearer_header(self):
        self.assertIsNone(self._auth(self._req()))
        self.assertIsNone(self._auth(self._req('Basic abc')))
        self.assertIsNone(self._auth(self._req('Bearer')))  # malformed (len 1)

    @patch('api.authentication.jwt.decode', side_effect=InvalidTokenError('bad'))
    def test_undecodable(self, _m):
        self.assertIsNone(self._auth(self._req('Bearer xyz')))

    @patch('api.authentication.jwt.decode', return_value={'iss': 'https://evil'})
    def test_untrusted_issuer(self, _m):
        self.assertIsNone(self._auth(self._req('Bearer xyz')))

    @patch('api.authentication._jwks_client_for')
    @patch('api.authentication.jwt.decode')
    def test_valid_creates_then_updates_user(self, mock_dec, mock_jwks):
        mock_jwks.return_value.get_signing_key_from_jwt.return_value = MagicMock(key='k')
        mock_dec.side_effect = [
            {'iss': 'https://clerk.test'},  # unverified iss read
            {'sub': 'user_1', 'exp': _FUTURE, 'azp': 'http://localhost:5173',
             'email': 'a@b.c', 'iss': 'https://clerk.test'},
        ]
        result = self._auth(self._req('Bearer xyz'))
        self.assertIsNotNone(result)
        self.assertTrue(models.Profile.objects.filter(clerk_user_id='user_1').exists())
        # Re-auth with a new email → exercises the update branch.
        mock_dec.side_effect = [
            {'iss': 'https://clerk.test'},
            {'sub': 'user_1', 'exp': _FUTURE, 'email': 'new@b.c',
             'iss': 'https://clerk.test'},
        ]
        self.assertIsNotNone(self._auth(self._req('Bearer xyz')))

    @patch('api.authentication._jwks_client_for')
    @patch('api.authentication.jwt.decode')
    def test_untrusted_azp(self, mock_dec, mock_jwks):
        mock_jwks.return_value.get_signing_key_from_jwt.return_value = MagicMock(key='k')
        mock_dec.side_effect = [
            {'iss': 'https://clerk.test'},
            {'sub': 'u2', 'exp': _FUTURE, 'azp': 'http://evil.example'},
        ]
        self.assertIsNone(self._auth(self._req('Bearer xyz')))

    @patch('api.authentication._jwks_client_for')
    @patch('api.authentication.jwt.decode')
    def test_verification_failure(self, mock_dec, mock_jwks):
        mock_jwks.return_value.get_signing_key_from_jwt.return_value = MagicMock(key='k')
        mock_dec.side_effect = [
            {'iss': 'https://clerk.test'},
            InvalidTokenError('expired'),
        ]
        self.assertIsNone(self._auth(self._req('Bearer xyz')))


class AudioProxyTests(APITestCase):
    def setUp(self):
        self.track = models.AudioTrack.objects.create(
            title='Hyrule', artist='DJ', game='Zelda', ocr_id='OCR9',
            source_url='https://ocremix.org/m.mp3', enabled=True, order=0,
        )

    def _mock_upstream(self):
        up = MagicMock(ok=True, status_code=200)
        up.headers = {'Content-Type': 'audio/mpeg', 'Content-Length': '8'}
        up.iter_content = lambda chunk_size=8192: iter([b'ID3audio'])
        return up

    @patch('api.audio.requests.get')
    def test_proxy_full_and_range(self, mock_get):
        mock_get.return_value = self._mock_upstream()
        full = self.client.get(f'/api/audio/proxy/?id={self.track.id}')
        self.assertEqual(full.status_code, 200)
        # Second request hits the warm cache; a Range yields a 206 partial.
        part = self.client.get(f'/api/audio/proxy/?id={self.track.id}', HTTP_RANGE='bytes=0-3')
        self.assertIn(part.status_code, (200, 206))

    def test_proxy_bad_id(self):
        self.assertEqual(self.client.get('/api/audio/proxy/').status_code, 400)
        self.assertEqual(self.client.get('/api/audio/proxy/?id=abc').status_code, 400)
        self.assertEqual(self.client.get('/api/audio/proxy/?id=999999').status_code, 404)

    def test_proxy_disallowed_domain(self):
        bad = models.AudioTrack.objects.create(
            title='X', source_url='https://evil.example/m.mp3', enabled=True,
        )
        self.assertEqual(self.client.get(f'/api/audio/proxy/?id={bad.id}').status_code, 400)

    @patch('api.audio.requests.get', side_effect=__import__('requests').exceptions.ConnectionError('boom'))
    def test_proxy_upstream_error_disables_track(self, _m):
        t = models.AudioTrack.objects.create(
            title='Y', source_url='https://ocremix.org/z.mp3', enabled=True, ocr_id='OCR8',
        )
        self.assertEqual(self.client.get(f'/api/audio/proxy/?id={t.id}').status_code, 404)
        t.refresh_from_db()
        self.assertFalse(t.enabled)

    def test_now_playing_put_invalid_and_clear(self):
        from api.tests.test_smoke import operator_client
        operator_client(self.client, username='np-op', clerk='np-clerk')
        self.assertEqual(
            self.client.put('/api/audio/now-playing/', {'track_id': 999999}, format='json').status_code,
            400,
        )
        self.assertEqual(
            self.client.put('/api/audio/now-playing/', {'track_id': None}, format='json').status_code,
            200,
        )


class CommandBranchTests(TestCase):
    def setUp(self):
        self.event = models.Event.objects.create(
            name='E', start_time=timezone.now(), is_active=True, currency_symbol='£',
        )

    @patch('api.twitch.charity_poll_sources')
    @patch('api.twitch.fetch_active_charity_campaign')
    @patch('api.twitch.fetch_charity_donations')
    def test_poll_donations_twitch_branch(self, mock_don, mock_camp, mock_sources):
        mock_sources.return_value = [('zeldathonuk', MagicMock(), '123')]
        mock_camp.return_value = {'id': 'c1', 'broadcaster_login': 'zeldathonuk',
                                  'current_amount': {'value': 100, 'decimal_places': 2}}
        mock_don.return_value = [{
            'id': 'tw1', 'user_name': 'Kris',
            'amount': {'value': 500, 'decimal_places': 2, 'currency': 'GBP'},
        }]
        call_command('poll_donations', '--twitch', verbosity=0)

    def test_post_chat_reminders_with_due_message(self):
        models.RecurringChatMessage.objects.create(
            event=self.event, template='Donate: {donate_url}', interval_minutes=1,
            enabled=True,
        )
        with patch('api.chat.send_chat_message') as mock_send:
            mock_send.return_value = MagicMock(ok=True)
            models.TwitchChannelConnection.objects.create(
                login='zeldathonuk', broadcaster_id='1', access_token='t',
                scopes='user:write:chat', is_active=True,
            )
            models.EventTwitchChannel.objects.update_or_create(
                event=self.event, login='zeldathonuk',
                defaults={'is_primary': True,
                          'connection': models.TwitchChannelConnection.objects.first()},
            )
            call_command('post_chat_reminders', verbosity=0)

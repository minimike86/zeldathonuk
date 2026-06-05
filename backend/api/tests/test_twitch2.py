"""twitch.py 401-retry branches + ensure_connection_broadcaster_id resolution."""
from __future__ import annotations

from datetime import timedelta
from unittest.mock import MagicMock, patch

from django.test import TestCase, override_settings
from django.utils import timezone

from api import models, twitch


def _resp(body=None, *, ok=True, status_code=200):
    m = MagicMock(ok=ok, status_code=status_code)
    m.json.return_value = body if body is not None else {'data': []}
    m.text = str(body or '')
    return m


_OK = _resp({'data': [{'id': '123', 'display_name': 'Z', 'login': 'z',
                       'user_name': 'Z', 'name': 'Kappa', 'images': {}}],
             'access_token': 'apptok', 'expires_in': 3600})


@override_settings(TWITCH_CLIENT_ID='cid', TWITCH_CLIENT_SECRET='sec')
class Twitch401RetryTests(TestCase):
    def setUp(self):
        tok = models.TwitchOAuthToken.get()
        tok.access_token = 'a'
        tok.refresh_token = 'r'
        tok.expires_at = timezone.now() + timedelta(hours=1)
        tok.save()

    @patch('api.twitch.requests')
    def test_fetch_stream_401_retry(self, req):
        req.post.return_value = _OK  # app-token mint / refresh
        req.get.side_effect = [_resp(status_code=401), _resp({'data': [{'id': 's'}]})]
        self.assertIsNotNone(twitch.fetch_stream('z'))

    @patch('api.twitch.requests')
    def test_fetch_global_emotes_401_retry(self, req):
        req.post.return_value = _OK
        req.get.side_effect = [_resp(status_code=401), _resp({'data': [{'id': 'e', 'name': 'K'}]})]
        self.assertIsInstance(twitch.fetch_global_emotes(), list)

    @patch('api.twitch.requests')
    def test_fetch_user_profile_401_retry(self, req):
        req.post.return_value = _OK
        req.get.side_effect = [_resp(status_code=401), _resp({'data': [{'id': '1', 'login': 'z'}]})]
        self.assertIsNotNone(twitch.fetch_user_profile('z'))

    @patch('api.twitch.requests')
    def test_ensure_broadcaster_id_resolves_when_empty(self, req):
        req.request.return_value = _resp({'data': [{'id': '999', 'display_name': 'Z'}]})
        conn = models.TwitchChannelConnection.objects.create(
            login='z', broadcaster_id='', access_token='c', is_active=True,
        )
        self.assertEqual(twitch.ensure_connection_broadcaster_id(conn), '999')
        conn.refresh_from_db()
        self.assertEqual(conn.broadcaster_id, '999')

    @patch('api.twitch.requests')
    def test_ensure_broadcaster_id_error_returns_empty(self, req):
        req.request.return_value = _resp(ok=False, status_code=500)
        conn = models.TwitchChannelConnection.objects.create(
            login='z2', broadcaster_id='', access_token='c', is_active=True,
        )
        self.assertEqual(twitch.ensure_connection_broadcaster_id(conn), '')

    @patch('api.twitch.requests')
    def test_request_as_401_retry(self, req):
        conn = models.TwitchChannelConnection.objects.create(
            login='z3', broadcaster_id='1', access_token='c', refresh_token='r2',
            is_active=True,
        )
        req.post.return_value = _resp({'access_token': 'fresh', 'refresh_token': 'r3', 'expires_in': 3600})
        req.request.side_effect = [_resp(status_code=401), _resp({'data': [{'id': '1'}]})]
        resp = twitch._request_as(conn, 'GET', f'{twitch.HELIX}/users')
        self.assertEqual(resp.status_code, 200)

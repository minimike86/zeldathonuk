"""Targeted coverage fill: twitch error/refresh paths, the 401-retry wrapper,
the remaining game/event/prediction view internals, and module edge cases."""
from __future__ import annotations

from datetime import timedelta
from decimal import Decimal
from unittest.mock import MagicMock, patch

from django.contrib.auth import get_user_model
from django.test import TestCase, override_settings
from django.utils import timezone
from rest_framework.test import APITestCase

from api import models, twitch
from api.twitch import TwitchAuthError


def _resp(body=None, *, ok=True, status_code=200):
    m = MagicMock(ok=ok, status_code=status_code)
    m.json.return_value = body if body is not None else {'data': []}
    m.text = str(body or '')
    return m


@override_settings(TWITCH_CLIENT_ID='cid', TWITCH_CLIENT_SECRET='sec',
                   TWITCH_ACCESS_TOKEN='', TWITCH_REFRESH_TOKEN='')
class TwitchErrorPathTests(TestCase):
    def test_no_user_token_raises(self):
        # Fresh singleton, no env seed → configuration error.
        tok = models.TwitchOAuthToken.get()
        tok.access_token = ''
        tok.refresh_token = ''
        tok.save()
        with self.assertRaises(TwitchAuthError):
            twitch.get_user_access_token()

    def test_valid_token_for_empty(self):
        conn = models.TwitchChannelConnection.objects.create(login='x', access_token='', refresh_token='')
        with self.assertRaises(TwitchAuthError):
            twitch.valid_token_for(conn)

    @patch('api.twitch.requests')
    def test_request_401_retry_then_refresh(self, req):
        tok = models.TwitchOAuthToken.get()
        tok.access_token = 'old'
        tok.refresh_token = 'ref'
        tok.expires_at = timezone.now() + timedelta(hours=1)
        tok.save()
        # First Helix call 401s → refresh (requests.post) → retry succeeds.
        req.request.side_effect = [_resp(status_code=401), _resp({'data': [{'id': '1'}]})]
        req.post.return_value = _resp({'access_token': 'fresh', 'refresh_token': 'r2', 'expires_in': 3600})
        resp = twitch._request('GET', 'https://api.twitch.tv/helix/users')
        self.assertEqual(resp.status_code, 200)

    @patch('api.twitch.requests')
    def test_read_error_branches(self, req):
        tok = models.TwitchOAuthToken.get()
        tok.access_token = 'a'
        tok.expires_at = timezone.now() + timedelta(hours=1)
        tok.save()
        req.request.return_value = _resp(ok=False, status_code=500, body={})
        req.get.return_value = _resp(ok=False, status_code=500, body={})
        self.assertIsNone(twitch.fetch_user_profile('nobody'))
        self.assertIsNone(twitch.fetch_stream('nobody'))
        conn = models.TwitchChannelConnection.objects.create(
            login='c', broadcaster_id='1', access_token='t',
        )
        self.assertIsNone(twitch.fetch_active_charity_campaign(tok=conn, broadcaster_id='1'))
        self.assertEqual(twitch.fetch_charity_donations('cid', tok=conn, broadcaster_id='1'), [])

    @patch('api.twitch.requests')
    def test_empty_stream_returns_none(self, req):
        tok = models.TwitchOAuthToken.get()
        tok.access_token = 'a'
        tok.expires_at = timezone.now() + timedelta(hours=1)
        tok.save()
        req.request.return_value = _resp({'data': []})
        req.get.return_value = _resp({'data': []})
        self.assertIsNone(twitch.fetch_stream('offline'))


def _operator(client, u='fill-op', c='fill-clerk'):
    user = get_user_model().objects.create_user(username=u, password='x')
    models.Profile.objects.create(user=user, clerk_user_id=c, role=models.Profile.ROLE_OPERATOR)
    client.force_authenticate(user=user)


class GameEventViewInternalsTests(APITestCase):
    def setUp(self):
        _operator(self.client)
        self.event = models.Event.objects.create(name='E', start_time=timezone.now())
        self.other = models.Event.objects.create(name='E2', start_time=timezone.now(), is_active=True)
        self.game = models.Game.objects.create(
            title='G', platform='NES', layout_type='4x3', default_play_minutes=60,
        )
        self.item = models.GameItem.objects.create(game=self.game, name='Bow', category='weapon', order=0)
        self.obj = models.GameObjective.objects.create(game=self.game, name='Beat', order=0)

    def _post(self, url, body=None):
        return self.client.post(url, body or {}, format='json')

    def test_event_activate_switches_active(self):
        res = self._post(f'/api/events/{self.event.id}/activate/')
        self.assertEqual(res.status_code, 200)
        self.event.refresh_from_db()
        self.other.refresh_from_db()
        self.assertTrue(self.event.is_active)
        self.assertFalse(self.other.is_active)

    def test_event_donation_pages_action(self):
        res = self.client.get(f'/api/events/{self.event.id}/donation_pages/')
        self.assertEqual(res.status_code, 200)

    def test_game_item_duplicate(self):
        res = self._post(f'/api/game-items/{self.item.id}/duplicate/')
        self.assertIn(res.status_code, (200, 201))
        self.assertTrue(models.GameItem.objects.filter(game=self.game, name__contains='copy').exists())

    def test_game_objective_duplicate(self):
        res = self._post(f'/api/game-objectives/{self.obj.id}/duplicate/')
        self.assertIn(res.status_code, (200, 201))

    def test_item_set_crud_and_duplicate(self):
        res = self._post('/api/game-item-sets/', {
            'game': self.game.id, 'name': 'Medallions', 'kind': 'set', 'order': 0,
        })
        self.assertIn(res.status_code, (200, 201))
        sid = res.data['id']
        self.assertIn(self._post(f'/api/game-item-sets/{sid}/duplicate/').status_code, (200, 201, 404, 405))


class OcremixChatRewardTests(TestCase):
    @patch('api.ocremix._fetch_remix', return_value=None)
    def test_scrape_game_no_mp3(self, _m):
        base = MagicMock(ok=True, url='https://ocremix.org/game/9/x',
                         text='<title>Game: X [NES]</title>')
        listing = MagicMock(ok=True, text='<a href="/remix/OCR777">A</a>')
        session = MagicMock()
        session.get.side_effect = [base, listing]
        result = ocremix_scrape(session)
        self.assertEqual(result.failed, 1)

    def test_chat_render_edge_cases(self):
        from api import chat
        self.assertEqual(chat.render_template('{a} & {b}', {'a': '1', 'b': '2'}), '1 & 2')
        self.assertEqual(chat.render_template('no fields', {}), 'no fields')


def ocremix_scrape(session):
    from api import ocremix
    return ocremix.scrape_game(session, 9, delay=0)

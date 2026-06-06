"""New reward actions (webhook + on-stream alert) and create-reward-on-Twitch."""
from __future__ import annotations

from unittest.mock import MagicMock, patch

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APITestCase

from api import models, rewards


class WebhookAndAlertActionTests(TestCase):
    def setUp(self):
        self.event = models.Event.objects.create(
            name='E', start_time=timezone.now(), is_active=True,
        )
        self.mapping = models.RewardMapping.objects.create(
            event=self.event, reward_title='Hydrate', reward_id='r1', enabled=True,
        )

    @patch('api.rewards.requests.request')
    def test_webhook_action_posts_templated_body(self, mock_req):
        mock_req.return_value = MagicMock(ok=True, status_code=200)
        models.RewardAction.objects.create(
            mapping=self.mapping, action_type=models.RewardActionType.WEBHOOK,
            enabled=True, params={
                'url': 'https://example.com/hook', 'method': 'POST',
                'content_type': 'application/json',
                'body': '{"who": "{user}", "reward": "{reward}"}',
            },
        )
        fired = rewards.handle_redemption(
            self.event, {'id': 'r1', 'title': 'Hydrate'},
            user_login='kris', user_name='Kris',
        )
        self.assertEqual(fired, 1)
        args, kwargs = mock_req.call_args
        self.assertEqual(args[0], 'POST')
        self.assertEqual(args[1], 'https://example.com/hook')
        self.assertIn(b'Kris', kwargs['data'])  # {user} rendered into the body

    @patch('api.rewards.requests.get')
    def test_webhook_get_method(self, mock_get):
        mock_get.return_value = MagicMock(ok=True, status_code=200)
        models.RewardAction.objects.create(
            mapping=self.mapping, action_type=models.RewardActionType.WEBHOOK,
            enabled=True, params={'url': 'https://example.com/ping', 'method': 'GET'},
        )
        self.assertEqual(
            rewards.handle_redemption(self.event, {'id': 'r1', 'title': 'Hydrate'}), 1,
        )
        mock_get.assert_called_once()

    def test_webhook_rejects_non_http_url(self):
        models.RewardAction.objects.create(
            mapping=self.mapping, action_type=models.RewardActionType.WEBHOOK,
            enabled=True, params={'url': 'file:///etc/passwd', 'method': 'GET'},
        )
        # Non-http(s) scheme → action does not fire.
        self.assertEqual(
            rewards.handle_redemption(self.event, {'id': 'r1', 'title': 'Hydrate'}), 0,
        )

    def test_alert_action_writes_external_event(self):
        models.RewardAction.objects.create(
            mapping=self.mapping, action_type=models.RewardActionType.ALERT,
            enabled=True, params={
                'text': '{user} redeemed {reward}!',
                'sound_url': 'https://cdn.example/cheer.mp3',
            },
        )
        fired = rewards.handle_redemption(
            self.event, {'id': 'r1', 'title': 'Hydrate'},
            user_login='kris', user_name='Kris',
        )
        self.assertEqual(fired, 1)
        ev = models.ExternalEvent.objects.get(kind='reward-alert')
        self.assertEqual(ev.payload['text'], 'Kris redeemed Hydrate!')
        self.assertEqual(ev.payload['sound_url'], 'https://cdn.example/cheer.mp3')


class CreateRewardEndpointTests(APITestCase):
    def setUp(self):
        self.event = models.Event.objects.create(
            name='E', start_time=timezone.now(), is_active=True,
        )
        user = get_user_model().objects.create_user(username='rw-op', password='x')
        models.Profile.objects.create(
            user=user, clerk_user_id='rw-clerk', role=models.Profile.ROLE_OPERATOR,
        )
        self.client.force_authenticate(user=user)

    def test_requires_operator(self):
        self.client.force_authenticate(user=None)
        res = self.client.post('/api/twitch/rewards/', {'title': 'X', 'cost': 100}, format='json')
        self.assertIn(res.status_code, (401, 403))

    @patch('api.twitch.create_custom_reward')
    @patch('api.twitch.ensure_connection_broadcaster_id', return_value='123')
    @patch('api.twitch.event_primary_connection')
    def test_creates_reward_on_twitch(self, mock_conn, _bid, mock_create):
        mock_conn.return_value = MagicMock()
        mock_create.return_value = MagicMock(
            ok=True, status_code=200,
            json=lambda: {'data': [{'id': 'new-reward-id', 'title': 'Add a death', 'cost': 500}]},
        )
        res = self.client.post(
            '/api/twitch/rewards/',
            {'title': 'Add a death', 'cost': 500, 'require_input': False},
            format='json',
        )
        self.assertEqual(res.status_code, 201)
        self.assertEqual(res.data['id'], 'new-reward-id')
        mock_create.assert_called_once()

    @patch('api.twitch.ensure_connection_broadcaster_id', return_value='123')
    @patch('api.twitch.event_primary_connection')
    def test_rejects_bad_cost(self, mock_conn, _bid):
        mock_conn.return_value = MagicMock()
        res = self.client.post('/api/twitch/rewards/', {'title': 'X', 'cost': 0}, format='json')
        self.assertEqual(res.status_code, 400)

    @patch('api.twitch.event_primary_connection', return_value=None)
    def test_no_connection_errors(self, _conn):
        res = self.client.post('/api/twitch/rewards/', {'title': 'X', 'cost': 100}, format='json')
        self.assertEqual(res.status_code, 400)

"""Prediction lifecycle (mocked Twitch), incentive contribute, failure hints."""
from __future__ import annotations

from decimal import Decimal
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.test import override_settings
from django.utils import timezone
from rest_framework.test import APITestCase

from api import models


def _operator(client):
    user = get_user_model().objects.create_user(username='fin-op', password='x')
    models.Profile.objects.create(user=user, clerk_user_id='fin-clerk',
                                  role=models.Profile.ROLE_OPERATOR)
    client.force_authenticate(user=user)


@override_settings(TWITCH_CLIENT_ID='cid', TWITCH_CLIENT_SECRET='sec')
class PredictionLifecycleTests(APITestCase):
    def setUp(self):
        _operator(self.client)
        self.event = models.Event.objects.create(name='E', start_time=timezone.now(), is_active=True)
        self.conn = models.TwitchChannelConnection.objects.create(
            login='zeldathonuk', broadcaster_id='123', access_token='c',
            scopes='channel:manage:predictions', is_active=True,
        )
        models.EventTwitchChannel.objects.create(
            event=self.event, login='zeldathonuk', is_primary=True, connection=self.conn,
        )

    @patch('api.twitch.end_prediction')
    @patch('api.twitch.create_prediction')
    @patch('api.twitch.ensure_connection_broadcaster_id', return_value='123')
    @patch('api.twitch.event_primary_connection')
    def test_create_lock_resolve(self, mock_conn, _bid, mock_create, mock_end):
        mock_conn.return_value = self.conn
        outcomes = [{'id': 'o1', 'title': 'Yes'}, {'id': 'o2', 'title': 'No'}]
        mock_create.return_value = {'id': 'p1', 'outcomes': outcomes, 'status': 'ACTIVE'}
        mock_end.return_value = {'winning_outcome_id': 'o1', 'outcomes': outcomes, 'status': 'RESOLVED'}
        res = self.client.post('/api/twitch-predictions/', {
            'title': 'Boss?', 'outcomes': ['Yes', 'No'], 'window_seconds': 90,
        }, format='json')
        self.assertEqual(res.status_code, 201)
        pid = res.data['id']
        self.assertEqual(self.client.post(f'/api/twitch-predictions/{pid}/lock/').status_code, 200)
        self.assertEqual(
            self.client.post(f'/api/twitch-predictions/{pid}/resolve/',
                             {'winning_outcome_id': 'o1'}, format='json').status_code, 200,
        )

    def test_create_validation(self):
        # Too few outcomes → 400.
        res = self.client.post('/api/twitch-predictions/', {
            'title': 'X', 'outcomes': ['only one'],
        }, format='json')
        self.assertEqual(res.status_code, 400)

    def test_resolve_requires_outcome(self):
        pred = models.TwitchPrediction.objects.create(
            event=self.event, prediction_id='p9', title='T', status='ACTIVE',
        )
        self.assertEqual(
            self.client.post(f'/api/twitch-predictions/{pred.id}/resolve/', {}, format='json').status_code,
            400,
        )


class IncentiveContributeTests(APITestCase):
    def setUp(self):
        _operator(self.client)
        self.event = models.Event.objects.create(name='E', start_time=timezone.now(), is_active=True)
        self.inc = models.Incentive.objects.create(
            event=self.event, name='Name the hero', goal_amount=Decimal('100'),
        )

    def test_contribute_amounts(self):
        c = lambda body: self.client.post(  # noqa: E731
            f'/api/incentives/{self.inc.id}/contribute/', body, format='json')
        self.assertEqual(c({'amount': '25'}).status_code, 200)
        self.assertEqual(c({'amount': 'notanumber'}).status_code, 400)
        self.assertEqual(c({'amount': '-5'}).status_code, 400)
        # Crossing the goal marks it reached.
        self.client.post(f'/api/incentives/{self.inc.id}/contribute/', {'amount': '100'}, format='json')


class FailureHintTests(APITestCase):
    def setUp(self):
        _operator(self.client)

    def test_queue_with_varied_error_logs(self):
        for action in ['twitch.eventsub.subscribe', 'donation.justgiving', 'twitch.chat.send',
                       'shoutout.process', 'generic.failure']:
            models.ActivityLog.objects.create(
                category='webhook', action=action, summary='boom', level='error', source='system',
            )
        self.assertEqual(self.client.get('/api/queue/').status_code, 200)
        self.assertEqual(self.client.get('/api/activity-log/').status_code, 200)

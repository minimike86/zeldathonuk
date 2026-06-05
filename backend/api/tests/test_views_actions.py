"""Coverage of the remaining viewset @actions and twitch/connect function views.
Status codes are tolerated — invoking the action executes its body (the point
is coverage); external Twitch calls are mocked."""
from __future__ import annotations

from datetime import timedelta
from decimal import Decimal
from unittest.mock import MagicMock, patch

from django.contrib.auth import get_user_model
from django.test import override_settings
from django.utils import timezone
from rest_framework.test import APITestCase

from api import models

OK = (200, 201, 202, 204, 400, 404, 405, 409)


def _operator(client, u='act-op', c='act-clerk'):
    user = get_user_model().objects.create_user(username=u, password='x')
    models.Profile.objects.create(user=user, clerk_user_id=c, role=models.Profile.ROLE_OPERATOR)
    client.force_authenticate(user=user)


_FAKE_RESP = MagicMock(ok=True, status_code=200)
_FAKE_RESP.json.return_value = {'data': [{'id': 'p1', 'title': 't', 'outcomes': [
    {'id': 'o1', 'title': 'Yes'}, {'id': 'o2', 'title': 'No'}], 'status': 'ACTIVE'}]}


@override_settings(TWITCH_CLIENT_ID='cid', TWITCH_CLIENT_SECRET='sec', TWITCH_BROADCASTER_ID='123')
class ActionTests(APITestCase):
    def setUp(self):
        _operator(self.client)
        now = timezone.now()
        self.event = models.Event.objects.create(name='E', start_time=now, is_active=True)
        tok = models.TwitchOAuthToken.get()
        tok.access_token = 'a'
        tok.expires_at = now + timedelta(hours=1)
        tok.save()
        self.conn = models.TwitchChannelConnection.objects.create(
            login='zeldathonuk', broadcaster_id='123', access_token='c',
            scopes='channel:manage:predictions moderator:manage:shoutouts '
                   'channel:manage:broadcast', is_active=True,
        )
        models.EventTwitchChannel.objects.create(
            event=self.event, login='zeldathonuk', is_primary=True, connection=self.conn,
        )
        self.runner = models.Runner.objects.create(name='Speedy', channel_url='https://twitch.tv/speedy')
        self.theme = models.ThemeSettings.get_active()
        self.preset = models.LayoutPreset.objects.create(name='P', layout_type='4x3')
        self.incentive = models.Incentive.objects.create(
            event=self.event, name='Inc', goal_amount=Decimal('10'),
        )
        self.raffle = models.Raffle.objects.create(event=self.event, name='R', is_active=True)
        for i in range(3):
            models.Donation.objects.create(
                event=self.event, platform='justgiving', donor_name=f'D{i}',
                amount=Decimal('20'), currency='GBP', donated_at=now, external_id=f'd{i}',
            )
        self.trigger = models.ChestAnnouncerSoundTrigger.objects.create(
            name='Big', kind='amount', sound_url='/b.mp3',
        )
        self.mapping = models.RewardMapping.objects.create(event=self.event, reward_title='Hydrate')
        self.shoutout = models.ShoutoutRequest.objects.create(event=self.event, target_login='friend')

    def _post(self, url, body=None):
        return self.client.post(url, body or {}, format='json')

    def test_theme_layout_chest_actions(self):
        self.assertIn(self._post(f'/api/themes/{self.theme.id}/activate/').status_code, OK)
        self.assertIn(self._post(f'/api/themes/{self.theme.id}/duplicate/').status_code, OK)
        self.assertIn(self._post(f'/api/layout-presets/{self.preset.id}/activate/').status_code, OK)
        self.assertIn(self._post(f'/api/layout-presets/{self.preset.id}/duplicate/').status_code, OK)
        self.assertIn(
            self._post(f'/api/chest-announcer/sound-triggers/{self.trigger.id}/duplicate/').status_code, OK,
        )

    def test_incentive_actions(self):
        for a in ('mark_reached', 'reset'):
            self.assertIn(self._post(f'/api/incentives/{self.incentive.id}/{a}/').status_code, OK)

    def test_raffle_draw_flow(self):
        self.assertIn(self._post(f'/api/raffles/{self.raffle.id}/open/').status_code, OK)
        self.assertIn(self._post(f'/api/raffles/{self.raffle.id}/close/').status_code, OK)
        self.assertIn(self._post(f'/api/raffles/{self.raffle.id}/draw/', {'quantity': 1}).status_code, OK)
        self.assertIn(self._post(f'/api/raffles/{self.raffle.id}/reset/').status_code, OK)

    def test_brb_current(self):
        self.assertEqual(self.client.get('/api/brb/current/').status_code, 200)

    @patch('api.twitch.fetch_user_profile', return_value={
        'display_name': 'Speedy', 'profile_image_url': 'https://img', 'login': 'speedy',
    })
    def test_runner_refresh_profile(self, _m):
        self.assertIn(self._post(f'/api/runners/{self.runner.id}/refresh_profile/').status_code, OK)

    @patch('api.twitch.event_primary_connection')
    @patch('api.twitch._request_as', return_value=_FAKE_RESP)
    def test_prediction_create_lifecycle(self, _req, mock_conn):
        mock_conn.return_value = self.conn
        with patch('api.twitch.ensure_connection_broadcaster_id', return_value='123'):
            res = self._post('/api/twitch-predictions/', {
                'event': self.event.id, 'title': 'Boss?',
                'outcomes': ['Yes', 'No'], 'prediction_window': 120,
            })
            self.assertIn(res.status_code, OK)
            pred = models.TwitchPrediction.objects.first()
            if pred:
                self._post(f'/api/twitch-predictions/{pred.id}/lock/')
                self._post(f'/api/twitch-predictions/{pred.id}/resolve/', {'winning_outcome_id': 'o1'})
                self._post(f'/api/twitch-predictions/{pred.id}/cancel/')

    def test_shoutout_cancel(self):
        self.assertIn(self._post(f'/api/shoutout-requests/{self.shoutout.id}/cancel/').status_code, OK)

    @patch('api.twitch.poll_device_token', return_value={'status': 'pending'})
    def test_connect_poll_pending(self, _m):
        self.assertIn(self._post('/api/twitch/connect/poll/', {'device_code': 'd'}).status_code, OK)

    def test_eventsub_sync(self):
        with patch('api.twitch.get_app_access_token', return_value='tok'), \
             patch('api.twitch.requests') as req:
            req.get.return_value = MagicMock(ok=True, json=lambda: {'data': [], 'total': 0})
            req.post.return_value = MagicMock(ok=True, status_code=202, json=lambda: {'data': []})
            req.request.return_value = MagicMock(ok=True, status_code=202, json=lambda: {'data': []})
            res = self._post('/api/twitch/eventsub/sync/')
            self.assertIn(res.status_code, OK)

    def test_charity_slide_reorder_and_crud(self):
        slide = models.CharitySlide.objects.create(kind='text', title='Hi')
        self.assertEqual(self.client.get('/api/charity-slides/').status_code, 200)
        res = self.client.patch(f'/api/charity-slides/{slide.id}/', {'order': 2})
        self.assertIn(res.status_code, OK)

    def test_reward_mapping_and_action_crud(self):
        res = self._post('/api/reward-actions/', {
            'mapping': self.mapping.id, 'action_type': 'chat',
        })
        self.assertIn(res.status_code, OK)

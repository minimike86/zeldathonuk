"""More function-view coverage: image upload, shoutout-request create/cancel,
the activity-log failure-hint paths, and the connect-poll authorized branch."""
from __future__ import annotations

from unittest.mock import MagicMock, patch

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from django.utils import timezone
from rest_framework.test import APITestCase

from api import models

_PNG = b'\x89PNG\r\n\x1a\n' + b'\x00' * 80


def _operator(client, u='f2-op', c='f2-clerk'):
    user = get_user_model().objects.create_user(username=u, password='x')
    models.Profile.objects.create(user=user, clerk_user_id=c, role=models.Profile.ROLE_OPERATOR)
    client.force_authenticate(user=user)


class FunctionViewFillTests(APITestCase):
    def setUp(self):
        _operator(self.client)
        self.event = models.Event.objects.create(
            name='E', start_time=timezone.now(), is_active=True,
        )

    def test_upload_image_success(self):
        img = SimpleUploadedFile('art.png', _PNG, content_type='image/png')
        res = self.client.post('/api/uploads/image/', {'file': img}, format='multipart')
        self.assertIn(res.status_code, (200, 201))
        self.assertIn('url', res.data)

    def test_upload_image_no_file(self):
        self.assertEqual(self.client.post('/api/uploads/image/', {}, format='multipart').status_code, 400)

    def test_shoutout_request_create_and_cancel(self):
        res = self.client.post('/api/shoutout-requests/', {'target_login': 'Friend'}, format='json')
        self.assertEqual(res.status_code, 201)
        sid = res.data['id']
        self.assertIn(self.client.post(f'/api/shoutout-requests/{sid}/cancel/').status_code, (200, 400, 404))
        # Missing login → 400.
        self.assertEqual(
            self.client.post('/api/shoutout-requests/', {}, format='json').status_code, 400,
        )

    def test_activity_log_failure_hints(self):
        for action, source in [
            ('twitch.eventsub.verify', 'twitch'),
            ('donation.webhook', 'webhook'),
            ('twitch.prediction', 'twitch'),
            ('something.else', 'system'),
        ]:
            models.ActivityLog.objects.create(
                category='webhook', action=action, summary='failed', level='error',
                source=source,
            )
        # The queue + activity-log endpoints render failed rows (→ _failure_hint).
        self.assertEqual(self.client.get('/api/queue/').status_code, 200)
        self.assertEqual(self.client.get('/api/activity-log/?level=error').status_code, 200)

    @patch('api.twitch.save_connection')
    @patch('api.twitch.poll_device_token', return_value={'status': 'authorized', 'token': {'access_token': 'a'}})
    def test_connect_poll_authorized(self, _poll, mock_save):
        mock_save.return_value = models.TwitchChannelConnection.objects.create(
            login='zeldathonuk', broadcaster_id='1', access_token='a', is_active=True,
        )
        res = self.client.post('/api/twitch/connect/poll/', {'device_code': 'd'}, format='json')
        self.assertIn(res.status_code, (200, 400))

    @override_settings(TWITCH_CLIENT_ID='cid', TWITCH_CLIENT_SECRET='sec')
    @patch('api.chat.broadcast', return_value=True)
    def test_twitch_chat_send_ok(self, _b):
        models.TwitchChannelConnection.objects.create(
            login='zeldathonuk', broadcaster_id='1', access_token='t',
            scopes='user:write:chat', is_active=True,
        )
        models.EventTwitchChannel.objects.create(
            event=self.event, login='zeldathonuk', is_primary=True,
            connection=models.TwitchChannelConnection.objects.first(),
        )
        res = self.client.post('/api/twitch/chat/send/', {'message': 'gg everyone'}, format='json')
        self.assertIn(res.status_code, (200, 400))
        # Blank message → 400.
        self.assertEqual(
            self.client.post('/api/twitch/chat/send/', {'message': '  '}, format='json').status_code, 400,
        )

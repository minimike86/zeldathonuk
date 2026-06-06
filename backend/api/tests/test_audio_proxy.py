"""Audio proxy serve + download paths: Range requests, full-file serve,
domain allow-list, and the upstream download-to-cache success/failure paths."""
from __future__ import annotations

from unittest.mock import MagicMock, patch

from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase

from api import audio, models


def _operator(client):
    user = get_user_model().objects.create_user(username='ap-op', password='x')
    models.Profile.objects.create(user=user, clerk_user_id='ap-clerk',
                                  role=models.Profile.ROLE_OPERATOR)
    client.force_authenticate(user=user)


class ProxyServeTests(APITestCase):
    def setUp(self):
        _operator(self.client)
        self.track = models.AudioTrack.objects.create(
            title='T', source_url='https://ocremix.org/files/x.mp3',
            enabled=True, ocr_id='OCR-AP',
        )
        # Pre-seed the on-disk cache so proxy skips the upstream entirely.
        self.cache_path = audio._cache_path_for(self.track)
        self.cache_path.write_bytes(b'ID3' + b'\x00' * 4096)

    def tearDown(self):
        self.cache_path.unlink(missing_ok=True)

    def test_full_file_serve(self):
        res = self.client.get(f'/api/audio/proxy/?id={self.track.id}')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res['Access-Control-Allow-Origin'], '*')

    def test_range_request_partial(self):
        res = self.client.get(
            f'/api/audio/proxy/?id={self.track.id}', HTTP_RANGE='bytes=0-1023',
        )
        self.assertEqual(res.status_code, 206)
        self.assertIn('Content-Range', res)
        # Drain the streaming body to run the chunked generator.
        body = b''.join(res.streaming_content)
        self.assertEqual(len(body), 1024)

    def test_range_open_ended(self):
        res = self.client.get(
            f'/api/audio/proxy/?id={self.track.id}', HTTP_RANGE='bytes=100-',
        )
        self.assertEqual(res.status_code, 206)
        b''.join(res.streaming_content)

    def test_range_malformed_falls_back_to_whole(self):
        res = self.client.get(
            f'/api/audio/proxy/?id={self.track.id}', HTTP_RANGE='bytes=abc-def',
        )
        self.assertEqual(res.status_code, 206)
        b''.join(res.streaming_content)

    def test_bad_id(self):
        self.assertEqual(self.client.get('/api/audio/proxy/?id=notint').status_code, 400)

    def test_missing_track(self):
        self.assertEqual(self.client.get('/api/audio/proxy/?id=999999').status_code, 404)

    def test_disallowed_domain(self):
        bad = models.AudioTrack.objects.create(
            title='Bad', source_url='https://evil.example/x.mp3', enabled=True,
        )
        self.assertEqual(self.client.get(f'/api/audio/proxy/?id={bad.id}').status_code, 400)


class DownloadToCacheTests(APITestCase):
    def setUp(self):
        _operator(self.client)
        self.track = models.AudioTrack.objects.create(
            title='DL', source_url='https://iterations.org/files/y.mp3',
            enabled=True, ocr_id='OCR-DL',
        )
        self.cache_path = audio._cache_path_for(self.track)
        self.cache_path.unlink(missing_ok=True)

    def tearDown(self):
        self.cache_path.unlink(missing_ok=True)

    @patch('api.audio.requests.get')
    def test_download_success(self, mock_get):
        up = MagicMock(ok=True, status_code=200)
        up.headers = {'Content-Type': 'audio/mpeg'}
        up.iter_content = lambda chunk_size=65536: iter([b'ID3', b'\x00' * 2048])
        mock_get.return_value = up
        res = self.client.get(f'/api/audio/proxy/?id={self.track.id}')
        self.assertEqual(res.status_code, 200)
        self.assertTrue(self.cache_path.exists())

    @patch('api.audio.requests.get')
    def test_download_network_error_disables_track(self, mock_get):
        import requests
        mock_get.side_effect = requests.RequestException('boom')
        res = self.client.get(f'/api/audio/proxy/?id={self.track.id}')
        self.assertEqual(res.status_code, 404)
        self.track.refresh_from_db()
        self.assertFalse(self.track.enabled)

    @patch('api.audio.requests.get')
    def test_download_non_ok_disables_track(self, mock_get):
        mock_get.return_value = MagicMock(ok=False, status_code=503, headers={})
        res = self.client.get(f'/api/audio/proxy/?id={self.track.id}')
        self.assertEqual(res.status_code, 404)
        self.track.refresh_from_db()
        self.assertFalse(self.track.enabled)

    @patch('api.audio.requests.get')
    def test_download_wrong_content_type_disables_track(self, mock_get):
        up = MagicMock(ok=True, status_code=200)
        up.headers = {'Content-Type': 'text/html'}
        up.iter_content = lambda chunk_size=65536: iter([b'<html>'])
        mock_get.return_value = up
        res = self.client.get(f'/api/audio/proxy/?id={self.track.id}')
        self.assertEqual(res.status_code, 404)
        self.track.refresh_from_db()
        self.assertFalse(self.track.enabled)

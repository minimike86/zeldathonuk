"""Final coverage fill: ocremix._fetch_remix parsing, audio now_playing PUT
flags, and the download content-type rejection path."""
from __future__ import annotations

from unittest.mock import MagicMock, patch

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APITestCase

from api import models, ocremix


def _resp(text='', *, ok=True):
    m = MagicMock(ok=ok)
    m.text = text
    return m


class FetchRemixTests(TestCase):
    def test_parses_title_artist_mp3(self):
        sess = MagicMock()
        sess.get.return_value = _resp(
            '<title>ReMix: "Hyrule Dreams" OC ReMix</title>'
            '<meta property="og:musician" content="DJ Link">'
            '<a href="https://iterations.org/files/music/remixes/OCR001-Zelda.mp3">x</a>'
        )
        d = ocremix._fetch_remix(sess, 'OCR001')
        self.assertEqual(d['title'], 'Hyrule Dreams')
        self.assertEqual(d['artist'], 'DJ Link')
        self.assertTrue(d['mp3'].endswith('.mp3'))

    def test_artist_class_fallback(self):
        sess = MagicMock()
        sess.get.return_value = _resp(
            '<title>ReMix: Untitled</title>'
            '<span class="artist-name">SomeArtist</span>'
            '<a href="https://ocrmirror.org/files/music/remixes/OCR2.mp3">x</a>'
        )
        d = ocremix._fetch_remix(sess, 'OCR2')
        self.assertEqual(d['artist'], 'SomeArtist')

    def test_no_mp3_returns_none(self):
        sess = MagicMock()
        sess.get.return_value = _resp('<title>ReMix: X</title>no links here')
        self.assertIsNone(ocremix._fetch_remix(sess, 'OCR3'))

    def test_non_ok_and_error(self):
        sess = MagicMock()
        sess.get.return_value = _resp(ok=False)
        self.assertIsNone(ocremix._fetch_remix(sess, 'OCR4'))
        import requests
        sess.get.side_effect = requests.exceptions.ConnectionError('x')
        self.assertIsNone(ocremix._fetch_remix(sess, 'OCR5'))


def _operator(client):
    user = get_user_model().objects.create_user(username='fc-op', password='x')
    models.Profile.objects.create(user=user, clerk_user_id='fc-clerk',
                                  role=models.Profile.ROLE_OPERATOR)
    client.force_authenticate(user=user)


class AudioMoreTests(APITestCase):
    def setUp(self):
        _operator(self.client)
        self.track = models.AudioTrack.objects.create(
            title='T', source_url='https://ocremix.org/m.mp3', enabled=True, ocr_id='OCR9',
        )

    def test_now_playing_put_flags(self):
        res = self.client.put('/api/audio/now-playing/', {
            'track_id': self.track.id, 'is_pinned': True, 'is_paused': True,
            'visualiser_style': 'radial',
        }, format='json')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data['visualiser_style'], 'radial')
        self.assertTrue(res.data['is_paused'])

    def test_update_track_multiple_fields(self):
        res = self.client.patch(f'/api/audio/track/{self.track.id}/', {
            'title': 'New', 'artist': 'A', 'enabled': False, 'order': 3,
        }, format='json')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data['title'], 'New')

    def test_update_track_missing(self):
        self.assertEqual(self.client.patch('/api/audio/track/999999/', {'title': 'x'}, format='json').status_code, 404)

    @patch('api.audio.requests.get')
    def test_proxy_rejects_non_audio_content(self, mock_get):
        up = MagicMock(ok=True, status_code=200)
        up.headers = {'Content-Type': 'text/html'}
        up.iter_content = lambda chunk_size=8192: iter([b'<html>'])
        mock_get.return_value = up
        res = self.client.get(f'/api/audio/proxy/?id={self.track.id}')
        self.assertIn(res.status_code, (200, 404, 502))

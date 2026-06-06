"""Unit coverage of the metadata enrichment modules (igdb, ocremix). All
network calls (urllib / requests / HowLongToBeat) are mocked."""
from __future__ import annotations

import json
from unittest.mock import MagicMock, patch

from django.test import TestCase

from api import igdb, models, ocremix


def _urlopen_ctx(payload: bytes):
    cm = MagicMock()
    cm.__enter__.return_value.read.return_value = payload
    return cm


class IgdbTests(TestCase):
    def test_parse_hltb_duration(self):
        self.assertEqual(igdb._parse_hltb_duration('28h 27m'), 28 * 60 + 27)
        self.assertEqual(igdb._parse_hltb_duration('50h'), 3000)
        self.assertEqual(igdb._parse_hltb_duration('95m'), 95)
        self.assertEqual(igdb._parse_hltb_duration('--'), 0)
        self.assertEqual(igdb._parse_hltb_duration(''), 0)
        self.assertEqual(igdb._parse_hltb_duration('2½'), 30)

    def test_pick_twitch_id(self):
        externals = [
            {'external_game_source': igdb.TWITCH_SOURCE, 'uid': '7193'},
            {'external_game_source': igdb.TWITCH_SOURCE, 'uid': '999'},
            {'external_game_source': 1, 'uid': 'x'},
        ]
        self.assertEqual(igdb._pick_twitch_id(externals), '999')
        self.assertEqual(igdb._pick_twitch_id([]), '')

    @patch('api.igdb.urllib.request.urlopen')
    def test_get_app_token(self, mock_open):
        mock_open.return_value = _urlopen_ctx(b'{"access_token": "tok"}')
        self.assertEqual(igdb.get_app_token('id', 'sec'), 'tok')

    @patch('api.igdb.urllib.request.urlopen')
    def test_igdb_query(self, mock_open):
        mock_open.return_value = _urlopen_ctx(json.dumps([{'id': 1}]).encode())
        rows = igdb._igdb_query('id', 'tok', b'fields id;')
        self.assertEqual(rows, [{'id': 1}])

    def test_lookup_igdb_unknown_platform(self):
        res = igdb.lookup_igdb('id', 'tok', 'X', 'NotAPlatform')
        self.assertEqual(res, {'igdb_id': '', 'cover_url': '', 'twitch_game_id': ''})

    @patch('api.igdb._igdb_query')
    def test_lookup_igdb_match(self, mock_q):
        # Pick a platform that exists in the map.
        platform = next(iter(igdb.IGDB_PLATFORM))
        mock_q.return_value = [{
            'id': 5, 'name': 'Some Game', 'cover': {'image_id': 'cover123'},
            'external_games': [{'external_game_source': igdb.TWITCH_SOURCE, 'uid': '42'}],
        }]
        res = igdb.lookup_igdb('id', 'tok', 'Some Game', platform)
        self.assertEqual(res['igdb_id'], '5')
        self.assertIn('cover123', res['cover_url'])
        self.assertEqual(res['twitch_game_id'], '42')

    @patch('api.igdb._igdb_query', return_value=[])
    def test_lookup_igdb_no_match(self, _m):
        platform = next(iter(igdb.IGDB_PLATFORM))
        res = igdb.lookup_igdb('id', 'tok', 'Nope', platform)
        self.assertEqual(res['igdb_id'], '')

    def test_lookup_hltb(self):
        hltb = MagicMock()
        hltb.search.return_value = [MagicMock(game_name='Some Game', game_id=77)]
        self.assertEqual(igdb.lookup_hltb(hltb, 'Some Game'), '77')
        hltb.search.return_value = []
        self.assertEqual(igdb.lookup_hltb(hltb, 'Some Game'), '')
        hltb.search.side_effect = RuntimeError('boom')
        self.assertEqual(igdb.lookup_hltb(hltb, 'Some Game'), '')

    @patch('api.igdb.urllib.request.urlopen')
    def test_fetch_main_story_rushed_minutes(self, mock_open):
        self.assertEqual(igdb.fetch_main_story_rushed_minutes(''), 0)
        html = (
            '<td>Main Story</td><td>2.8K</td><td>28h</td><td>30h</td><td>20h</td><td>40h</td>'
        )
        mock_open.return_value = _urlopen_ctx(html.encode())
        self.assertEqual(igdb.fetch_main_story_rushed_minutes('1'), 20 * 60)

    @patch('api.igdb.fetch_main_story_rushed_minutes', return_value=1200)
    @patch('api.igdb.HowLongToBeat')
    @patch('api.igdb._igdb_query', return_value=[{'id': 9, 'name': 'G'}])
    @patch('api.igdb.get_app_token', return_value='tok')
    def test_fetch_metadata(self, *_):
        platform = next(iter(igdb.IGDB_PLATFORM))
        meta = igdb.fetch_metadata('id', 'sec', 'G', platform)
        self.assertEqual(meta.igdb_id, '9')
        self.assertEqual(meta.main_story_rushed_minutes, 1200)


class OcremixTests(TestCase):
    def test_make_session(self):
        self.assertIsNotNone(ocremix.make_session())

    def test_discover_game_ids(self):
        session = MagicMock()
        session.get.return_value = MagicMock(
            ok=True, text='<a href="/game/67/zelda">Z</a> <a href="/game/89/mario">M</a>',
        )
        ids = ocremix.discover_game_ids(session, 'zelda')
        self.assertIn(67, ids)
        self.assertIn(89, ids)

    def test_discover_game_ids_not_ok(self):
        session = MagicMock()
        session.get.return_value = MagicMock(ok=False)
        self.assertEqual(ocremix.discover_game_ids(session, 'zelda'), [])

    def test_scrape_game_unreachable(self):
        session = MagicMock()
        session.get.return_value = MagicMock(ok=False)
        result = ocremix.scrape_game(session, 67, delay=0)
        self.assertEqual(result.added, 0)

    @patch('api.ocremix._fetch_remix')
    def test_scrape_game_happy(self, mock_remix):
        mock_remix.return_value = {
            'title': 'Hyrule Dreams', 'artist': 'DJ', 'mp3': 'https://ocr/m.mp3',
        }
        base = MagicMock(ok=True, url='https://ocremix.org/game/67/zelda',
                         text='<title>Game: The Legend of Zelda [NES]</title>')
        listing = MagicMock(ok=True, text='<a href="/remix/OCR001">A</a>')
        session = MagicMock()
        session.get.side_effect = [base, listing]
        result = ocremix.scrape_game(session, 67, delay=0)
        self.assertEqual(result.added, 1)
        self.assertTrue(models.AudioTrack.objects.filter(ocr_id='OCR001').exists())

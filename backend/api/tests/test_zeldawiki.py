"""Unit coverage of the Zelda-wiki item importer (api.zeldawiki). The MediaWiki
API + image downloads are mocked; nothing hits the network."""
from __future__ import annotations

import itertools
import tempfile
from pathlib import Path
from unittest.mock import MagicMock, patch

from django.test import TestCase

from api import models, zeldawiki

_counter = itertools.count()


def _game(title=None, slug='oot'):
    n = next(_counter)
    return models.Game.objects.create(
        title=title or f'The Legend of Zelda: Game {n}', platform='3ds',
        layout_type='3ds', default_play_minutes=60, asset_slug=f'{slug}{n}',
    )


_WIKITEXT = (
    'intro\n'
    '<gallery caption="Equipment">\n'
    'File:OoT Bow Sprite.png|[[Fairy Bow|Bow]]\n'
    'File:OoT Hookshot Sprite.png|[[Hookshot]]\n'
    'File:OoT Song.png|Song of Time\n'
    '</gallery>\n'
)

_RENDERED = (
    '<div>'
    '<li class="gallerybox"><img src="https://cdn/thumb/a/ab/OoT_Bomb_Icon.png/90px-OoT_Bomb_Icon.png">'
    '<div class="gallerytext">Bomb ×4</div></li>'
    '<li class="gallerybox"><img src="https://cdn/OoT_Boomerang_Icon.png">'
    '<div class="gallerytext"><a>Boomerang</a></div></li>'
    '</div>'
)


class HelperTests(TestCase):
    def test_title_helpers(self):
        # Synthetic title (real ones are seeded by a migration → unique clash).
        g = _game(title='The Legend of Zelda: Coverage Quest 3D')
        self.assertEqual(zeldawiki._short_title(g), 'Coverage Quest 3D')
        self.assertEqual(zeldawiki._base_title('Ocarina of Time 3D'), 'Ocarina of Time')
        self.assertEqual(zeldawiki._base_title('Twilight Princess HD'), 'Twilight Princess')
        self.assertEqual(zeldawiki._base_title("Link's Awakening DX"), "Link's Awakening")
        pages = zeldawiki.candidate_pages(g)
        self.assertIn('Items in Coverage Quest', pages)

    def test_category_and_name_helpers(self):
        self.assertEqual(zeldawiki._guess_category('Master Sword'), 'weapon')
        self.assertEqual(zeldawiki._category_for('Bolero', 'Songs'), 'song')
        self.assertEqual(zeldawiki._category_for('Boss Key', 'Dungeon Items'), 'dungeon-item')
        self.assertEqual(zeldawiki._guess_category('Random Thing'), 'key-item')
        self.assertEqual(zeldawiki._name_from_filename('OoT Master Sword Sprite.png'), 'Master Sword')

    def test_parse_galleries(self):
        parsed = zeldawiki._parse_galleries(_WIKITEXT)
        names = [name for _fn, name, _cap in parsed]
        self.assertIn('Bow', names)
        self.assertIn('Hookshot', names)
        self.assertIn('Song of Time', names)

    def test_dethumb(self):
        self.assertEqual(
            zeldawiki._dethumb('https://cdn/thumb/a/ab/File.png/120px-File.png'),
            'https://cdn/a/ab/File.png',
        )
        self.assertEqual(zeldawiki._dethumb('https://cdn/a/ab/File.png'),
                         'https://cdn/a/ab/File.png')

    def test_make_session(self):
        s = zeldawiki.make_session()
        self.assertIn('User-Agent', s.headers)


class FetchItemsTests(TestCase):
    def setUp(self):
        self.game = _game()
        self.session = MagicMock()

    @patch('api.zeldawiki._api_get')
    def test_fetch_items_via_wikitext(self, mock_api):
        def side_effect(_session, params):
            if params.get('action') == 'parse' and params.get('prop') == 'wikitext':
                return {'parse': {'wikitext': _WIKITEXT}}
            if params.get('action') == 'query':  # imageinfo
                return {'query': {'pages': [
                    {'title': 'File:OoT Bow Sprite.png',
                     'imageinfo': [{'url': 'https://cdn/bow.png'}]},
                ]}}
            return None
        mock_api.side_effect = side_effect
        items = zeldawiki.fetch_items(self.session, self.game)
        self.assertTrue(items)
        bow = next(i for i in items if i.name == 'Bow')
        self.assertEqual(bow.image_url, 'https://cdn/bow.png')

    @patch('api.zeldawiki._api_get')
    def test_fetch_items_via_rendered_fallback(self, mock_api):
        def side_effect(_session, params):
            # No <gallery> in wikitext → forces the rendered-HTML fallback.
            if params.get('prop') == 'wikitext':
                return {'parse': {'wikitext': 'no galleries here {{Gallery List|...}}'}}
            if params.get('prop') == 'text':
                return {'parse': {'text': _RENDERED}}
            return None
        mock_api.side_effect = side_effect
        items = zeldawiki.fetch_items(self.session, self.game)
        names = [i.name for i in items]
        self.assertIn('Bomb', names)   # ×4 suffix stripped
        self.assertIn('Boomerang', names)

    @patch('api.zeldawiki._api_get', return_value=None)
    def test_fetch_items_no_page(self, _m):
        self.assertEqual(zeldawiki.fetch_items(self.session, self.game), [])

    def test_api_get_non_ok(self):
        sess = MagicMock()
        sess.get.return_value = MagicMock(ok=False)
        self.assertIsNone(zeldawiki._api_get(sess, {'action': 'parse'}))


class DownloadAndImportTests(TestCase):
    def setUp(self):
        self.game = _game()

    def test_download_sprite(self):
        sess = MagicMock()
        sess.get.return_value = MagicMock(ok=True, content=b'PNGDATA')
        with tempfile.TemporaryDirectory() as tmp:
            with patch('api.zeldawiki._items_dir', return_value=Path(tmp)):
                url = zeldawiki._download_sprite(sess, 'https://cdn/OoT_Bow.png', 'oot')
        self.assertTrue(url.startswith('/assets/img/'))
        self.assertIn('OoT_Bow.png', url)

    @patch('api.zeldawiki.fetch_items')
    def test_import_for_game_upserts(self, mock_fetch):
        mock_fetch.return_value = [
            zeldawiki.ScrapedItem(name='Bow', image_url='https://cdn/bow.png',
                                  category='weapon', group='Equipment'),
        ]
        result = zeldawiki.import_for_game(MagicMock(), self.game, download=False, delay=0)
        self.assertEqual(result.added, 1)
        self.assertTrue(models.GameItem.objects.filter(game=self.game, name='Bow').exists())
        # Re-run → update, not duplicate.
        result2 = zeldawiki.import_for_game(MagicMock(), self.game, download=False, delay=0)
        self.assertEqual(result2.updated, 1)
        self.assertEqual(models.GameItem.objects.filter(game=self.game, name='Bow').count(), 1)

    @patch('api.zeldawiki._download_sprite', return_value='/assets/img/x/oot/items/bow.png')
    @patch('api.zeldawiki.fetch_items')
    def test_import_with_download(self, mock_fetch, _dl):
        mock_fetch.return_value = [
            zeldawiki.ScrapedItem(name='Bow', image_url='https://cdn/bow.png', category='weapon'),
        ]
        result = zeldawiki.import_for_game(MagicMock(), self.game, download=True, delay=0)
        self.assertEqual(result.added, 1)
        item = models.GameItem.objects.get(game=self.game, name='Bow')
        self.assertTrue(item.image_url.startswith('/assets/'))

    @patch('api.zeldawiki.fetch_items', return_value=[])
    def test_import_no_items(self, _m):
        result = zeldawiki.import_for_game(MagicMock(), self.game, delay=0)
        self.assertEqual(result.added, 0)
        self.assertTrue(result.notes)

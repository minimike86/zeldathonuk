"""Zelda Wiki item import — shared by the management command and admin action.

Used by:
- `python manage.py import_zelda_items --slug lttp` for one-off / bulk syncs
- the GameAdmin "Import items from Zelda wiki" action for ad-hoc per-game refreshes

Source: the independent Zelda Wiki (zeldawiki.wiki) MediaWiki API at `/w/api.php`.
Each game has an "Items in <Game>" page that lays its items out in `<gallery>`
blocks, one item per line:

    <gallery caption="Equipment" ...>
    File:ALttP Fighter's Sword Sprite.png|[[Fighter's Sword]]
    File:ALttP Master Sword Sprite.png|[[Master Sword]]
    ...

We parse those galleries for (filename, item name, gallery caption), then resolve
each File: to its real image URL via `prop=imageinfo` (host: cdn.wikimg.net). The
gallery filenames match the sprites we already bundle under
`assets/.../legend-of-zelda/<slug>/items/`, so `--download` lands them right next
to the seeded art.

Best-effort: page names / galleries change over time, so callers should tolerate
partial or empty results. The curated `populate_zelda_data` seed remains the
source of truth — this is convenience enrichment.

Items are upserted by (game, name) exactly like the seed, so this is idempotent:
re-running refreshes existing rows rather than duplicating them. With
`download=True`, each sprite is fetched into the game's items folder and stored as
a site-relative URL; otherwise the remote wiki URL is stored as-is.
"""
from __future__ import annotations

import re
import time
from dataclasses import dataclass, field
from urllib.parse import quote, unquote, urlparse

import requests
from django.conf import settings

from . import models


API_URL = 'https://zeldawiki.wiki/w/api.php'
UA = (
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 '
    '(KHTML, like Gecko) Chrome/120.0 Safari/537.36'
)

IMAGE_SUFFIXES = {'.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'}

# Keyword → category heuristics, applied to the item name when the gallery
# caption doesn't already pin it down. Mirrors the seed's buckets.
_CATEGORY_KEYWORDS = [
    ('weapon', ('sword', 'bow', 'arrow', 'bomb', 'boomerang', 'rod', 'cane',
                'hammer', 'slingshot', 'whip', 'medallion', 'beam', 'blade')),
    ('song', ('song', 'sonata', 'ballad', 'requiem', 'minuet', 'bolero',
              'serenade', 'nocturne', 'prelude', 'aria', 'lullaby', 'symphony')),
    ('heart-piece', ('heart container', 'piece of heart', 'heart piece')),
]

_GALLERY_RE = re.compile(r'<gallery([^>]*)>(.*?)</gallery>', re.DOTALL | re.IGNORECASE)
_CAPTION_RE = re.compile(r'caption\s*=\s*"([^"]*)"', re.IGNORECASE)
_LINK_RE = re.compile(r'\[\[\s*([^\]|]+?)\s*(?:\|\s*([^\]]+?)\s*)?\]\]')

# Rendered-HTML gallery parsing. Newer wiki pages lay items out with the
# {{Gallery List}} template, which emits NO <gallery> wikitext block — but both
# formats render to the same `<li class="gallerybox">…<img src><div
# class="gallerytext">Name</div>` HTML. Parsing the rendered page (action=parse
# prop=text) therefore covers both. Used as a fallback when the wikitext path
# finds no <gallery> blocks.
_GALLERYBOX_RE = re.compile(
    r'gallerybox.*?<img[^>]+src="([^"]+)".*?gallerytext"[^>]*>(.*?)</div>',
    re.DOTALL | re.IGNORECASE,
)
_TAG_RE = re.compile(r'<[^>]+>')
# Trailing "×4" / "x2" quantity annotations the template renders next to a name.
_QTY_SUFFIX_RE = re.compile(r'\s*[×xX]\s*\d+\s*$')
# Edition descriptors stripped to fall back to a remake/port's base wiki page
# (the wiki keeps one "Items in <base game>" page covering 3D/HD/DX re-releases).
_EDITION_RE = re.compile(
    r'\s*(?:'
    r'3D|HD|DX'
    r'|\(Wii\)|\(Switch\)|\(Nintendo Switch\)'
    r'|[—-]\s*Nintendo Switch 2 Edition'
    r'|&\s*Four Swords'
    r')\s*$',
    re.IGNORECASE,
)
# Game-prefix / suffix tokens stripped when we have to derive a name from a
# bare filename (rare — the galleries almost always carry an explicit name).
_FILENAME_NOISE = re.compile(
    r'\b(ALttP|TAoL|OoT3D|OoT|MM3D|TMC|TWW|TWWHD|LANS|BotW|SS|ST)\b|'
    r'\b(Sprite|Icon|Model|Artwork|Menu)\b',
    re.IGNORECASE,
)


@dataclass
class ScrapedItem:
    name: str
    image_url: str = ''
    category: str = 'other'
    group: str = ''  # the gallery caption, used to cluster items on the control grid


@dataclass
class ImportResult:
    game_id: int
    game_title: str
    added: int = 0
    updated: int = 0
    failed: int = 0  # rows we couldn't fetch art for
    notes: list[str] = field(default_factory=list)


def make_session() -> requests.Session:
    s = requests.Session()
    s.headers['User-Agent'] = UA
    return s


def _short_title(game: models.Game) -> str:
    """Strip the series prefix so it matches the wiki's per-game page naming."""
    title = game.title
    for prefix in ('The Legend of Zelda: ', 'The Legend of Zelda - ', 'Zelda II: '):
        if title.startswith(prefix):
            return title[len(prefix):]
    return title


def _base_title(short: str) -> str:
    """Strip trailing edition descriptors (3D / HD / DX / (Wii) / …) so a
    remake or port falls back to the base game's wiki page."""
    prev = None
    out = short
    while out != prev:
        prev = out
        out = _EDITION_RE.sub('', out).strip()
    return out


def candidate_pages(game: models.Game) -> list[str]:
    """`Items in <Game>` page titles to try, most-likely first. Includes the
    base-game title for remakes/ports (e.g. "Ocarina of Time 3D" →
    "Items in Ocarina of Time") since the wiki keeps one page per base game."""
    short = _short_title(game)
    seen, out = set(), []
    for name in (short, game.title, _base_title(short)):
        title = f'Items in {name}'
        if name and title not in seen:
            seen.add(title)
            out.append(title)
    return out


def _guess_category(name: str) -> str:
    low = name.lower()
    for category, keywords in _CATEGORY_KEYWORDS:
        if any(k in low for k in keywords):
            return category
    return 'key-item'


def _category_for(name: str, caption: str) -> str:
    cap = caption.lower()
    if 'song' in cap:
        return 'song'
    if 'dungeon' in cap:
        return 'dungeon-item'
    return _guess_category(name)


def _api_get(session: requests.Session, params: dict) -> dict | None:
    params = {**params, 'format': 'json', 'formatversion': '2'}
    try:
        r = session.get(API_URL, params=params, timeout=20)
    except requests.RequestException:
        return None
    if not r.ok:
        return None
    try:
        return r.json()
    except ValueError:
        return None


def _fetch_wikitext(session: requests.Session, pages: list[str]) -> str:
    """Return the wikitext of the first existing page in `pages`, or ''."""
    for page in pages:
        data = _api_get(
            session,
            {'action': 'parse', 'page': page, 'prop': 'wikitext', 'redirects': '1'},
        )
        if not data or 'error' in data:
            continue
        text = data.get('parse', {}).get('wikitext', '')
        if text:
            return text
    return ''


def _name_from_filename(filename: str) -> str:
    stem = filename.rsplit('.', 1)[0].replace('_', ' ')
    stem = _FILENAME_NOISE.sub(' ', stem)
    return re.sub(r'\s+', ' ', stem).strip()


def _parse_galleries(wikitext: str) -> list[tuple[str, str, str]]:
    """Pull (filename, item name, gallery caption) tuples out of every
    `<gallery>` block. Filenames are normalised to use spaces (MediaWiki treats
    spaces and underscores as equivalent in File titles)."""
    out: list[tuple[str, str, str]] = []
    for attrs, body in _GALLERY_RE.findall(wikitext):
        cap_m = _CAPTION_RE.search(attrs)
        caption = cap_m.group(1).strip() if cap_m else ''
        for raw in body.splitlines():
            line = raw.strip()
            if not line.lower().startswith('file:'):
                continue
            line = line[len('file:'):]
            filename, _, rest = line.partition('|')
            filename = filename.strip().replace('_', ' ')
            if not filename:
                continue
            link_m = _LINK_RE.search(rest)
            if link_m:
                name = (link_m.group(2) or link_m.group(1)).strip()
            elif rest and '=' not in rest:
                name = rest.strip()
            else:
                name = _name_from_filename(filename)
            if name:
                out.append((filename, name, caption))
    return out


def _resolve_image_urls(
    session: requests.Session, filenames: list[str]
) -> dict[str, str]:
    """Map (space-normalised) filename -> direct image URL via imageinfo."""
    out: dict[str, str] = {}
    uniq = list(dict.fromkeys(filenames))
    for i in range(0, len(uniq), 50):
        batch = uniq[i:i + 50]
        data = _api_get(
            session,
            {
                'action': 'query',
                'prop': 'imageinfo',
                'iiprop': 'url',
                'titles': '|'.join(f'File:{f}' for f in batch),
            },
        )
        if not data:
            continue
        for page in data.get('query', {}).get('pages', []):
            title = page.get('title', '')
            if title.lower().startswith('file:'):
                title = title[len('file:'):]
            key = title.replace('_', ' ')
            info = page.get('imageinfo') or []
            if info:
                out[key] = info[0].get('url', '')
    return out


def _dethumb(url: str) -> str:
    """Turn a MediaWiki thumbnail URL back into the full-size original:
    `…/thumb/a/ab/File.png/120px-File.png` → `…/a/ab/File.png`."""
    m = re.match(r'(.*)/thumb/(.+?/[^/]+\.\w+)/[^/]+$', url)
    return f'{m.group(1)}/{m.group(2)}' if m else url


def _fetch_rendered_items(
    session: requests.Session, pages: list[str], *, on_progress=None
) -> list[ScrapedItem]:
    """Parse item (name, sprite URL) pairs from a page's RENDERED HTML.

    Covers pages that build their galleries with the {{Gallery List}} template
    (no <gallery> wikitext) — both formats render to the same gallerybox HTML.
    """
    for page in pages:
        data = _api_get(
            session,
            {'action': 'parse', 'page': page, 'prop': 'text', 'redirects': '1'},
        )
        if not data or 'error' in data:
            continue
        html = (data.get('parse', {}) or {}).get('text', '')
        if not html:
            continue
        items: list[ScrapedItem] = []
        seen: set[str] = set()
        for src, raw_name in _GALLERYBOX_RE.findall(html):
            name = _TAG_RE.sub('', raw_name)
            name = _QTY_SUFFIX_RE.sub('', name).strip()
            name = (
                name.replace('&amp;', '&').replace('&#039;', "'")
                .replace('&quot;', '"').replace('&nbsp;', ' ').strip()
            )
            if not name or name in seen:
                continue
            seen.add(name)
            url = _dethumb(src.strip())
            if url.startswith('//'):
                url = f'https:{url}'
            items.append(
                ScrapedItem(name=name, image_url=url, category=_guess_category(name)),
            )
        if items:
            if on_progress:
                on_progress(f'parsed {len(items)} rendered gallery items')
            return items
    return []


def fetch_items(
    session: requests.Session, game: models.Game, *, on_progress=None
) -> list[ScrapedItem]:
    """Return the wiki's item list for `game`, or [] if no page matched."""
    pages = candidate_pages(game)
    wikitext = _fetch_wikitext(session, pages)
    parsed = _parse_galleries(wikitext) if wikitext else []
    if not parsed:
        # No <gallery> blocks — fall back to the rendered HTML, which also
        # captures the {{Gallery List}} template used by newer pages.
        return _fetch_rendered_items(session, pages, on_progress=on_progress)
    if on_progress:
        on_progress(f'parsed {len(parsed)} gallery items')

    urls = _resolve_image_urls(session, [fn for fn, _, _ in parsed])
    items: list[ScrapedItem] = []
    seen: set[str] = set()
    for filename, name, caption in parsed:
        if name in seen:
            continue
        seen.add(name)
        items.append(
            ScrapedItem(
                name=name,
                image_url=urls.get(filename, ''),
                category=_category_for(name, caption),
                group=caption,
            )
        )
    return items


def _items_dir(slug: str):
    return (
        settings.BASE_DIR.parent
        / 'frontend' / 'public' / 'assets' / 'img'
        / 'game-franchise' / 'legend-of-zelda' / slug / 'items'
    )


def _download_sprite(session: requests.Session, url: str, slug: str) -> str:
    """Download `url` into the game's items folder; return the site-relative
    URL, or '' on failure. Filename is taken from the remote path."""
    name = unquote(urlparse(url).path.rsplit('/', 1)[-1])
    name = re.sub(r'[\\/:*?"<>|]', '_', name).strip()
    if not name:
        return ''
    suffix = ('.' + name.rsplit('.', 1)[-1].lower()) if '.' in name else ''
    if suffix not in IMAGE_SUFFIXES:
        name += '.png'
    target_dir = _items_dir(slug)
    target_dir.mkdir(parents=True, exist_ok=True)
    dest = target_dir / name
    if not dest.exists():
        try:
            r = session.get(url, timeout=30)
        except requests.RequestException:
            return ''
        if not r.ok:
            return ''
        dest.write_bytes(r.content)
    return f'/assets/img/game-franchise/legend-of-zelda/{slug}/items/{quote(name)}'


def import_for_game(
    session: requests.Session,
    game: models.Game,
    *,
    download: bool = False,
    delay: float = 0.3,
    on_progress=None,
) -> ImportResult:
    """Fetch + upsert the wiki's items for one Game. Idempotent (upsert by
    (game, name)). Returns counts for reporting."""
    result = ImportResult(game_id=game.id, game_title=game.title)
    scraped = fetch_items(session, game, on_progress=on_progress)
    if not scraped:
        result.notes.append('no matching wiki page / gallery items')
        return result

    # Append after any existing rows so curated ordering is preserved.
    base_order = (
        models.GameItem.objects.filter(game=game)
        .order_by('-order')
        .values_list('order', flat=True)
        .first()
        or 0
    )
    for offset, item in enumerate(scraped, start=1):
        image_url = item.image_url
        if download and image_url:
            if not game.asset_slug:
                result.notes.append('skipped download — game has no asset_slug')
            else:
                local = _download_sprite(session, image_url, game.asset_slug)
                if local:
                    image_url = local
                else:
                    result.failed += 1

        defaults = {'category': item.category, 'order': base_order + offset}
        if item.group:
            defaults['group'] = item.group
        # Only overwrite image_url when we actually resolved one, so a re-run
        # that fails to fetch art doesn't blank an existing sprite.
        if image_url:
            defaults['image_url'] = image_url
        _, created = models.GameItem.objects.update_or_create(
            game=game, name=item.name, defaults=defaults,
        )
        if created:
            result.added += 1
        else:
            result.updated += 1
        if on_progress:
            on_progress(f'{"+" if created else "~"} {item.name}')
        if delay:
            time.sleep(delay)

    return result

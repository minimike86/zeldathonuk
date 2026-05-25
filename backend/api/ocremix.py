"""OCRemix scraping — shared by the management command and admin action.

Used by:
- `python manage.py scrape_ocremix --search ...` for one-off bulk imports
- the GameAdmin "Scrape OCRemix remixes for selected games" action for ad-hoc
  per-game refreshes from the admin UI

The OCRemix HTML page renders ampersands in MP3 filenames as the entity `&amp;`,
so the captured URL is `html.unescape`'d before storage — otherwise iterations.org
302s entity-encoded paths to a search page and the auto-disable logic in audio.py
flips the track off on first playback.
"""
from __future__ import annotations

import html
import re
import time
from dataclasses import dataclass

import requests

from . import models


UA = (
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 '
    '(KHTML, like Gecko) Chrome/120.0 Safari/537.36'
)


@dataclass
class ScrapeResult:
    game_id: int
    game_title: str
    added: int = 0
    skipped: int = 0  # already present
    failed: int = 0   # detail page returned no MP3


def make_session() -> requests.Session:
    s = requests.Session()
    s.headers['User-Agent'] = UA
    return s


def discover_game_ids(session: requests.Session, query: str) -> list[int]:
    r = session.get(
        f'https://ocremix.org/quicksearch/game/?qs_query={query}', timeout=20
    )
    if not r.ok:
        return []
    seen: list[int] = []
    for gid in re.findall(r'/game/(\d+)/', r.text):
        n = int(gid)
        if n not in seen:
            seen.append(n)
    return seen


def _fetch_remix(session: requests.Session, ocr_id: str) -> dict | None:
    r = session.get(f'https://ocremix.org/remix/{ocr_id}/', timeout=20)
    if not r.ok:
        return None
    mp3_m = re.search(
        r'(https://(?:iterations\.org|ocrmirror\.org|ocr\.blueblue\.fr)'
        r'/files/music/remixes/[^\s"\'<>]+\.mp3)',
        r.text,
    )
    if not mp3_m:
        return None
    title_m = re.search(r'<title>ReMix:\s*([^<]+)</title>', r.text)
    full_title = title_m.group(1).strip() if title_m else ocr_id
    quoted = re.search(r'"([^"]+)"', full_title)
    clean_title = quoted.group(1) if quoted else full_title

    artist = ''
    artist_m = re.search(
        r'<meta\s+property="og:musician"\s+content="([^"]+)"', r.text
    )
    if artist_m:
        artist = artist_m.group(1)
    if not artist:
        am = re.search(r'class="artist[^"]*"[^>]*>([^<]+)<', r.text)
        if am:
            artist = am.group(1).strip()

    return {
        # OCRemix HTML-encodes titles/artists (e.g. "Chant &amp; Carillon"),
        # so unescape before storage — otherwise the literal entity ends up
        # in the DB and the proxy disables the track when the upstream 404s.
        'title': html.unescape(clean_title),
        'artist': html.unescape(artist),
        'mp3': html.unescape(mp3_m.group(1)),
    }


def scrape_game(
    session: requests.Session,
    game_id: int,
    *,
    limit: int = 200,
    delay: float = 0.5,
    on_progress=None,
) -> ScrapeResult:
    """Scrape every remix for one OCRemix game id; upsert as AudioTracks.

    `on_progress(message)` is called with one human-readable line per remix
    processed — used by the admin action to stream feedback and by the
    management command to print to stdout.
    """
    r = session.get(f'https://ocremix.org/game/{game_id}', timeout=20)
    result = ScrapeResult(game_id=game_id, game_title=f'game-{game_id}')
    if not r.ok:
        return result

    m = re.search(r'<title>Game:\s*([^<|]+)', r.text)
    raw_title = m.group(1).strip() if m else f'game-{game_id}'
    result.game_title = raw_title.split('[')[0].strip() or raw_title

    pairs = re.findall(
        r'href="/remix/(OCR\d+)"\s+class="main"[^>]*>([^<]+)</a>',
        r.text,
    )
    if not pairs:
        ocr_ids = sorted(set(re.findall(r'/remix/(OCR\d+)', r.text)))
        pairs = [(rid, rid) for rid in ocr_ids]

    seen: list[tuple[str, str]] = []
    for rid, display in pairs:
        if not any(x[0] == rid for x in seen):
            seen.append((rid, display))

    for i, (rid, display) in enumerate(seen[:limit]):
        if models.AudioTrack.objects.filter(ocr_id=rid).exists():
            result.skipped += 1
            continue
        track_data = _fetch_remix(session, rid)
        if not track_data:
            result.failed += 1
            if on_progress:
                on_progress(f'{rid}: skipped (no MP3 URL)')
            continue
        models.AudioTrack.objects.update_or_create(
            ocr_id=rid,
            defaults={
                'title': track_data['title'] or display,
                'artist': track_data['artist'],
                'game': result.game_title,
                'source_url': track_data['mp3'],
                'enabled': True,
                'order': i,
            },
        )
        result.added += 1
        if on_progress:
            on_progress(f'{rid}: {track_data["title"][:70]}')
        time.sleep(delay)

    return result

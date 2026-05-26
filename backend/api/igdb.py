"""IGDB + HLTB metadata lookup — used by the `Refresh IGDB metadata` admin action.

Pulls IGDB game id, cover URL, and Twitch Helix game id (via IGDB external_games
category=14) plus HLTB id from howlongtobeatpy. Requires TWITCH_CLIENT_ID +
TWITCH_CLIENT_SECRET (app credentials, NOT the user OAuth token used by Helix).
"""
from __future__ import annotations

import json
import re
import time
import urllib.parse
import urllib.request
from dataclasses import dataclass

from howlongtobeatpy import HowLongToBeat


# Our Platform enum → IGDB platform ID
IGDB_PLATFORM: dict[str, int] = {
    'NES': 18, 'SNES': 19, 'N64': 4, 'GC': 21, 'Wii': 5, 'WiiU': 41,
    'Switch': 130, 'Switch2': 508, 'GB': 33, 'GBC': 22, 'GBA': 24, 'DS': 20, '3DS': 37,
}

# Catalogue titles that include our own disambiguation suffix IGDB doesn't carry.
IGDB_TITLE_OVERRIDES: dict[str, str] = {
    'The Legend of Zelda: Twilight Princess (Wii)': 'The Legend of Zelda: Twilight Princess',
    "The Legend of Zelda: Link's Awakening (Switch)": "The Legend of Zelda: Link's Awakening",
}

# HLTB titles can differ (no "(Switch)/(Wii)" suffix, or no series prefix).
HLTB_TITLE_OVERRIDES: dict[str, str] = {
    'The Legend of Zelda: Twilight Princess (Wii)': 'The Legend of Zelda: Twilight Princess',
    "The Legend of Zelda: Link's Awakening (Switch)": "The Legend of Zelda: Link's Awakening",
}

# IGDB external_games.external_game_source enum value for Twitch. (IGDB renamed
# the older `category` field to `external_game_source`; the numeric value is the
# same, but querying the old field name silently returns nothing.)
TWITCH_SOURCE = 14

IGDB_URL = 'https://api.igdb.com/v4/games'
TOKEN_URL = 'https://id.twitch.tv/oauth2/token'

# Stay under IGDB's 4 req/s rate limit when batching.
REQUEST_DELAY_SECONDS = 0.3


@dataclass
class Metadata:
    igdb_id: str = ''
    cover_url: str = ''
    twitch_game_id: str = ''
    hltb_id: str = ''
    main_story_rushed_minutes: int = 0


class MissingCredentials(RuntimeError):
    """Raised when TWITCH_CLIENT_ID / TWITCH_CLIENT_SECRET aren't configured."""


def get_app_token(client_id: str, client_secret: str) -> str:
    """Mint a Twitch app access token via the client_credentials grant (used by IGDB)."""
    body = urllib.parse.urlencode({
        'client_id': client_id,
        'client_secret': client_secret,
        'grant_type': 'client_credentials',
    }).encode()
    req = urllib.request.Request(TOKEN_URL, data=body, method='POST')
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.loads(r.read())['access_token']


def _igdb_query(client_id: str, token: str, body: bytes) -> list[dict]:
    req = urllib.request.Request(
        IGDB_URL, data=body,
        headers={'Client-ID': client_id, 'Authorization': f'Bearer {token}', 'Accept': 'application/json'},
    )
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.loads(r.read())


def lookup_igdb(client_id: str, token: str, title: str, platform: str) -> dict:
    """Return {igdb_id, cover_url, twitch_game_id} for the given catalogue row."""
    igdb_name = IGDB_TITLE_OVERRIDES.get(title, title)
    plat_id = IGDB_PLATFORM.get(platform)
    if plat_id is None:
        return {'igdb_id': '', 'cover_url': '', 'twitch_game_id': ''}
    escaped = igdb_name.replace('"', '\\"')
    fields = (
        'fields id,name,cover.image_id,external_games.external_game_source,'
        'external_games.uid,platforms.abbreviation,first_release_date,version_parent;'
    )
    body = (
        f'{fields} where name = "{escaped}" & platforms = [{plat_id}] & version_parent = null;'
    ).encode()
    rows = _igdb_query(client_id, token, body)
    if not rows:
        body = (
            f'search "{escaped}"; {fields} where platforms = [{plat_id}] & version_parent = null; limit 10;'
        ).encode()
        rows = _igdb_query(client_id, token, body)
    if not rows:
        return {'igdb_id': '', 'cover_url': '', 'twitch_game_id': ''}
    row = next((r for r in rows if r.get('name') == igdb_name), rows[0])
    cover_id = (row.get('cover') or {}).get('image_id') or ''
    cover_url = (
        f'https://images.igdb.com/igdb/image/upload/t_cover_big/{cover_id}.jpg'
        if cover_id else ''
    )
    twitch_id = _pick_twitch_id(row.get('external_games', []))
    return {'igdb_id': str(row['id']), 'cover_url': cover_url, 'twitch_game_id': twitch_id}


def _pick_twitch_id(externals: list[dict]) -> str:
    """When multiple Twitch entries exist (re-releases reuse Helix ids), prefer
    the numerically smallest — that's the original Twitch directory entry."""
    candidates = [
        x.get('uid', '') for x in externals
        if x.get('external_game_source') == TWITCH_SOURCE and x.get('uid')
    ]
    if not candidates:
        return ''
    return min(candidates, key=lambda v: int(v) if v.isdigit() else 10**12)


def lookup_hltb(hltb: HowLongToBeat, title: str) -> str:
    name = HLTB_TITLE_OVERRIDES.get(title, title)
    try:
        results = hltb.search(name)
    except Exception:
        return ''
    if not results:
        return ''
    exact = next((r for r in results if r.game_name == name), None)
    chosen = exact or results[0]
    return str(chosen.game_id)


# Matches the Main Story row of the game-times table on a HLTB detail page.
# Columns (post-Polled): Average, Median, Rushed, Leisure. The CSS class names
# are hashed (e.g. GameTimeTable-module__M5Fuva__...), so we anchor on the
# "Main Story" label cell instead.
_HLTB_MAIN_STORY_ROW = re.compile(
    r'<td[^>]*>\s*Main Story\s*</td>'
    r'\s*<td[^>]*>[^<]*</td>'      # polled (e.g. "2.8K")
    r'\s*<td[^>]*>([^<]*)</td>'    # 1: average
    r'\s*<td[^>]*>[^<]*</td>'      # median
    r'\s*<td[^>]*>([^<]*)</td>'    # 2: rushed
    r'\s*<td[^>]*>[^<]*</td>',     # leisure
    re.IGNORECASE,
)


def _parse_hltb_duration(text: str) -> int:
    """Parse a HLTB cell like '28h 27m', '50h', '95m', '--' into minutes (0 if unknown)."""
    t = (text or '').strip().replace('\xa0', ' ')
    if not t or t in ('--', '—'):
        return 0
    minutes = 0
    h = re.search(r'(\d+(?:\.\d+)?)\s*h', t, re.IGNORECASE)
    m = re.search(r'(\d+(?:\.\d+)?)\s*m', t, re.IGNORECASE)
    if h:
        minutes += int(float(h.group(1)) * 60)
    if m:
        minutes += int(float(m.group(1)))
    if minutes == 0 and '½' in t:
        minutes = 30
    return minutes


def fetch_main_story_rushed_minutes(hltb_id: str) -> int:
    """Scrape the HLTB detail page for Main Story Rushed time, in minutes.

    Falls back to Main Story Average when Rushed is missing (small sample sizes
    can leave the Rushed column empty). Returns 0 on failure — callers should
    treat that as "leave existing default_play_minutes alone".
    """
    if not hltb_id:
        return 0
    url = f'https://howlongtobeat.com/game/{hltb_id}'
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            html = r.read().decode('utf-8', errors='replace')
    except Exception:
        return 0
    match = _HLTB_MAIN_STORY_ROW.search(html)
    if not match:
        return 0
    rushed = _parse_hltb_duration(match.group(2))
    if rushed > 0:
        return rushed
    return _parse_hltb_duration(match.group(1))


def fetch_metadata(client_id: str, client_secret: str, title: str, platform: str) -> Metadata:
    """One-shot helper that mints a token, calls IGDB + HLTB, returns Metadata."""
    token = get_app_token(client_id, client_secret)
    hltb = HowLongToBeat()
    igdb = lookup_igdb(client_id, token, title, platform)
    hltb_id = lookup_hltb(hltb, title)
    return Metadata(
        igdb_id=igdb['igdb_id'],
        cover_url=igdb['cover_url'],
        twitch_game_id=igdb['twitch_game_id'],
        hltb_id=hltb_id,
        main_story_rushed_minutes=fetch_main_story_rushed_minutes(hltb_id),
    )


def fetch_metadata_batch(client_id: str, client_secret: str, rows: list[tuple[str, str]]):
    """Yield (title, platform, Metadata) for each (title, platform) row.

    Yields incrementally so callers can stream progress to a log or message bus.
    Caller-supplied credentials so the admin and other entry points stay in control
    of where they read them from.
    """
    if not client_id or not client_secret:
        raise MissingCredentials('TWITCH_CLIENT_ID / TWITCH_CLIENT_SECRET not configured')
    token = get_app_token(client_id, client_secret)
    hltb = HowLongToBeat()
    for title, platform in rows:
        try:
            igdb = lookup_igdb(client_id, token, title, platform)
        except Exception:
            igdb = {'igdb_id': '', 'cover_url': '', 'twitch_game_id': ''}
        hltb_id = lookup_hltb(hltb, title)
        yield title, platform, Metadata(
            igdb_id=igdb['igdb_id'],
            cover_url=igdb['cover_url'],
            twitch_game_id=igdb['twitch_game_id'],
            hltb_id=hltb_id,
            main_story_rushed_minutes=fetch_main_story_rushed_minutes(hltb_id),
        )
        time.sleep(REQUEST_DELAY_SECONDS)

"""One-off bulk fetch for new catalogue entries.

Prints a Python dict literal that can be pasted into the relevant data migration.
For day-to-day refreshes of existing rows, prefer the GameAdmin
"Refresh IGDB + HLTB metadata for selected games" action.

Run inside the backend container so TWITCH_* env vars are available:
    docker exec zeldathon-backend python /app/scripts/fetch_igdb_metadata.py
"""
from __future__ import annotations

import os
import sys

from api import igdb

# Add entries here when extending the catalogue; the script will fetch IGDB +
# HLTB metadata for each. Existing rows already have their data baked into the
# 0002/0005 migrations.
TITLES: list[tuple[str, str]] = [
    # ('The Legend of Zelda: <new title>', 'Switch2'),
]


def main() -> int:
    if not TITLES:
        print('TITLES is empty — add new (title, platform) rows to fetch.', file=sys.stderr)
        return 0

    cid = os.environ.get('TWITCH_CLIENT_ID', '')
    secret = os.environ.get('TWITCH_CLIENT_SECRET', '')
    print('METADATA = {')
    for title, _, meta in igdb.fetch_metadata_batch(cid, secret, TITLES):
        flags = (
            f'igdb={meta.igdb_id or "-":>7} '
            f'cover={"y" if meta.cover_url else "-"} '
            f'twitch={meta.twitch_game_id or "-":>10} '
            f'hltb={meta.hltb_id or "-"}'
        )
        print(f'  {title:60} {flags}', file=sys.stderr)
        print(
            f'    {title!r}: '
            f'{{"igdb_id": {meta.igdb_id!r}, '
            f'"twitch_game_id": {meta.twitch_game_id!r}, '
            f'"hltb_id": {meta.hltb_id!r}, '
            f'"cover_url": {meta.cover_url!r}}},'
        )
    print('}')
    return 0


if __name__ == '__main__':
    # Allow running outside `manage.py` while still importing the app module.
    sys.path.insert(0, '/app')
    sys.exit(main())

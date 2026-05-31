"""Scrape OCRemix for game-specific remix MP3 URLs and store as AudioTracks.

Four modes:
- `--game-id 95359` — scrape one specific game.
- `--game-ids 64,65,66` — scrape an explicit comma-separated id list. Used to
  partition a discovered id set across parallel workers (each worker takes a
  disjoint slice, so concurrent runs never touch the same game/track).
- `--search zelda` — discover every game matching the query (via OCR's
  quicksearch endpoint) and scrape each one.
- `--all-zelda` — shorthand for `--search zelda`. Pulls every Zelda title.

Idempotent: upserts by OCR id, so re-running adds new tracks but doesn't
duplicate existing ones. Core logic lives in `api.ocremix` and is shared with
the GameAdmin "Scrape OCRemix remixes" action.
"""
from __future__ import annotations

from django.core.management.base import BaseCommand

from api import ocremix


class Command(BaseCommand):
    help = 'Scrape OCRemix for game remix MP3 URLs and add to the playlist.'

    def add_arguments(self, parser):
        group = parser.add_mutually_exclusive_group(required=True)
        group.add_argument('--game-id', type=int, help='Scrape one specific OCRemix game id.')
        group.add_argument(
            '--game-ids', type=str,
            help='Scrape a comma-separated list of OCRemix game ids (e.g. 64,65,66). '
                 'Lets a caller partition a discovered id set across parallel workers.',
        )
        group.add_argument('--search', type=str, help='Discover games matching this query and scrape each.')
        group.add_argument('--all-zelda', action='store_true', help='Scrape every Zelda game OCRemix knows about.')
        parser.add_argument('--limit', type=int, default=200, help='Max remixes per game.')
        parser.add_argument('--delay', type=float, default=0.5, help='Delay between detail requests.')

    def handle(self, *args, **options):
        limit = options['limit']
        delay = options['delay']
        session = ocremix.make_session()

        if options['game_id']:
            game_ids = [options['game_id']]
        elif options['game_ids']:
            game_ids = [int(x) for x in options['game_ids'].split(',') if x.strip()]
            self.stdout.write(self.style.NOTICE(f'Scraping {len(game_ids)} explicit game ids'))
        else:
            query = 'zelda' if options['all_zelda'] else options['search']
            game_ids = ocremix.discover_game_ids(session, query)
            self.stdout.write(
                self.style.NOTICE(f'Discovered {len(game_ids)} games matching {query!r}')
            )

        total_added = total_skipped = total_failed = 0
        for gid in game_ids:
            result = ocremix.scrape_game(
                session, gid, limit=limit, delay=delay,
                on_progress=lambda m: self.stdout.write(f'  {m}'),
            )
            self.stdout.write(
                self.style.MIGRATE_HEADING(
                    f'\n{result.game_title} (game/{gid}) — '
                    f'added {result.added}, skipped {result.skipped}, failed {result.failed}'
                )
            )
            total_added += result.added
            total_skipped += result.skipped
            total_failed += result.failed

        self.stdout.write(
            self.style.SUCCESS(
                f'\nAll done. Added {total_added}, skipped {total_skipped} (already present), '
                f'failed {total_failed} across {len(game_ids)} games.'
            )
        )

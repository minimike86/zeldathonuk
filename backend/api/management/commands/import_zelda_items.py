"""`python manage.py import_zelda_items` — sync per-game item checklists
(names + sprite art) from the Zelda Wiki MediaWiki API.

Modes (mutually exclusive selector):
- `--game-id 12`     — import one game by primary key.
- `--slug lttp`      — import the game whose asset_slug matches.
- `--all`            — import every game.

Flags:
- `--download`       — fetch each sprite into the game's assets folder and
                       store a site-relative URL (default: store the remote
                       wiki URL).
- `--delay 0.3`      — seconds between item upserts (be nice to the wiki).

Idempotent: upserts by (game, name), so re-running refreshes rows instead of
duplicating them. The curated `populate_zelda_data` seed remains the source of
truth — this is best-effort enrichment. Shares its core logic with the
GameAdmin "Import items from Zelda wiki" action via `api.zeldawiki`.
"""
from __future__ import annotations

from django.core.management.base import BaseCommand, CommandError

from api import models, zeldawiki


class Command(BaseCommand):
    help = 'Import / refresh game item checklists from the Zelda wiki. Idempotent.'

    def add_arguments(self, parser):
        group = parser.add_mutually_exclusive_group(required=True)
        group.add_argument('--game-id', type=int, help='Import one Game by id.')
        group.add_argument('--slug', type=str, help='Import the Game with this asset_slug.')
        group.add_argument('--all', action='store_true', help='Import every Game.')
        parser.add_argument(
            '--download', action='store_true',
            help='Download sprites into the assets folder and store site-relative URLs.',
        )
        parser.add_argument(
            '--delay', type=float, default=0.3,
            help='Delay (seconds) between item upserts.',
        )

    def handle(self, *args, **options):
        if options['game_id']:
            games = list(models.Game.objects.filter(pk=options['game_id']))
            if not games:
                raise CommandError(f'No Game with id {options["game_id"]}.')
        elif options['slug']:
            games = list(models.Game.objects.filter(asset_slug=options['slug']))
            if not games:
                raise CommandError(f'No Game with asset_slug {options["slug"]!r}.')
        else:
            games = list(models.Game.objects.all())

        session = zeldawiki.make_session()
        total_added = total_updated = total_failed = 0
        for game in games:
            self.stdout.write(self.style.MIGRATE_HEADING(f'\n{game.title}'))
            result = zeldawiki.import_for_game(
                session, game,
                download=options['download'],
                delay=options['delay'],
                on_progress=lambda m: self.stdout.write(f'  {m}'),
            )
            for note in result.notes:
                self.stdout.write(self.style.WARNING(f'  ! {note}'))
            self.stdout.write(
                f'  added {result.added}, updated {result.updated}, '
                f'art-failed {result.failed}'
            )
            total_added += result.added
            total_updated += result.updated
            total_failed += result.failed

        self.stdout.write(
            self.style.SUCCESS(
                f'\nDone. {len(games)} game(s): added {total_added}, '
                f'updated {total_updated}, art-failed {total_failed}.'
            )
        )

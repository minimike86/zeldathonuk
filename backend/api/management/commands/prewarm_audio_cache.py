"""`python manage.py prewarm_audio_cache` — fetch every enabled track once so
the on-disk cache is populated. Subsequent /api/audio/proxy/ requests will
serve straight from disk with no upstream hop.

Auto-disables any track whose upstream returns a non-audio response.
"""
from __future__ import annotations

import time

from django.core.management.base import BaseCommand

from api import models
from api.audio import _cache_path_for, _download_to_cache


class Command(BaseCommand):
    help = 'Pre-fetch every enabled AudioTrack into the local cache.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--delay',
            type=float,
            default=0.2,
            help='Seconds between requests so the upstream doesn\'t rate-limit us.',
        )
        parser.add_argument(
            '--force', action='store_true', help='Re-download even if a cache file exists.'
        )

    def handle(self, *args, **options):
        tracks = models.AudioTrack.objects.filter(enabled=True).order_by('order', 'title')
        downloaded = 0
        skipped = 0
        failed = 0
        total = tracks.count()
        for i, track in enumerate(tracks, 1):
            path = _cache_path_for(track)
            label = f'[{i}/{total}] {track.title[:60]}'
            if path.exists() and not options['force']:
                self.stdout.write(self.style.NOTICE(f'{label}  (already cached, {path.stat().st_size//1024} KiB)'))
                skipped += 1
                continue
            ok = _download_to_cache(track, path)
            if ok:
                self.stdout.write(self.style.SUCCESS(f'{label}  ✓ {path.stat().st_size//1024} KiB'))
                downloaded += 1
            else:
                self.stdout.write(self.style.ERROR(f'{label}  ✗ upstream failed, disabled'))
                failed += 1
            time.sleep(options['delay'])

        self.stdout.write(
            self.style.SUCCESS(
                f'\nPre-warm done. Downloaded {downloaded}, skipped {skipped}, '
                f'disabled {failed} dead tracks.'
            )
        )

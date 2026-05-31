"""`python manage.py prune_activity_log` — trim the audit trail.

The ActivityLog table grows on every mutating request, sound trigger, and
milestone crossing, so it needs bounding. Run this on a cron (e.g. nightly):

    python manage.py prune_activity_log --days 30
    python manage.py prune_activity_log --max-rows 100000

Both bounds can be combined; rows are deleted if they fail *either* check
(older than --days OR beyond the newest --max-rows). --days 0 prunes
everything older than "now" (i.e. all existing rows), useful in tests.
"""
from __future__ import annotations

from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone

from api import models


class Command(BaseCommand):
    help = 'Delete old ActivityLog rows to keep the audit trail bounded.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--days', type=int, default=30,
            help='Delete rows older than this many days (default 30).',
        )
        parser.add_argument(
            '--max-rows', type=int, default=None,
            help='Also keep at most this many newest rows, deleting the rest.',
        )

    def handle(self, *args, **options):
        days = options['days']
        max_rows = options['max_rows']
        deleted_total = 0

        if days is not None:
            cutoff = timezone.now() - timedelta(days=days)
            deleted, _ = models.ActivityLog.objects.filter(
                created_at__lt=cutoff,
            ).delete()
            deleted_total += deleted
            self.stdout.write(f'Deleted {deleted} row(s) older than {days} day(s).')

        if max_rows is not None and max_rows >= 0:
            # Find the cutoff pk: keep the newest `max_rows`, delete older.
            ids_to_keep = list(
                models.ActivityLog.objects.order_by('-created_at')
                .values_list('id', flat=True)[:max_rows]
            )
            deleted, _ = models.ActivityLog.objects.exclude(
                id__in=ids_to_keep,
            ).delete()
            deleted_total += deleted
            self.stdout.write(f'Deleted {deleted} row(s) beyond the newest {max_rows}.')

        self.stdout.write(self.style.SUCCESS(f'Done. {deleted_total} row(s) removed.'))

"""`python manage.py run_scheduled_jobs` — the single tick that drives every
enabled ScheduledJob (donation polling, chat reminders, shoutout draining, …).

Wire ONE of these to run every minute (cron / docker tick), and manage which
jobs run + how often from the control panel (/control/automation). Or run it as
a long-lived worker with ``--loop``.

    # cron, once a minute:
    * * * * *  docker compose exec -T backend python manage.py run_scheduled_jobs
    # or a worker:
    docker compose exec backend python manage.py run_scheduled_jobs --loop --interval 30
"""
from __future__ import annotations

import time

from django.core.management.base import BaseCommand

from api import jobs


class Command(BaseCommand):
    help = 'Run all due scheduled jobs once (or --loop to keep ticking).'

    def add_arguments(self, parser):
        parser.add_argument('--loop', action='store_true',
                            help='Keep running, sleeping --interval seconds between ticks.')
        parser.add_argument('--interval', type=int, default=30,
                            help='Seconds between ticks in --loop mode (default 30).')

    def handle(self, *args, **opts):
        if opts['loop']:
            self.stdout.write(f'Scheduler loop started (every {opts["interval"]}s). Ctrl-C to stop.')
            while True:
                self._tick()
                time.sleep(max(5, opts['interval']))
        else:
            self._tick()

    def _tick(self):
        for job in jobs.run_due():
            self.stdout.write(f'  ran {job.key}: {job.last_status}')

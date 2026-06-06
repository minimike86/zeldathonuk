"""Run scheduled management commands recorded as ``ScheduledJob`` rows.

A single cron tick (``manage.py run_scheduled_jobs``) calls :func:`run_due`; the
control panel's "Run now" calls :func:`run_job` directly. Output + status are
captured onto the row so the operator can see what happened without shell
access. Best-effort — a failing job records ``error`` and never propagates.
"""
from __future__ import annotations

import logging
import shlex
from io import StringIO

from django.core.management import call_command
from django.utils import timezone

from . import models

logger = logging.getLogger(__name__)

_MAX_OUTPUT = 4000


def run_job(job: 'models.ScheduledJob', *, source: str = 'manual') -> 'models.ScheduledJob':
    """Run one job synchronously, capturing stdout/stderr + status onto the row.
    Claims the run up-front (sets last_run_at) so an overlapping tick won't
    double-fire it."""
    job.last_run_at = timezone.now()
    job.last_status = 'running'
    job.save(update_fields=['last_run_at', 'last_status', 'updated_at'])

    out = StringIO()
    try:
        parts = shlex.split(job.command)
        if not parts:
            raise ValueError('empty command')
        call_command(parts[0], *parts[1:], stdout=out, stderr=out)
        job.last_status = 'ok'
    except Exception as exc:  # noqa: BLE001 — record, never raise into the tick
        logger.exception('ScheduledJob %s (%s) failed', job.key, source)
        job.last_status = 'error'
        out.write(f'\nERROR: {exc}')
    job.last_output = out.getvalue()[-_MAX_OUTPUT:]
    job.save(update_fields=['last_status', 'last_output', 'updated_at'])
    return job


def run_due() -> list['models.ScheduledJob']:
    """Run every enabled job whose interval has elapsed. Returns the ones run."""
    ran = []
    for job in models.ScheduledJob.objects.filter(enabled=True):
        if job.is_due:
            run_job(job, source='scheduler')
            ran.append(job)
    return ran

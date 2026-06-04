"""`python manage.py process_shoutouts` — send at most one queued Twitch
shoutout for the active event, honouring Twitch's cooldowns (2-min global,
60-min per target) and the live requirement.

Run on a cron tick (e.g. every 30-60s). Because Twitch caps shoutouts at one
per ~2 minutes, this drip-feeds a burst of queued donor/raid shoutouts out over
time rather than dropping them. Best-effort — failures are logged on the row.
"""
from __future__ import annotations

from django.core.management.base import BaseCommand

from api import models, shoutouts


class Command(BaseCommand):
    help = 'Send the next due Twitch shoutout for the active event.'

    def handle(self, *args, **options):
        active = models.Event.objects.filter(is_active=True).first()
        if not active:
            self.stdout.write('No active event; nothing to do.')
            return
        sent = shoutouts.process_one(active)
        if sent:
            self.stdout.write(self.style.SUCCESS(
                f'Shouted out {sent.target_login} ({sent.reason}).'
            ))

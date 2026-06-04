"""`python manage.py post_chat_reminders` — post any due recurring chat messages
(e.g. a periodic donation CTA) for the ACTIVE event to its primary connected
channel's chat.

Run on a cron / docker-compose tick (e.g. every minute). Each message has its
own ``interval_minutes`` + ``last_posted_at`` so this is safe to run often — it
only posts when due. ``only_when_live`` skips posting while the channel is
offline. Best-effort: a send failure is logged and the next tick retries.
"""
from __future__ import annotations

from django.core.management.base import BaseCommand
from django.utils import timezone

from api import chat, models, twitch


class Command(BaseCommand):
    help = 'Post due recurring chat messages for the active event.'

    def handle(self, *args, **options):
        active = models.Event.objects.filter(is_active=True).first()
        if not active:
            self.stdout.write('No active event; nothing to post.')
            return

        due = [m for m in active.recurring_chat_messages.filter(enabled=True) if m.is_due]
        if not due:
            return

        # Resolve + cache the primary channel's live state once (only needed
        # when a due message requires it).
        primary = (
            active.twitch_channels.filter(is_primary=True).first()
            or active.twitch_channels.first()
        )
        primary_login = primary.login if primary else ''
        live: bool | None = None  # lazily resolved

        posted = 0
        for msg in due:
            if msg.only_when_live:
                if live is None:
                    try:
                        live = bool(primary_login and twitch.fetch_stream(primary_login))
                    except Exception:  # noqa: BLE001 — offline check must not crash the tick
                        live = False
                if not live:
                    continue
            if chat.post_recurring(active, msg):
                msg.last_posted_at = timezone.now()
                msg.save(update_fields=['last_posted_at', 'updated_at'])
                posted += 1
                self.stdout.write(self.style.SUCCESS(
                    f'Posted recurring: {msg.label or msg.template[:30]}'
                ))
        if posted:
            self.stdout.write(self.style.SUCCESS(f'Posted {posted} recurring message(s).'))

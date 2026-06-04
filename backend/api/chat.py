"""Twitch chat announcements.

When a configured trigger fires (donation, milestone, game change, …) the
active event's PRIMARY connected channel posts a rendered message into its own
chat via Helix ``POST /chat/messages``. Everything here is **best-effort**:
``announce`` never raises, so a chat failure can't break donation ingest or a
schedule advance.

Wording is per-event + per-trigger (``ChatAnnouncement`` rows, editable in
/control); ``DEFAULT_TEMPLATES`` seeds new rows and documents the placeholders
each trigger supports.
"""
from __future__ import annotations

import logging

from . import models

logger = logging.getLogger(__name__)

# Default message per trigger. Placeholders are filled from the context the
# caller passes to ``announce``; unknown placeholders are left intact so typos
# are visible rather than silently blanked.
DEFAULT_TEMPLATES = {
    'donation': '🎉 {donor} just donated {currency}{amount}! Thank you so much! 💜',
    'milestone': '🏆 Milestone reached: {milestone} ({currency}{threshold})! Thank you all! 💜',
    'game_change': '🎮 Now playing: {game}!',
    'sub': '💜 Thanks for the sub, {user}!',
    'follow': '👋 Welcome {user} — thanks for the follow!',
    'raid': '🚨 Raid incoming! Welcome {user} and the {viewers} raiders!',
    'cheer': '✨ Thanks for the {bits} bits, {user}!',
    'redemption': '🎁 {user} redeemed {reward}!',
}

# Placeholders surfaced as hints in the control-panel editor, per trigger.
TEMPLATE_PLACEHOLDERS = {
    'donation': ['donor', 'amount', 'currency', 'message', 'channel'],
    'milestone': ['milestone', 'threshold', 'currency', 'channel'],
    'game_change': ['game', 'runner', 'channel'],
    'sub': ['user', 'tier', 'channel'],
    'follow': ['user', 'channel'],
    'raid': ['user', 'viewers', 'channel'],
    'cheer': ['user', 'bits', 'channel'],
    'redemption': ['user', 'reward', 'channel'],
}


class _SafeDict(dict):
    """Leaves unknown ``{placeholders}`` intact instead of raising KeyError."""

    def __missing__(self, key):  # noqa: ANN001
        return '{' + key + '}'


def render_template(template: str, ctx: dict) -> str:
    """Substitute ``{placeholder}`` fields from ``ctx`` (None → ''). Returns the
    raw template unchanged if it contains a malformed format expression."""
    safe = _SafeDict({k: ('' if v is None else str(v)) for k, v in ctx.items()})
    try:
        return template.format_map(safe)
    except (ValueError, IndexError):
        return template


def send_chat_message(connection, broadcaster_id: str, message: str):
    """Post ``message`` to ``broadcaster_id``'s chat AS that channel, using the
    channel's own connection token (needs user:write:chat). Short timeout — this
    runs in the request path. Returns the Helix response."""
    from . import twitch

    return twitch._request_as(
        connection, 'POST', f'{twitch.HELIX}/chat/messages',
        timeout=5,
        json={
            'broadcaster_id': broadcaster_id,
            'sender_id': broadcaster_id,
            'message': message[:500],  # Twitch caps chat at 500 chars
        },
    )


def _send_to_event(event, message: str, *, announcement: bool = False,
                   color: str = 'primary') -> bool:
    """Post ``message`` to the event's primary connected channel's chat. When
    ``announcement`` is set, post a highlighted /announce in ``color`` instead
    of a normal message. Returns True on a successful send."""
    from . import twitch

    conn = twitch.event_primary_connection(event)
    if not conn:
        return False
    bid = twitch.ensure_connection_broadcaster_id(conn)
    if not bid:
        return False
    if announcement:
        resp = twitch.send_chat_announcement(conn, bid, message, color)
    else:
        resp = send_chat_message(conn, bid, message)
    return bool(getattr(resp, 'ok', False))


def announce(event, trigger: str, ctx: dict | None = None) -> bool:
    """Post the configured chat message for ``trigger`` on ``event``. Best-effort:
    swallows everything and returns True only when a message was actually sent."""
    try:
        if event is None:
            return False
        cfg = event.chat_announcements.filter(trigger=trigger, enabled=True).first()
        if not cfg:
            return False
        template = cfg.template or DEFAULT_TEMPLATES.get(trigger, '')
        if not template.strip():
            return False
        message = render_template(template, ctx or {}).strip()
        if not message:
            return False
        return _send_to_event(
            event, message,
            announcement=cfg.as_announcement,
            color=cfg.announcement_color,
        )
    except Exception:  # noqa: BLE001 — chat must never break the caller
        logger.exception('chat.announce failed for trigger=%s', trigger)
        return False


# ── Recurring messages (e.g. a periodic donation CTA) ───────────────────────

DEFAULT_DONATION_CTA = (
    '💜 Enjoying the run? Help us smash the goal for {charity} — '
    'donate here: {donate_url}'
)

# Placeholders surfaced as hints in the recurring-message editor.
RECURRING_PLACEHOLDERS = ['donate_url', 'total', 'charity', 'channel']


def event_donate_url(event) -> str:
    """Best donate link for an event: the primary donation page, else a Twitch
    Charity link for a charity channel, else ''."""
    page = (
        event.donation_pages.filter(is_primary=True).first()
        or event.donation_pages.first()
    )
    if page and page.url:
        return page.url
    ch = event.twitch_channels.filter(track_charity=True, is_active=True).first()
    if ch:
        return f'https://www.twitch.tv/charity/{ch.login}'
    return ''


def recurring_context(event) -> dict:
    """Placeholder values for recurring messages on ``event``."""
    from django.db.models import Sum

    total = (
        models.Donation.objects.filter(event=event).aggregate(s=Sum('amount'))['s']
        or 0
    )
    charity_link = (
        event.event_charities.filter(is_primary=True).select_related('charity').first()
        or event.event_charities.select_related('charity').first()
    )
    primary = (
        event.twitch_channels.filter(is_primary=True).first()
        or event.twitch_channels.first()
    )
    return {
        'donate_url': event_donate_url(event),
        'total': f'{event.currency_symbol}{total:.2f}',
        'charity': charity_link.charity.name if charity_link else '',
        'channel': primary.login if primary else '',
    }


def post_recurring(event, msg) -> bool:
    """Render + send one recurring message. Best-effort."""
    try:
        template = (msg.template or '').strip()
        if not template:
            return False
        message = render_template(template, recurring_context(event)).strip()
        if not message:
            return False
        return _send_to_event(event, message)
    except Exception:  # noqa: BLE001
        logger.exception('chat.post_recurring failed')
        return False


def ensure_recurring_defaults(event) -> None:
    """Seed a default (disabled) donation-CTA recurring message for a new event,
    if it has none yet."""
    if not event.recurring_chat_messages.exists():
        models.RecurringChatMessage.objects.create(
            event=event, label='Donation CTA', template=DEFAULT_DONATION_CTA,
            interval_minutes=15, only_when_live=True, enabled=False,
        )


def ensure_announcements(event) -> None:
    """Make sure ``event`` has a (disabled) ChatAnnouncement row per trigger,
    seeded with the default template — so the control editor always lists every
    trigger. Idempotent."""
    for trigger in models.ChatTrigger.values:
        models.ChatAnnouncement.objects.get_or_create(
            event=event, trigger=trigger,
            defaults={'enabled': False, 'template': DEFAULT_TEMPLATES.get(trigger, '')},
        )

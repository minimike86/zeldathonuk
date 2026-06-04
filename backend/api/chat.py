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


def _chat_targets(event):
    """Connections to post chat to for an event: every charity channel (plus the
    primary stream channel) that is connected AND whose connection can write
    chat (``user:write:chat``). Yields ``(connection, broadcaster_id)``, deduped
    by broadcaster. Charity-only connections (no chat scope) are skipped — they'd
    need reconnecting with the chat scope."""
    from . import twitch

    seen: set[str] = set()
    channels = (
        event.twitch_channels
        .filter(is_active=True, connection__isnull=False)
        .select_related('connection')
        .order_by('-is_primary', 'order')
    )
    for ch in channels:
        if not (ch.track_charity or ch.is_primary):
            continue
        conn = ch.connection
        if not conn.is_active or not (conn.access_token or conn.refresh_token):
            continue
        if not conn.has_scope('user:write:chat'):
            continue
        bid = twitch.ensure_connection_broadcaster_id(conn)
        if bid and bid not in seen:
            seen.add(bid)
            yield conn, bid


def _send_to_event(event, message: str, *, announcement: bool = False,
                   color: str = 'primary') -> bool:
    """Post ``message`` to EVERY charity-connected channel's own chat (plus the
    primary). When ``announcement`` is set, post a highlighted /announce in
    ``color`` on channels that granted the announce scope, falling back to a
    normal message elsewhere. Returns True if at least one send succeeded."""
    from . import twitch

    sent_any = False
    for conn, bid in _chat_targets(event):
        try:
            if announcement and conn.has_scope('moderator:manage:announcements'):
                resp = twitch.send_chat_announcement(conn, bid, message, color)
            else:
                resp = send_chat_message(conn, bid, message)
            if getattr(resp, 'ok', False):
                sent_any = True
        except Exception:  # noqa: BLE001 — one channel failing mustn't stop the rest
            logger.exception('chat send to %s failed', conn.login)
    return sent_any


def broadcast(event, message: str, *, announcement: bool = False,
              color: str = 'primary') -> bool:
    """Send an arbitrary (operator-typed) message to all of the event's chat-
    capable channels. Best-effort; returns True if at least one send succeeded."""
    try:
        if event is None or not (message or '').strip():
            return False
        return _send_to_event(
            event, message.strip(), announcement=announcement, color=color,
        )
    except Exception:  # noqa: BLE001
        logger.exception('chat.broadcast failed')
        return False


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

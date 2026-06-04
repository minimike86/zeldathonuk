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


def _primary_connection(event):
    """The connection that should post chat for an event: its primary connected
    channel, falling back to any connected channel. None when nothing usable."""
    ch = (
        event.twitch_channels
        .filter(is_primary=True, connection__isnull=False)
        .select_related('connection')
        .first()
        or event.twitch_channels
        .filter(connection__isnull=False)
        .select_related('connection')
        .first()
    )
    if not ch or not ch.connection:
        return None
    conn = ch.connection
    if not conn.is_active or not (conn.access_token or conn.refresh_token):
        return None
    return conn


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
        from . import twitch

        conn = _primary_connection(event)
        if not conn:
            return False
        bid = twitch.ensure_connection_broadcaster_id(conn)
        if not bid:
            return False
        resp = send_chat_message(conn, bid, message)
        return bool(getattr(resp, 'ok', False))
    except Exception:  # noqa: BLE001 — chat must never break the caller
        logger.exception('chat.announce failed for trigger=%s', trigger)
        return False


def ensure_announcements(event) -> None:
    """Make sure ``event`` has a (disabled) ChatAnnouncement row per trigger,
    seeded with the default template — so the control editor always lists every
    trigger. Idempotent."""
    for trigger in models.ChatTrigger.values:
        models.ChatAnnouncement.objects.get_or_create(
            event=event, trigger=trigger,
            defaults={'enabled': False, 'template': DEFAULT_TEMPLATES.get(trigger, '')},
        )

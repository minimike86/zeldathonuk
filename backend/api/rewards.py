"""Run the actions mapped to a channel-point reward when it's redeemed.

A ``RewardMapping`` (matched by Twitch reward id, else title) has one or more
``RewardAction`` children that fire in order: post a chat message, shout out the
redeemer, or bump the death counter. Called from the EventSub redemption path.
Best-effort — never raises into the caller.
"""
from __future__ import annotations

import logging

from . import models

logger = logging.getLogger(__name__)


def handle_redemption(event, reward: dict, *, user_login: str = '',
                      user_name: str = '', user_input: str = '') -> int:
    """Run the mapped actions for a redeemed reward. Returns how many actions
    fired (0 when no mapping matched). Never raises."""
    try:
        if event is None:
            return 0
        rid = (reward or {}).get('id') or ''
        rtitle = (reward or {}).get('title') or ''
        mapping = next(
            (m for m in event.reward_mappings.filter(enabled=True)
             if m.matches(rid, rtitle)),
            None,
        )
        if not mapping:
            return 0
        ctx = {
            'user': user_name or user_login,
            'reward': rtitle,
            'input': user_input or '',
            'cost': (reward or {}).get('cost', ''),
        }
        fired = 0
        for action in mapping.actions.filter(enabled=True).order_by('order'):
            if _run_action(action, event, ctx, user_login):
                fired += 1
        return fired
    except Exception:  # noqa: BLE001
        logger.exception('rewards.handle_redemption failed')
        return 0


def _run_action(action, event, ctx: dict, user_login: str) -> bool:
    try:
        params = action.params or {}
        if action.action_type == models.RewardActionType.CHAT:
            from . import chat
            template = params.get('template') or '{user} redeemed {reward}'
            message = chat.render_template(template, ctx).strip()
            if not message:
                return False
            return chat._send_to_event(
                event, message,
                announcement=bool(params.get('as_announcement')),
                color=params.get('color', 'primary'),
            )
        if action.action_type == models.RewardActionType.SHOUTOUT:
            if not user_login:
                return False
            from . import shoutouts
            req = shoutouts.enqueue(
                event, user_login, reason=models.ShoutoutReason.MANUAL,
                display=ctx.get('user', ''),
                note=f"redeemed {ctx.get('reward', '')}", force=True,
            )
            return req is not None
        if action.action_type == models.RewardActionType.DEATH_COUNTER:
            try:
                delta = int(params.get('delta', 1))
            except (TypeError, ValueError):
                delta = 1
            return _adjust_death_counter(delta)
        return False
    except Exception:  # noqa: BLE001
        logger.exception('reward action %s failed', action.action_type)
        return False


def _adjust_death_counter(delta: int) -> bool:
    cp = (
        models.CurrentlyPlaying.objects
        .select_related('schedule_entry').filter(pk=1).first()
    )
    entry = cp.schedule_entry if cp else None
    if entry is None:
        return False
    entry.death_count = max(0, (entry.death_count or 0) + delta)
    entry.save(update_fields=['death_count'])
    return True

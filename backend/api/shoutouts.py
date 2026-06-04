"""Twitch shoutout queue.

Twitch limits ``/shoutout`` to once every 2 minutes globally and once every 60
minutes per target, and requires the from-channel to be live. A Zeldathon can
get several donations at once, so we can't fire a shoutout per donation inline.
Instead donors/raiders are **queued** (``ShoutoutRequest``) and
``manage.py process_shoutouts`` drains the queue one at a time on a cron tick,
honouring the cooldowns — drip-feeding the shoutouts.

Everything is best-effort: enqueue/process never raise into the caller.
"""
from __future__ import annotations

import logging
from datetime import timedelta

from django.utils import timezone

from . import models

logger = logging.getLogger(__name__)


def get_config(event) -> 'models.ShoutoutConfig':
    cfg, _ = models.ShoutoutConfig.objects.get_or_create(event=event)
    return cfg


def _primary_login(event) -> str:
    ch = (
        event.twitch_channels.filter(is_primary=True).first()
        or event.twitch_channels.first()
    )
    return ch.login if ch else ''


def enqueue(event, login: str, *, reason: str, amount=None,
            display: str = '', note: str = '',
            force: bool = False) -> 'models.ShoutoutRequest | None':
    """Queue a shoutout for ``login`` if config allows. ``force`` bypasses the
    master enable + per-source gates (used when the operator explicitly wired a
    shoutout, e.g. a reward action). Returns the created row, or None when
    skipped (self, below threshold, or a pending duplicate). Never raises."""
    try:
        login = (login or '').strip().lower()
        if not login:
            return None
        cfg = get_config(event)
        if not force:
            if not cfg.enabled:
                return None
            if reason == models.ShoutoutReason.DONATION:
                if not cfg.shout_donations:
                    return None
                if amount is not None and cfg.min_donation_amount and amount < cfg.min_donation_amount:
                    return None
            elif reason == models.ShoutoutReason.RAID and not cfg.shout_raids:
                return None
        if login == _primary_login(event):
            return None  # never shout the host's own channel
        # One pending entry per target is enough — a burst of donations from the
        # same user shouldn't queue duplicate shoutouts.
        if event.shoutout_requests.filter(
            target_login=login, status=models.ShoutoutStatus.PENDING,
        ).exists():
            return None
        return models.ShoutoutRequest.objects.create(
            event=event, target_login=login, target_display=display,
            reason=reason, note=note,
        )
    except Exception:  # noqa: BLE001
        logger.exception('shoutouts.enqueue failed for %s', login)
        return None


def process_one(event) -> 'models.ShoutoutRequest | None':
    """Send at most one queued shoutout for ``event``, honouring cooldowns +
    the live requirement. Returns the sent row, or None when nothing was sent
    (cooldown not elapsed, offline, no eligible target). Never raises."""
    from . import twitch

    try:
        # Drain whatever's queued (manual shoutouts work even when auto-enqueue
        # is off); only the auto sources are gated by cfg.enabled in enqueue().
        cfg = get_config(event)
        now = timezone.now()

        # Expire stale pending requests so we don't shout someone who donated
        # half an hour ago.
        event.shoutout_requests.filter(
            status=models.ShoutoutStatus.PENDING,
            requested_at__lt=now - timedelta(minutes=cfg.max_age_minutes),
        ).update(status=models.ShoutoutStatus.SKIPPED, detail='expired')

        # Global cooldown — at most one shoutout per window.
        last_sent = (
            event.shoutout_requests
            .filter(status=models.ShoutoutStatus.SENT, sent_at__isnull=False)
            .order_by('-sent_at').first()
        )
        if last_sent and now - last_sent.sent_at < timedelta(
            seconds=cfg.global_cooldown_seconds
        ):
            return None

        conn = twitch.event_primary_connection(event)
        primary_login = _primary_login(event)
        if not conn or not primary_login:
            return None
        if cfg.only_when_live:
            try:
                if not twitch.fetch_stream(primary_login):
                    return None
            except Exception:  # noqa: BLE001
                return None
        from_bid = twitch.ensure_connection_broadcaster_id(conn)
        if not from_bid:
            return None

        target_floor = now - timedelta(seconds=cfg.target_cooldown_seconds)
        pending = event.shoutout_requests.filter(
            status=models.ShoutoutStatus.PENDING,
        ).order_by('requested_at')
        for req in pending:
            # Per-target cooldown — skip (leave pending) if shouted recently.
            if event.shoutout_requests.filter(
                target_login=req.target_login, status=models.ShoutoutStatus.SENT,
                sent_at__gte=target_floor,
            ).exists():
                continue
            profile = twitch.fetch_user_profile(req.target_login)
            if not profile or not profile.get('id'):
                req.status = models.ShoutoutStatus.FAILED
                req.detail = 'channel not found'
                req.save()
                continue
            try:
                resp = twitch.send_shoutout(conn, from_bid, profile['id'], from_bid)
            except Exception as exc:  # noqa: BLE001
                req.detail = str(exc)[:200]
                req.save()
                return None
            if getattr(resp, 'ok', False):
                req.status = models.ShoutoutStatus.SENT
                req.sent_at = timezone.now()
                req.target_display = req.target_display or profile.get('display_name', '')
                req.save()
                return req
            # 429 = Twitch cooldown not elapsed; leave pending to retry. Other
            # errors are terminal for this request.
            req.detail = f'helix {resp.status_code}: {resp.text[:150]}'
            if resp.status_code != 429:
                req.status = models.ShoutoutStatus.FAILED
            req.save()
            return None
        return None
    except Exception:  # noqa: BLE001
        logger.exception('shoutouts.process_one failed')
        return None

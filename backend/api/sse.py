"""Server-Sent Events stream for the omnibar.

The omnibar polls REST endpoints for state, but a few signals need
near-zero latency:
  - operator-triggered overrides (urgent mode should kick in instantly)
  - playthrough events (boss-defeated celebration timing matters)
  - external events (Twitch sub / raid alerts feel jarring if delayed)

This endpoint emits each of those streams as named SSE events. The
frontend's ``useOmnibarSse`` hook prefers SSE; on connection failure
or browser without EventSource it falls back to polling (unchanged).

Why not Channels/WebSockets? SSE is one-way and over HTTP, so the
existing Django + DRF + django-cors stack runs it unmodified — no
ASGI worker, no Redis channel layer. The downside is one persistent
connection per browser source; for our scale (a handful of OBS sources)
that's fine.

The implementation tails the database. Every ``POLL_SECONDS`` we query
for rows newer than our last cursor and emit them. This is intentionally
simple — it avoids needing pgsql LISTEN/NOTIFY or signals, and a slow
tick is still ~50× faster than the 1.5s REST poll.
"""
from __future__ import annotations

import json
import sys
import time
from datetime import datetime, timedelta

from django.http import HttpRequest, StreamingHttpResponse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET

from . import models


def _trigger_log(msg: str) -> None:
    """Stderr-direct so messages show regardless of Django's LOGGING
    config (defaults filter INFO-level out). Prefixed so it's easy
    to grep for in the dev console.
    """
    print(f'[sound-trigger] {msg}', file=sys.stderr, flush=True)


POLL_SECONDS = 0.5
HEARTBEAT_EVERY_SECONDS = 15
MAX_STREAM_SECONDS = 60 * 30  # browsers re-connect; bound the worker.


def _sse(event: str, data) -> bytes:
    """Format a single SSE message."""
    return f'event: {event}\ndata: {json.dumps(data, default=str)}\n\n'.encode()


def _stream():
    """Generator that yields SSE messages until the client disconnects
    or MAX_STREAM_SECONDS elapses (whichever first). Tails the three
    push streams (overrides, playthrough events, external events) plus
    a periodic heartbeat to keep proxies from idling the connection."""
    started = time.monotonic()
    # Cursors. Use timezone-aware now() for everything; rows older than
    # this won't be replayed.
    cursor_override = timezone.now()
    cursor_playthrough = timezone.now()
    cursor_external = timezone.now()
    last_heartbeat = time.monotonic()

    # Tell the client we're alive.
    yield _sse('hello', {'now': timezone.now().isoformat()})

    while time.monotonic() - started < MAX_STREAM_SECONDS:
        time.sleep(POLL_SECONDS)

        # Fire any schedule-entry sound triggers that are now due. Each
        # one creates an OmnibarOverride which the override-cursor block
        # immediately below picks up and emits — no separate SSE event
        # type needed. Runs before the override poll so a same-tick
        # trigger is delivered without an extra POLL_SECONDS of lag.
        _fire_due_sound_triggers()

        # New overrides — any row whose starts_at moved past our cursor
        # (covers both freshly-activated and freshly-created).
        new_overrides = list(
            models.OmnibarOverride.objects
            .filter(is_active=True, starts_at__gt=cursor_override)
            .order_by('starts_at')[:20],
        )
        for o in new_overrides:
            yield _sse('override', _override_payload(o))
        if new_overrides:
            cursor_override = new_overrides[-1].starts_at

        # Playthrough events.
        new_pt = list(
            models.PlaythroughEvent.objects
            .filter(created_at__gt=cursor_playthrough)
            .order_by('created_at')[:20],
        )
        for ev in new_pt:
            yield _sse('playthrough-event', _pt_payload(ev))
        if new_pt:
            cursor_playthrough = new_pt[-1].created_at

        # External (Twitch / Discord / …) events.
        new_ext = list(
            models.ExternalEvent.objects
            .filter(occurred_at__gt=cursor_external, consumed_at__isnull=True)
            .order_by('occurred_at')[:20],
        )
        for ev in new_ext:
            yield _sse('external-event', _ext_payload(ev))
        if new_ext:
            cursor_external = new_ext[-1].occurred_at

        # Heartbeat. Some reverse proxies will close idle SSE streams
        # after ~30s; a 15s comment is enough to keep them open.
        if time.monotonic() - last_heartbeat > HEARTBEAT_EVERY_SECONDS:
            yield b': heartbeat\n\n'
            last_heartbeat = time.monotonic()


def _override_payload(o: 'models.OmnibarOverride') -> dict:
    return {
        'id': o.id, 'kind': o.kind, 'payload': o.payload,
        'target_lane': o.target_lane,
        'starts_at': o.starts_at.isoformat(),
        'expires_at': o.expires_at.isoformat(),
        'priority': o.priority, 'is_active': o.is_active,
        'is_live': o.is_live, 'created_at': o.created_at.isoformat(),
    }


def _pt_payload(ev: 'models.PlaythroughEvent') -> dict:
    return {
        'id': ev.id, 'schedule_entry': ev.schedule_entry_id,
        'kind': ev.kind, 'payload': ev.payload,
        'created_at': ev.created_at.isoformat(),
        'expires_at': ev.expires_at.isoformat() if ev.expires_at else None,
    }


def _ext_payload(ev: 'models.ExternalEvent') -> dict:
    return {
        'id': ev.id, 'source': ev.source, 'kind': ev.kind,
        'payload': ev.payload,
        'occurred_at': ev.occurred_at.isoformat(),
        'consumed_at': ev.consumed_at.isoformat() if ev.consumed_at else None,
    }


def _entry_etas(event: 'models.Event') -> dict[int, datetime]:
    """Build a {schedule_entry_id: expected_start_datetime} map for the
    given event. Walks TOP-LEVEL entries in order accumulating
    `effective_minutes` from `event.start_time` to get each game/break
    slot's ETA, then layers CHILD entries (breaks attached to a game)
    on top — their ETA is the parent's ETA plus their
    `start_offset_minutes`.

    Mirrors the ETA logic the frontend would derive client-side, kept
    server-authoritative so multi-tab omnibars don't race to fire the
    same trigger. Excluding child entries here used to silently drop
    triggers wired to attached breaks; that bug is fixed."""
    etas: dict[int, datetime] = {}
    top_level = list(
        models.ScheduleEntry.objects
        .filter(event=event, parent_entry__isnull=True)
        .order_by('order')
    )
    cursor = event.start_time
    for entry in top_level:
        etas[entry.id] = cursor
        cursor = cursor + timedelta(minutes=entry.effective_minutes or 0)
    # Now layer in children — their ETA hangs off the parent's start,
    # not the cumulative cursor.
    children = list(
        models.ScheduleEntry.objects
        .filter(event=event, parent_entry__isnull=False)
    )
    for entry in children:
        parent_eta = etas.get(entry.parent_entry_id)
        if parent_eta is None:
            continue
        etas[entry.id] = parent_eta + timedelta(minutes=entry.start_offset_minutes or 0)
    return etas


def _fire_due_sound_triggers() -> None:
    """Find any unfired sound triggers whose anchor time has been
    crossed and create the corresponding OmnibarOverride for each.
    Stamps `last_fired_at` so a trigger only fires once per event run
    (operator can reset via /api/schedule-entry-sound-triggers/reset/).
    Logs to stderr at every notable step so a stuck trigger is
    debuggable from the dev console."""
    try:
        event = models.Event.objects.filter(is_active=True).first()
    except Exception as exc:
        _trigger_log(f'event lookup failed: {exc!r}')
        return
    if not event:
        return
    try:
        triggers = list(
            models.ScheduleEntrySoundTrigger.objects
            .filter(
                is_active=True,
                last_fired_at__isnull=True,
                schedule_entry__event=event,
            )
            .select_related('sound', 'schedule_entry')
        )
    except Exception as exc:
        _trigger_log(f'trigger query failed: {exc!r}')
        return
    if not triggers:
        return
    etas = _entry_etas(event)
    now = timezone.now()
    for t in triggers:
        entry_eta = etas.get(t.schedule_entry_id)
        if entry_eta is None:
            _trigger_log(
                f'trigger {t.id} skipped: no ETA for entry '
                f'{t.schedule_entry_id} (event start {event.start_time}, '
                f'known ETAs {sorted(etas.keys())})'
            )
            continue
        if t.anchor == models.TriggerAnchor.END:
            anchor_time = entry_eta + timedelta(
                minutes=t.schedule_entry.effective_minutes or 0,
            )
        else:
            anchor_time = entry_eta
        fire_at = anchor_time + timedelta(seconds=t.offset_seconds)
        if now < fire_at:
            # Don't spam every tick — log only when within 5 seconds
            # so the operator can see "almost there" without log noise
            # during multi-hour countdowns.
            delta = (fire_at - now).total_seconds()
            if delta <= 5:
                _trigger_log(
                    f'trigger {t.id} pending: fires in {delta:.1f}s '
                    f'(anchor={t.anchor}, offset={t.offset_seconds}s, '
                    f'fire_at={fire_at.isoformat()})'
                )
            continue
        try:
            override = models.OmnibarOverride.objects.create(
                kind='schedule-entry-sound',
                payload={
                    'sound_url': t.sound.url,
                    'volume': t.sound.volume,
                    'tag': t.tag,
                    'message': t.message,
                    'subhead': t.subhead,
                    'show_banner': t.show_banner,
                    'duration_seconds': t.duration_seconds,
                    'trigger_id': t.id,
                },
                target_lane=models.OmnibarOverride.LANE_BOTH,
                starts_at=now,
                expires_at=now + timedelta(seconds=t.duration_seconds),
                priority=t.priority,
                is_active=True,
            )
        except Exception as exc:
            _trigger_log(
                f'trigger {t.id} create-override FAILED (sound={t.sound_id}): {exc!r}'
            )
            continue
        t.last_fired_at = now
        t.save(update_fields=['last_fired_at'])
        _trigger_log(
            f'trigger {t.id} FIRED: entry={t.schedule_entry_id} '
            f'anchor={t.anchor} offset={t.offset_seconds}s '
            f'override={override.id} sound={t.sound.name!r} '
            f'url={t.sound.url!r}'
        )


@csrf_exempt
@require_GET
def omnibar_stream(_request: HttpRequest):
    """Long-lived SSE response. Client is expected to reconnect when
    the stream ends (browsers do this automatically for EventSource).

    Plain Django view — NOT `@api_view`. DRF's content negotiation
    runs against the EventSource's `Accept: text/event-stream`
    header before the view executes, and the default renderer list
    doesn't include event-stream, so DRF rejects the request with
    406 Not Acceptable and the stream never opens. That symptom is
    silent unless you're watching access logs for the 406."""
    response = StreamingHttpResponse(_stream(), content_type='text/event-stream')
    # Disable proxy buffering — nginx and similar will otherwise hold
    # bytes until the response closes. (Connection: keep-alive is a
    # hop-by-hop header and wsgiref rejects it; reverse proxies in
    # production add their own.)
    response['Cache-Control'] = 'no-cache, no-transform'
    response['X-Accel-Buffering'] = 'no'
    return response

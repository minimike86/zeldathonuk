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
import time

from django.http import StreamingHttpResponse
from django.utils import timezone
from rest_framework.decorators import api_view
from rest_framework.request import Request

from . import models


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


@api_view(['GET'])
def omnibar_stream(_request: Request):
    """Long-lived SSE response. Client is expected to reconnect when
    the stream ends (browsers do this automatically for EventSource)."""
    response = StreamingHttpResponse(_stream(), content_type='text/event-stream')
    # Disable proxy buffering — nginx and similar will otherwise hold
    # bytes until the response closes. (Connection: keep-alive is a
    # hop-by-hop header and wsgiref rejects it; reverse proxies in
    # production add their own.)
    response['Cache-Control'] = 'no-cache, no-transform'
    response['X-Accel-Buffering'] = 'no'
    return response

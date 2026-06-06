"""Audit-trail logging: a tiny ``log_activity`` helper plus the
``ActivityLogMiddleware`` that auto-captures every mutating API request.

Design (see the Logs & Queue plan):
  - HTTP operator actions are captured generically by the middleware, so we
    don't have to scatter explicit calls across every viewset. A small
    label map turns known endpoints into friendly summaries; everything
    else falls through to a generic "{METHOD} {path}" line.
  - Internal, non-HTTP events (sound triggers firing from the SSE poll loop,
    milestones crossing) call ``log_activity`` directly — the middleware
    can't see those because no request drives them.

The API has no auth and request bodies can carry donor PII, so ``_redact``
strips/masks known-sensitive keys and truncates large values before anything
is persisted. The read endpoint is expected to be reverse-proxy-gated like
the rest of the operator-only surface.
"""
from __future__ import annotations

import json
import sys
from typing import Any

# Keys whose values are dropped (PII / secrets) rather than stored verbatim.
_REDACT_KEYS = {
    'donor_name', 'donor_email', 'name', 'email', 'message', 'comment',
    'address', 'phone', 'password', 'token', 'secret', 'access_token',
    'refresh_token', 'client_secret', 'authorization',
}
_MAX_STR = 500
_MAX_ITEMS = 50


def _redact(value: Any, _depth: int = 0) -> Any:
    """Return a JSON-safe, size-bounded, PII-scrubbed copy of ``value``."""
    if _depth > 6:
        return '…'
    if isinstance(value, dict):
        out = {}
        for k, v in list(value.items())[:_MAX_ITEMS]:
            if str(k).lower() in _REDACT_KEYS:
                out[k] = '[redacted]'
            else:
                out[k] = _redact(v, _depth + 1)
        return out
    if isinstance(value, (list, tuple)):
        return [_redact(v, _depth + 1) for v in value[:_MAX_ITEMS]]
    if isinstance(value, str) and len(value) > _MAX_STR:
        return value[:_MAX_STR] + '…'
    return value


def log_activity(
    *,
    category: str,
    action: str,
    summary: str,
    level: str = 'info',
    source: str = 'system',
    target: Any | None = None,
    target_type: str = '',
    target_id: str = '',
    detail: dict | None = None,
    request=None,
    status_code: int | None = None,
) -> None:
    """Write one ``ActivityLog`` row. Never raises — logging must not break
    the request path or the SSE loop. Import the model lazily so this module
    is import-safe before apps are loaded.
    """
    try:
        from .models import ActivityLog

        if target is not None and not target_type:
            target_type = target.__class__.__name__
        if target is not None and not target_id:
            target_id = str(getattr(target, 'pk', '') or '')

        method = path = ''
        if request is not None:
            method = getattr(request, 'method', '') or ''
            path = (getattr(request, 'path', '') or '')[:300]

        ActivityLog.objects.create(
            category=category,
            action=action[:64],
            level=level,
            summary=summary[:300],
            source=source[:32],
            target_type=(target_type or '')[:64],
            target_id=(target_id or '')[:64],
            detail=_redact(detail or {}),
            request_method=method[:8],
            request_path=path,
            status_code=status_code,
        )
    except Exception as exc:  # pragma: no cover - logging must never throw
        print(f'[activity-log] failed to write: {exc!r}', file=sys.stderr, flush=True)


# ──────────────────────────────────────────────────────────────────────────────
# Middleware — auto-capture mutating API requests
# ──────────────────────────────────────────────────────────────────────────────
_MUTATING = {'POST', 'PUT', 'PATCH', 'DELETE'}

# url_name (DRF reverse name, sans basename) → friendly summary for the
# common operator actions. Misses fall through to a generic summary, so this
# list is a nicety, not a requirement.
_FRIENDLY = {
    'start-timer': 'Started game timer',
    'pause-timer': 'Paused game timer',
    'stop-timer': 'Stopped timer / marked game complete',
    'reset-timer': 'Reset game timer',
    'mute-all': 'Muted all donations',
    'delete-all': 'Deleted all donations',
    'contribute': 'Contributed to incentive',
    'activate': 'Activated record',
    'deactivate': 'Deactivated record',
    'consume': 'Consumed external event',
    'reset': 'Reset (bulk)',
    'reset-fire': 'Re-armed sound trigger',
    'reset-collected': 'Reset collected items',
    'mark-reached': 'Marked milestone reached',
}


def _categorise(path: str) -> tuple[str, str]:
    """(category, source) from the request path prefix."""
    from .models import ActivityLog as A

    if '/webhooks/' in path:
        # /api/webhooks/justgiving/ → source 'justgiving'
        seg = path.rstrip('/').rsplit('/', 1)[-1]
        return A.Category.WEBHOOK, seg or 'webhook'
    if '/twitch/eventsub' in path:
        return A.Category.EXTERNAL_EVENT, 'twitch'
    if '/sandbox/' in path:
        return A.Category.SYSTEM, 'sandbox'
    return A.Category.OPERATOR_ACTION, 'operator'


class ActivityLogMiddleware:
    """Logs every mutating (POST/PUT/PATCH/DELETE) request to ``/api/`` as an
    ActivityLog row. GET traffic (polling, SSE) is ignored so the log reflects
    *changes*, not reads.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        capture = self._should_capture(request)
        body = self._read_body(request) if capture else None
        response = self.get_response(request)
        if capture:
            try:
                self._record(request, response, body)
            except Exception as exc:  # pragma: no cover
                print(f'[activity-log] middleware error: {exc!r}',
                      file=sys.stderr, flush=True)
        return response

    @staticmethod
    def _should_capture(request) -> bool:
        return (
            request.method in _MUTATING
            and request.path.startswith('/api/')
            and not request.path.startswith('/api/stream/')
        )

    @staticmethod
    def _read_body(request):
        # Only JSON bodies — multipart uploads (images) would be huge/binary.
        if 'application/json' not in (request.content_type or ''):
            return None
        try:
            raw = request.body
            return json.loads(raw) if raw else None
        except Exception:
            return None

    def _record(self, request, response, body) -> None:
        from .models import ActivityLog

        path = request.path
        category, source = _categorise(path)
        status = getattr(response, 'status_code', None)
        level = ActivityLog.Level.ERROR if (status and status >= 400) \
            else ActivityLog.Level.INFO

        match = getattr(request, 'resolver_match', None)
        kwargs = getattr(match, 'kwargs', {}) or {}
        target_id = str(kwargs.get('pk', '') or '')

        # Derive the bare action name from the URL's last segment — robust to
        # hyphenated DRF basenames (e.g. 'schedule-entry-sound-trigger') that
        # a basename-prefix split would mangle. A trailing numeric segment is
        # a detail pk (plain CRUD), so there's no custom action.
        segs = [s for s in path.strip('/').split('/') if s]
        last = segs[-1] if segs else ''
        bare = '' if last.isdigit() else last.replace('_', '-')
        friendly = _FRIENDLY.get(bare)

        verb = request.method.lower()
        if friendly:
            summary = friendly
            action = f'{bare}'
        elif verb == 'delete':
            summary = f'Deleted {path}'
            action = 'delete'
        elif verb == 'post':
            summary = f'Created via {path}'
            action = 'create'
        else:  # patch / put
            summary = f'Updated {path}'
            action = 'update'
        if level == ActivityLog.Level.ERROR:
            summary = f'{summary} — failed ({status})'

        detail = {'body': body} if body is not None else {}

        log_activity(
            category=category,
            action=action or verb,
            summary=summary,
            level=level,
            source=source,
            target_id=target_id,
            detail=detail,
            request=request,
            status_code=status,
        )

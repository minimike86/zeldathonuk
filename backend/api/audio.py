"""Audio playlist + CORS proxy for the /obs/audio-countdown visualiser.

We can't point the browser's `<audio>` directly at iterations.org / ocrmirror.org
because they don't send `Access-Control-Allow-Origin: *` — that taints the
stream and the AnalyserNode reads zeroes (flat-line visualiser). So we proxy
through Django, copying upstream bytes with the right CORS headers.

The proxy caches each MP3 to disk on first request (one round-trip to the
upstream), then serves subsequent requests from the local copy instantly.
On upstream 4xx/5xx the track is auto-disabled so the frontend skips it.

Tracks live in the `AudioTrack` DB table. Seed with:
    python manage.py scrape_ocremix --all-zelda
"""
from __future__ import annotations

import hashlib
from pathlib import Path
from urllib.parse import urlparse

import requests
from django.conf import settings
from django.http import (
    FileResponse,
    HttpRequest,
    HttpResponseBadRequest,
    HttpResponseNotFound,
    StreamingHttpResponse,
)
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response

from . import models


ALLOWED_DOMAINS = {
    'ocremix.org',
    'ocrmirror.org',
    'cdn.ocremix.org',
    'iterations.org',
    'ocr.blueblue.fr',
}

CACHE_DIR = Path(getattr(settings, 'BASE_DIR', '/app')) / 'media' / 'audio_cache'
CACHE_DIR.mkdir(parents=True, exist_ok=True)


def _cache_path_for(track: 'models.AudioTrack') -> Path:
    key = hashlib.sha1(track.source_url.encode()).hexdigest()[:20]
    return CACHE_DIR / f'{track.ocr_id or "track"}_{key}.mp3'


def _serialize_track(t):
    if t is None:
        return None
    return {
        'id': t.id,
        'title': t.title,
        'artist': t.artist,
        'game': t.game,
        'ocr_id': t.ocr_id,
        'enabled': t.enabled,
        'order': t.order,
        'url': f'/api/audio/proxy/?id={t.id}',
    }


@api_view(['GET'])
@permission_classes([AllowAny])
def playlist(_request: Request) -> Response:
    tracks = models.AudioTrack.objects.all().order_by('order', 'title')
    return Response([_serialize_track(t) for t in tracks])


@api_view(['PATCH'])
def update_track(request: Request, track_id: int) -> Response:
    """Edit a track in place (toggle enabled, rename, reorder, etc.)."""
    try:
        track = models.AudioTrack.objects.get(pk=track_id)
    except models.AudioTrack.DoesNotExist:
        return Response({'error': 'no such track'}, status=404)
    for field in ('title', 'artist', 'game', 'source_url', 'ocr_id', 'enabled', 'order'):
        if field in request.data:
            setattr(track, field, request.data[field])
    track.save()
    return Response(_serialize_track(track))


@api_view(['GET', 'PUT'])
def now_playing(request: Request) -> Response:
    """GET the active AudioTrack pointer; PUT to update.

    Body fields (all optional except the first PUT):
      - ``track_id``: int or null. Null clears the pin and reverts to random.
      - ``is_pinned``: bool. True = user-selected (Next walks the list);
        False = random rotation (Next picks randomly).
      - ``is_paused``: bool. Toggles playback in /obs/audio-countdown.
      - ``visualiser_style``: str. Canvas visualiser style for the overlay
        (bars | mirror | waveform | radial | wave | auto).
    """
    state = models.NowPlayingAudio.get()
    if request.method == 'PUT':
        body = request.data or {}
        if 'track_id' in body:
            track_id = body['track_id']
            if track_id is None:
                state.track = None
                state.is_pinned = False
            else:
                try:
                    state.track = models.AudioTrack.objects.get(pk=int(track_id))
                except (models.AudioTrack.DoesNotExist, ValueError, TypeError):
                    return Response({'error': 'invalid track_id'}, status=400)
        if 'is_pinned' in body:
            state.is_pinned = bool(body['is_pinned'])
        if 'is_paused' in body:
            state.is_paused = bool(body['is_paused'])
        if 'visualiser_style' in body:
            state.visualiser_style = str(body['visualiser_style'])[:20]
        state.save()
    return Response(
        {
            'track_id': state.track_id,
            'is_pinned': state.is_pinned,
            'is_paused': state.is_paused,
            'visualiser_style': state.visualiser_style,
            'track': _serialize_track(state.track),
            'updated_at': state.updated_at.isoformat(),
        }
    )


def _add_cors(response):
    response['Access-Control-Allow-Origin'] = '*'
    response['Cache-Control'] = 'public, max-age=86400'
    response['Accept-Ranges'] = 'bytes'
    return response


def _serve_local(cache_path: Path, request: HttpRequest):
    """Serve a cached MP3 with Range support so the browser can seek."""
    file_size = cache_path.stat().st_size
    range_header = request.META.get('HTTP_RANGE', '')
    if range_header:
        # Parse `bytes=START-END`. Browsers send `bytes=0-` on initial load.
        try:
            unit, ranges = range_header.split('=', 1)
            start_s, end_s = ranges.split('-', 1)
            start = int(start_s) if start_s else 0
            end = int(end_s) if end_s else file_size - 1
        except ValueError:
            start, end = 0, file_size - 1
        start = max(0, min(start, file_size - 1))
        end = max(start, min(end, file_size - 1))
        length = end - start + 1

        def chunked():
            with cache_path.open('rb') as f:
                f.seek(start)
                remaining = length
                while remaining > 0:
                    buf = f.read(min(64 * 1024, remaining))
                    if not buf:
                        break
                    remaining -= len(buf)
                    yield buf

        response = StreamingHttpResponse(chunked(), status=206, content_type='audio/mpeg')
        response['Content-Range'] = f'bytes {start}-{end}/{file_size}'
        response['Content-Length'] = str(length)
        return _add_cors(response)

    response = FileResponse(cache_path.open('rb'), content_type='audio/mpeg')
    response['Content-Length'] = str(file_size)
    return _add_cors(response)


def _download_to_cache(track, cache_path: Path) -> bool:
    """Pull the upstream MP3 fully into the cache. Returns False on failure
    (and disables the track so we never try again)."""
    forward_headers = {'User-Agent': 'ZeldathonUK/1.0 (+local)'}
    try:
        resp = requests.get(track.source_url, headers=forward_headers, stream=True, timeout=60)
    except requests.RequestException:
        track.enabled = False
        track.save(update_fields=['enabled'])
        return False
    if not resp.ok:
        track.enabled = False
        track.save(update_fields=['enabled'])
        return False
    ctype = resp.headers.get('Content-Type', '')
    # Anything that isn't audio is almost certainly an HTML error page.
    if 'audio' not in ctype and 'mpeg' not in ctype and 'octet' not in ctype:
        track.enabled = False
        track.save(update_fields=['enabled'])
        return False
    tmp = cache_path.with_suffix('.tmp')
    try:
        with tmp.open('wb') as f:
            for chunk in resp.iter_content(chunk_size=64 * 1024):
                if chunk:
                    f.write(chunk)
        tmp.rename(cache_path)
        return True
    except OSError:
        if tmp.exists():
            tmp.unlink(missing_ok=True)
        return False


def proxy(
    request: HttpRequest,
) -> StreamingHttpResponse | HttpResponseBadRequest | HttpResponseNotFound | FileResponse:
    """Serve a cached MP3, downloading on first request and caching to disk.

    Subsequent requests skip the upstream entirely — the browser sees a fast,
    Range-friendly local file with CORS headers attached.
    """
    raw = request.GET.get('id', '')
    try:
        track_id = int(raw)
    except ValueError:
        return HttpResponseBadRequest('id must be an integer')

    try:
        track = models.AudioTrack.objects.get(pk=track_id, enabled=True)
    except models.AudioTrack.DoesNotExist:
        return HttpResponseNotFound('no such track')

    host = urlparse(track.source_url).hostname or ''
    if host not in ALLOWED_DOMAINS:
        return HttpResponseBadRequest(f'domain {host!r} not allowed')

    cache_path = _cache_path_for(track)
    if not cache_path.exists() or cache_path.stat().st_size == 0:
        ok = _download_to_cache(track, cache_path)
        if not ok:
            return HttpResponseNotFound('upstream fetch failed; track disabled')

    return _serve_local(cache_path, request)

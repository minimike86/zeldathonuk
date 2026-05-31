"""Developer-only endpoints for managing /obs/audio-countdown scene files.

These mutate the frontend source tree (rewrite the zelda franchise module,
delete the scene .tsx file) so they are guarded behind DEBUG and a strict
name regex.
Used by the Music control page's per-scene unregister button.
"""
from __future__ import annotations

import re
from pathlib import Path

from django.conf import settings
from django.http import HttpResponseForbidden
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response


# Only PascalCase identifiers ending in `Scene` are accepted. This keeps the
# request from selecting paths with traversal characters or hitting siblings
# that aren't actually scenes (e.g. AudioCountdown.tsx).
SCENE_NAME_RE = re.compile(r'^[A-Z][A-Za-z0-9]+Scene$')


def _frontend_dir() -> Path | None:
    """Resolve the frontend source tree from inside the backend.

    Docker mounts ./frontend at /frontend (see docker-compose.yml). For
    non-containerised dev the frontend lives next to backend/.
    """
    candidates = (
        Path('/frontend'),
        Path(settings.BASE_DIR).parent / 'frontend',
    )
    for cand in candidates:
        if cand.is_dir():
            return cand
    return None


def _edit_scenes_array(line: str, name: str) -> str | None:
    """Strip `name` from a `scenes: [...]` array line.

    Returns the rewritten line, or None if the array would be left empty
    (caller drops the whole line so the theme falls back to the bg gradient).
    Returns the line unchanged when it doesn't look like a scenes line.
    """
    m = re.match(r'^(\s*scenes:\s*\[)([^\]]*)(\].*)$', line)
    if not m:
        return line
    prefix, contents, suffix = m.group(1), m.group(2), m.group(3)
    items = [s.strip() for s in contents.split(',') if s.strip()]
    items = [s for s in items if s != name]
    if not items:
        return None
    return f'{prefix}{", ".join(items)}{suffix}'


@api_view(['POST'])
@permission_classes([AllowAny])
def unregister_scene(request: Request) -> Response:
    if not settings.DEBUG:
        return HttpResponseForbidden('only available in DEBUG mode')

    name = (request.data or {}).get('scene_name', '')
    if not isinstance(name, str) or not SCENE_NAME_RE.match(name):
        return Response({'error': 'invalid scene_name'}, status=400)

    fe = _frontend_dir()
    if fe is None:
        return Response({'error': 'frontend source dir not found'}, status=500)

    # Zelda scene entries live in the zelda franchise module; the scene .tsx
    # components themselves stay in routes/obs/scenes/. (Other franchises are
    # self-contained modules this dev tool doesn't manage.)
    themes_path = (
        fe / 'src' / 'routes' / 'obs' / 'scenes' / 'franchises' / 'zelda' / 'index.ts'
    )
    scene_path = fe / 'src' / 'routes' / 'obs' / 'scenes' / f'{name}.tsx'
    if not themes_path.is_file():
        return Response({'error': 'zelda franchise module not found'}, status=500)

    import_re = re.compile(
        rf"^\s*import\s*\{{\s*{re.escape(name)}\s*\}}\s*from\s*"
        rf"['\"]\.\./\.\./{re.escape(name)}['\"];\s*$"
    )

    original = themes_path.read_text(encoding='utf-8')
    import_removed = False
    array_edits = 0
    out_lines: list[str] = []
    for line in original.splitlines(keepends=True):
        stripped = line.rstrip('\r\n')
        eol = line[len(stripped):]
        if import_re.match(stripped):
            import_removed = True
            continue
        if 'scenes:' in stripped and name in stripped:
            edited = _edit_scenes_array(stripped, name)
            if edited is None:
                array_edits += 1
                continue
            if edited != stripped:
                array_edits += 1
            out_lines.append(edited + eol)
            continue
        out_lines.append(line)

    new_content = ''.join(out_lines)
    if new_content != original:
        themes_path.write_text(new_content, encoding='utf-8')

    scene_file_deleted = False
    if scene_path.is_file():
        scene_path.unlink()
        scene_file_deleted = True

    return Response({
        'scene_name': name,
        'import_removed': import_removed,
        'array_edits': array_edits,
        'scene_file_deleted': scene_file_deleted,
    })

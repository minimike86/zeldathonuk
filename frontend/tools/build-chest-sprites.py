#!/usr/bin/env python3
"""Build the default sprite sheets for /obs/chest-announcer.

By default this generates `chest.png` (a generic pixel-art treasure
chest, no IP — bundled with the repo as the default chest sprite).

With `--with-hero` it ALSO fetches the streamer's own hero sprite frames
from a separate repo (configurable, defaults to `minimike86/link-sprite-buddy`)
and composites them into hero-walk.png / hero-idle.png / hero-reach.png /
hero-hold.png. The composite step is opt-in because hero sprites depicting
identifiable characters carry IP considerations — the streamer is the
right person to make that call for their own deployment.

Output goes to /frontend/public/assets/img/chest-announcer/ (which is
the path inside the backend container; the frontend volume is mounted
there). Cell size 56×56 — large enough for the widest run/idle/early-
attack frames in the linked source, with the character feet-aligned to
the bottom of each cell.

Run from the backend container so Pillow is available:

    docker compose exec backend python /frontend/tools/build-chest-sprites.py
    docker compose exec backend python /frontend/tools/build-chest-sprites.py --with-hero

Or natively with Pillow installed in your own venv — point OUT_DIR at
the local frontend public folder.
"""

from __future__ import annotations

import argparse
import os
import sys
import urllib.request
from io import BytesIO
from pathlib import Path

try:
    from PIL import Image, ImageDraw
except ImportError:
    sys.stderr.write(
        'Pillow is required. Inside the backend container:\n'
        '  pip install Pillow\n'
        'Or on your host with a venv:\n'
        '  python -m pip install Pillow\n'
    )
    sys.exit(1)


# Default output dir — backend container mounts ./frontend at /frontend.
# Override via OUT_DIR env var when running natively.
DEFAULT_OUT_DIR = Path(os.environ.get('OUT_DIR', '/frontend/public/assets/img/chest-announcer'))

CELL = 56

# ── Generic chest sprite ───────────────────────────────────────────────
# Pure-procedural pixel art — no game IP, no character art. Builds a
# 4-frame opening sequence: closed → tilt30° → tilt60° → fully-open with
# a yellow glow inside. Drawn as flat rectangles + simple polygons; no
# anti-aliasing, sized to read crisply when scaled up via `image-rendering:
# pixelated`.

WOOD = (122, 74, 26, 255)
WOOD_DARK = (74, 42, 10, 255)
WOOD_SHADOW = (40, 22, 6, 255)
CAVITY_DARK = (20, 10, 4, 255)         # back wall of an open chest
CAVITY_MID = (45, 25, 10, 255)         # side walls catching some light
CAVITY_RIM = (35, 18, 7, 255)          # ledge between front and interior
GOLD = (252, 208, 120, 255)
GOLD_DARK = (200, 140, 50, 255)
GLOW = (255, 243, 160, 220)
GLOW_BRIGHT = (255, 255, 220, 255)


def draw_chest_body(d: ImageDraw.ImageDraw, ox: int, oy: int) -> None:
    """Draw the bottom box of the chest, anchored so the base sits at row 54."""
    # Body block: 36 wide × 18 tall, centred horizontally in a 56-wide cell.
    bx = ox + 10
    by = oy + 36
    d.rectangle((bx, by, bx + 36, by + 18), fill=WOOD, outline=WOOD_DARK)
    # Vertical wood grain lines
    for gx in (bx + 8, bx + 18, bx + 28):
        d.line((gx, by + 2, gx, by + 16), fill=WOOD_DARK)
    # Floor shadow underneath
    d.rectangle((bx - 1, by + 18, bx + 37, by + 19), fill=WOOD_SHADOW)
    # Centre lock plate
    lx = bx + 16
    ly = by + 4
    d.rectangle((lx, ly, lx + 5, ly + 6), fill=GOLD, outline=GOLD_DARK)
    d.rectangle((lx + 2, ly + 2, lx + 3, ly + 3), fill=WOOD_SHADOW)


def draw_lid_closed(d: ImageDraw.ImageDraw, ox: int, oy: int) -> None:
    bx = ox + 10
    ly_top = oy + 28
    d.rectangle((bx, ly_top, bx + 36, ly_top + 9), fill=WOOD, outline=WOOD_DARK)
    # Gold band along the seam
    d.rectangle((bx, ly_top + 8, bx + 36, ly_top + 9), fill=GOLD)
    # Highlight strip
    d.rectangle((bx + 1, ly_top + 1, bx + 35, ly_top + 2), fill=WOOD_DARK)


def draw_lid_tilt(d: ImageDraw.ImageDraw, ox: int, oy: int, angle: int) -> None:
    """Lid pivoting back from the rear hinge. `angle` ∈ {30, 60}.

    No glow drawn into the sprite — the CSS `.ca-chest-glow` overlay
    handles the bright treasure halo so it can pulse, scale and tint
    with the active theme. Baking a glow into the sprite would stack on
    top of the CSS effect and look opaque/cardboard-y. Mid-tilt frames
    just show the lid pivoting and a small darkening visible inside the
    chest as the mouth starts to open.
    """
    bx = ox + 10
    if angle == 30:
        d.polygon(
            [
                (bx, oy + 28),
                (bx + 36, oy + 28),
                (bx + 36, oy + 22),
                (bx, oy + 18),
            ],
            fill=WOOD,
            outline=WOOD_DARK,
        )
        d.line((bx, oy + 18, bx + 36, oy + 22), fill=GOLD)
    else:  # 60
        d.polygon(
            [
                (bx, oy + 28),
                (bx + 36, oy + 28),
                (bx + 36, oy + 16),
                (bx + 8, oy + 6),
            ],
            fill=WOOD,
            outline=WOOD_DARK,
        )
        d.line((bx + 8, oy + 6, bx + 36, oy + 16), fill=GOLD)
        # Thin dark slit between the lifting lid and the chest body —
        # the very start of the chest mouth opening.
        d.rectangle((bx + 6, oy + 32, bx + 30, oy + 34), fill=CAVITY_DARK)


def draw_lid_open(d: ImageDraw.ImageDraw, ox: int, oy: int) -> None:
    """Fully open chest: dark interior cavity at the top of the body,
    with a thin sliver of the lid's back edge visible above. NO glow or
    light rays in the sprite itself — `.ca-chest-glow` in the CSS draws
    the treasure shine as a screen-blended halo so it can pulse, scale
    and pick up theme colours. Stacking sprite-glow on top of CSS-glow
    looked solid and dead.
    """
    bx = ox + 10

    # Lid tipped fully back — only the back edge of the lid is visible
    # from a front view, sitting as a thin wooden band above the chest.
    lid_y = oy + 30
    d.rectangle((bx + 4, lid_y, bx + 32, lid_y + 2), fill=WOOD)
    d.rectangle((bx + 4, lid_y, bx + 32, lid_y), fill=WOOD_DARK)

    # Open mouth — paints over the top of the chest body (drawn earlier
    # by `draw_chest_body`) so the chest reads as having a cavity at the
    # top with the front face still visible below.
    mouth_top = oy + 33
    mouth_btm = oy + 41
    # Gold rim along the front-top edge — this is the chest's top lip,
    # exposed now that the lid has lifted off it.
    d.rectangle((bx + 5, mouth_top, bx + 31, mouth_top), fill=GOLD)
    # Cavity body
    d.rectangle((bx + 5, mouth_top + 1, bx + 31, mouth_btm), fill=CAVITY_DARK)
    # Lighter back-wall band so the cavity reads as 3D
    d.rectangle((bx + 5, mouth_top + 1, bx + 31, mouth_top + 2), fill=CAVITY_MID)
    # Side walls slightly lit
    d.rectangle((bx + 5, mouth_top + 1, bx + 6, mouth_btm), fill=CAVITY_RIM)
    d.rectangle((bx + 30, mouth_top + 1, bx + 31, mouth_btm), fill=CAVITY_RIM)

    # Sparkles — small 4-pointed stars dotted around the chest. These
    # are intentionally tiny single-pixel marks so they read as
    # incidental detail, not as a filled glow.
    def sparkle(sx: int, sy: int, size: int) -> None:
        d.rectangle((sx, sy - size, sx, sy + size), fill=GLOW_BRIGHT)
        d.rectangle((sx - size, sy, sx + size, sy), fill=GLOW_BRIGHT)

    sparkle(bx - 2, oy + 28, 2)
    sparkle(bx + 38, oy + 26, 2)
    sparkle(bx + 18, oy + 6, 1)
    sparkle(bx + 8, oy + 14, 1)


def build_chest_sheet() -> Image.Image:
    sheet = Image.new('RGBA', (CELL * 4, CELL), (0, 0, 0, 0))
    draw = ImageDraw.Draw(sheet)
    for i in range(4):
        ox = i * CELL
        draw_chest_body(draw, ox, 0)
        if i == 0:
            draw_lid_closed(draw, ox, 0)
        elif i == 1:
            draw_lid_tilt(draw, ox, 0, 30)
        elif i == 2:
            draw_lid_tilt(draw, ox, 0, 60)
        else:
            draw_lid_open(draw, ox, 0)
    return sheet


# ── Hero sheet composition (opt-in) ────────────────────────────────────
# Fetches frames from a sibling repo and lays them out in horizontal
# sheets matching the contract documented in
# /frontend/public/assets/img/chest-announcer/README.md.

HERO_REPO = 'minimike86/link-sprite-buddy'

# Which source frames feed which output sheet. Pick a subset of the
# user's frames so the contract stays small (4-frame walk, 2 idle, etc.)
# and the cell size fits the widest frame in each group without scaling.
HERO_PLAN = {
    'hero-walk.png':  ['run_0',  'run_2',  'run_4',  'run_6'],
    'hero-idle.png':  ['idle_0', 'idle_1'],
    'hero-reach.png': ['atk_0',  'atk_1'],
    'hero-hold.png':  ['atk_0'],
}


def fetch_frame(name: str) -> Image.Image:
    url = f'https://raw.githubusercontent.com/{HERO_REPO}/master/sprites/{name}.png'
    with urllib.request.urlopen(url, timeout=15) as resp:
        return Image.open(BytesIO(resp.read())).convert('RGBA')


def place_centered(target: Image.Image, frame: Image.Image, cell_x: int) -> None:
    """Centre `frame` horizontally in a CELL-wide column at `cell_x`, with
    feet anchored to the bottom of the cell (row CELL-2 to leave a 2px
    breathing strip)."""
    cx = cell_x + (CELL - frame.width) // 2
    cy = (CELL - 2) - frame.height
    target.alpha_composite(frame, (cx, cy))


def build_hero_sheet(frame_names: list[str]) -> Image.Image:
    sheet = Image.new('RGBA', (CELL * len(frame_names), CELL), (0, 0, 0, 0))
    for i, fname in enumerate(frame_names):
        frame = fetch_frame(fname)
        # Some source frames overshoot the cell width. Scale down preserving
        # aspect if so — keeps the silhouette intact without cropping the
        # sword/arm extension.
        if frame.width > CELL or frame.height > (CELL - 2):
            scale = min(CELL / frame.width, (CELL - 2) / frame.height)
            new_w = max(1, int(frame.width * scale))
            new_h = max(1, int(frame.height * scale))
            frame = frame.resize((new_w, new_h), Image.NEAREST)
        place_centered(sheet, frame, i * CELL)
    return sheet


# ── Entry point ────────────────────────────────────────────────────────


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        '--with-hero',
        action='store_true',
        help=(
            'Also fetch + composite the hero sprite sheets from the configured '
            'GitHub repo. Off by default because hero sprites may carry IP '
            f'considerations; configured repo: {HERO_REPO}'
        ),
    )
    parser.add_argument(
        '--out',
        type=Path,
        default=DEFAULT_OUT_DIR,
        help=f'Output directory (default {DEFAULT_OUT_DIR})',
    )
    args = parser.parse_args()

    args.out.mkdir(parents=True, exist_ok=True)

    chest = build_chest_sheet()
    chest_path = args.out / 'chest.png'
    chest.save(chest_path)
    print(f'wrote {chest_path}  ({chest.width}×{chest.height})')

    if args.with_hero:
        for filename, frames in HERO_PLAN.items():
            sheet = build_hero_sheet(frames)
            out = args.out / filename
            sheet.save(out)
            print(f'wrote {out}  ({sheet.width}×{sheet.height})  ← {", ".join(frames)}')
    else:
        print(
            '(skipped hero sheets — run with --with-hero to fetch and composite '
            f'sprite frames from {HERO_REPO})'
        )

    return 0


if __name__ == '__main__':
    raise SystemExit(main())

# Chest Announcer sprite sheets

The `/obs/chest-announcer` browser source needs five sprite sheets:

| File              | Origin                                     |
|-------------------|--------------------------------------------|
| `chest.png`       | **Generated** by the build script — bundled in this folder |
| `hero-walk.png`   | Generated on demand (opt-in) from your own sprite repo     |
| `hero-idle.png`   | "                                                          |
| `hero-reach.png`  | "                                                          |
| `hero-hold.png`   | "                                                          |

`chest.png` is committed because it's procedurally generated pixel art
with no character likeness — safe to ship. The four `hero-*.png` files
are populated on demand from a separate sprite repo so each deployer
controls what character art goes in.

## Building the sheets

The build script is at `frontend/tools/build-chest-sprites.py`. It uses
Pillow.

**Chest only (default — bundled in the repo already):**

```bash
docker compose exec backend python /frontend/tools/build-chest-sprites.py
```

**Chest + hero sheets:**

```bash
docker compose exec backend python /frontend/tools/build-chest-sprites.py --with-hero
```

The hero step fetches frames from the repo configured at the top of the
script (`HERO_REPO`) and lays them out into the four sheets. After
running it, flip `USE_REAL_HERO_SPRITES` to `true` near the top of
`frontend/src/routes/obs/ChestAnnouncer.tsx` so the component uses the
PNGs instead of its inline SVG placeholders.

## Sheet contract

All sheets are **single-row** horizontal strips, transparent background,
**56×56 px** per cell, nearest-neighbour scaling. The component renders
them with `image-rendering: pixelated`. Character feet sit on row 53–54
(so the cell has a 2px breathing strip at the bottom).

| File              | Cells | Sheet size (W×H) | Animation                                      |
|-------------------|-------|------------------|------------------------------------------------|
| `hero-walk.png`   | 4     | 224×56           | 500 ms `steps(4)` infinite — faces right       |
| `hero-idle.png`   | 2     | 112×56           | 900 ms `steps(2)` infinite                     |
| `hero-reach.png`  | 2     | 112×56           | 500 ms `steps(2)` once                         |
| `hero-hold.png`   | 1     | 56×56            | static; CSS bob applied to the wrapper         |
| `chest.png`       | 4     | 224×56           | 600 ms `steps(3)` once open; reverse to close  |

### Hero pose conventions

- All hero sheets share a common silhouette so frame-to-frame transitions
  read cleanly. Centre the character horizontally in each cell, feet on
  rows 53–54.
- `hero-walk.png`: 4-frame walk cycle facing right. The component mirrors
  the sheet via `transform: scaleX(-1)` for walk-out, so you only need
  the rightward-facing version.
- `hero-idle.png`: 2-frame breathing loop while standing next to the chest.
- `hero-reach.png`: 2-frame plunge into the chest. Frame 0 is arm
  extended toward the chest, frame 1 is arm in deeper / body leaning.
- `hero-hold.png`: single frame with arms raised so a card floats above
  the character. A gentle vertical bob is applied in CSS — don't bake
  one into the sprite.

### Chest pose conventions

- 4 frames, opening sequence (closed → tilt30° → tilt60° → fully open).
  The component plays frames 0→3 for opening and reverses for closing,
  via CSS step animations — no need for separate close-direction frames.
- Chest base stays put across all frames; only the lid moves. Keep the
  lid hinge centred along the top edge.
- Frame 3 is the "held open" pose. The component overlays its own
  yellow glow above the chest mouth, so don't render heavy light leaks
  in the sprite itself.

## Want to swap the hero repo?

Edit `HERO_REPO` at the top of `build-chest-sprites.py`. The script
expects the source repo to be public on GitHub and to contain frames at
`/sprites/{name}.png` for the source names listed in `HERO_PLAN` near
the top of the script (e.g. `run_0` … `run_6`, `idle_0`, `idle_1`,
`atk_0`, `atk_1`).

"""Seed the full set of arrangement presets for each non-4x3 layout type.

The earlier 0104 seed gave each type a *single* preset, which (a) made it the
always-active row with nothing to switch to — the reported "can't switch layout"
bug — and (b) referenced variant ids (`screens-right`/`screens-left`/`tv-left`)
that no longer exist after the edge-carving rework. This migration:

  1. Removes the five stale single defaults 0104 seeded (matched by exact
     layout_type + name), then
  2. Seeds, per layout type, the *full* arrangement set as separate presets — the
     first active, the rest inactive — so there is always another arrangement to
     activate. Only seeds a type that has no presets left (so an operator's own
     rows are never overwritten). 4x3 (seeded in 0101) is untouched.

Configs mirror useLayoutPresetConfig.defaultConfigForVariant: a 2-region
arrangement gets game-info/runners/timer on the first zone and
items/next-objective/deaths on the second; a single-zone arrangement gets the
combined side stack.
"""
from __future__ import annotations

from django.db import migrations

NARROW_LEFT = ['game-info', 'runners', 'timer']
NARROW_RIGHT = ['items-collected', 'next-objective', 'death-count']
SIDE = ['game-info', 'runners', 'timer', 'items-collected']


def cfg(variant, regions):
    """Build a preset config: regions is a list of (region_id, size_px). A
    2-region arrangement splits the default elements left/right; otherwise every
    region gets the combined side stack."""
    two = len(regions) == 2
    out = {}
    for i, (rid, size) in enumerate(regions):
        if two:
            elements = list(NARROW_LEFT if i == 0 else NARROW_RIGHT)
        else:
            elements = list(SIDE)
        out[rid] = {'widthPx': size, 'elements': elements}
    return {'variant': variant, 'shellImageUrl': '', 'regions': out}


# Single-capture arrangements (16x9 / ds-top): six placements.
SINGLE_CAPTURE = [
    ('Capture middle', 'game-center', [('left', 304), ('right', 304)]),
    ('Capture left', 'game-left', [('right', 608)]),
    ('Capture right', 'game-right', [('left', 608)]),
    ('Screen top', 'screen-top', [('bottom', 220)]),
    ('Screen middle', 'screen-middle', [('top', 220), ('bottom', 220)]),
    ('Screen bottom', 'screen-bottom', [('top', 220)]),
]

# Dual-screen arrangements (3ds / ds-both): stacked vs side-by-side.
DUAL_SCREEN = [
    ('Stacked, panels right', 'stacked-left', [('right', 760)]),
    ('Stacked, panels left', 'stacked-right', [('left', 760)]),
    ('Side by side, panels below', 'sidebyside-top', [('bottom', 260)]),
    ('Side by side, panels above', 'sidebyside-bottom', [('top', 260)]),
]

# Four Swords: GBAs in a row under the TV, or a column beside it.
FSA = [
    ('GBAs under TV', 'gbas-under', [('right', 420)]),
    ('GBAs left of TV', 'gbas-left', [('bottom', 200)]),
    ('GBAs right of TV', 'gbas-right', [('bottom', 200)]),
]

# (layout_type, arrangements) — first arrangement is the active default.
SEED = [
    ('16x9', SINGLE_CAPTURE),
    ('ds-top', SINGLE_CAPTURE),
    ('3ds', DUAL_SCREEN),
    ('ds-both', DUAL_SCREEN),
    ('fsa-split', FSA),
]

# The single defaults 0104 seeded, to clear before reseeding the full sets.
STALE_0104 = [
    ('16x9', 'Widescreen default'),
    ('ds-top', 'DS top default'),
    ('3ds', '3DS default'),
    ('ds-both', 'DS both default'),
    ('fsa-split', 'Four Swords default'),
]


def seed(apps, schema_editor):
    LayoutPreset = apps.get_model('api', 'LayoutPreset')

    # 1. Drop the stale single defaults so each type can be reseeded in full.
    for layout_type, name in STALE_0104:
        LayoutPreset.objects.filter(layout_type=layout_type, name=name).delete()

    # 2. Seed the full arrangement set for any type now without presets.
    for layout_type, arrangements in SEED:
        if LayoutPreset.objects.filter(layout_type=layout_type).exists():
            continue
        for i, (name, variant, regions) in enumerate(arrangements):
            LayoutPreset.objects.create(
                layout_type=layout_type,
                name=name,
                is_active=(i == 0),
                config=cfg(variant, regions),
            )


def unseed(apps, schema_editor):
    LayoutPreset = apps.get_model('api', 'LayoutPreset')
    for layout_type, arrangements in SEED:
        names = [name for name, _variant, _regions in arrangements]
        LayoutPreset.objects.filter(layout_type=layout_type, name__in=names).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0104_seed_layout_presets_all_types'),
    ]

    operations = [
        migrations.RunPython(seed, unseed),
    ]

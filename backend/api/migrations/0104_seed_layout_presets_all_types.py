"""Seed one default active LayoutPreset for each newly-wired layout type
(16x9 / ds-top / 3ds / ds-both / fsa-split), mirroring the 4x3 seed (0101) so
/obs/full + /control/layouts have working arrangements out of the box.

Configs mirror useLayoutPresetConfig.defaultPresetConfig for each type. Idempotent
(get_or_create by name+layout_type); the centre/first variant is active.
"""
from __future__ import annotations

from django.db import migrations

NARROW_LEFT = ['game-info', 'runners', 'timer']
NARROW_RIGHT = ['items-collected', 'next-objective', 'death-count']
SIDE = ['game-info', 'runners', 'timer', 'items-collected']


def two_side(variant):
    return {
        'variant': variant,
        'shellImageUrl': '',
        'regions': {
            'left': {'widthPx': 304, 'elements': NARROW_LEFT},
            'right': {'widthPx': 304, 'elements': NARROW_RIGHT},
        },
    }


def one_side(variant, side, width):
    return {
        'variant': variant,
        'shellImageUrl': '',
        'regions': {side: {'widthPx': width, 'elements': list(SIDE)}},
    }


# (layout_type, preset name, config) — one active default each.
PRESETS = [
    ('16x9', 'Widescreen default', two_side('game-center')),
    ('ds-top', 'DS top default', two_side('game-center')),
    ('3ds', '3DS default', one_side('screens-right', 'left', 480)),
    ('ds-both', 'DS both default', one_side('screens-left', 'right', 1180)),
    ('fsa-split', 'Four Swords default', one_side('tv-left', 'right', 480)),
]


def seed(apps, schema_editor):
    LayoutPreset = apps.get_model('api', 'LayoutPreset')
    for layout_type, name, config in PRESETS:
        # Only seed when this layout type has no preset yet, so an operator who
        # already authored one for it isn't given a competing active row.
        if LayoutPreset.objects.filter(layout_type=layout_type).exists():
            continue
        LayoutPreset.objects.get_or_create(
            layout_type=layout_type,
            name=name,
            defaults={'is_active': True, 'config': config},
        )


def unseed(apps, schema_editor):
    LayoutPreset = apps.get_model('api', 'LayoutPreset')
    LayoutPreset.objects.filter(
        layout_type__in=[p[0] for p in PRESETS],
        name__in=[p[1] for p in PRESETS],
    ).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0103_game_item_group_order'),
    ]

    operations = [
        migrations.RunPython(seed, unseed),
    ]

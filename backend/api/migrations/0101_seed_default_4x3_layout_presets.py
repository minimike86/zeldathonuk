"""Seed the three default 4:3 layout presets — capture left / middle / right —
so /obs/full has working arrangements the moment the feature ships. Mirrors the
geometry the frontend parser expects (capture 1126px wide on the 1920×984 stage;
side regions of 794px, or 397+397 for the centre variant).

Idempotent: only creates a preset when no preset of that name+layout_type exists,
so re-running (or running after an operator has hand-edited) won't duplicate or
clobber. The centre variant is activated as the default.
"""
from __future__ import annotations

from django.db import migrations

# Element defaults per region. Kept deliberately modest — operators tune the
# rest in /control/layouts. Ids must match useLayoutPresetConfig.ELEMENT_IDS.
_WIDE_SIDE = ['game-info', 'runners', 'timer', 'items-collected']
_NARROW_LEFT = ['game-info', 'runners', 'timer']
_NARROW_RIGHT = ['items-collected', 'next-objective', 'death-count']

# Region widths that let a true 4:3 capture fill the full 984px stage height:
#   single side → 1920 − 608 = 1312 wide → 984 tall; two sides → 1920 − 304×2.
# Operators can widen these later (the capture then letterboxes vertically).
PRESETS = [
    {
        'name': 'Capture left',
        'is_active': False,
        'config': {
            'variant': 'game-left',
            'regions': {'right': {'widthPx': 608, 'elements': _WIDE_SIDE}},
        },
    },
    {
        'name': 'Capture middle',
        'is_active': True,
        'config': {
            'variant': 'game-center',
            'regions': {
                'left': {'widthPx': 304, 'elements': _NARROW_LEFT},
                'right': {'widthPx': 304, 'elements': _NARROW_RIGHT},
            },
        },
    },
    {
        'name': 'Capture right',
        'is_active': False,
        'config': {
            'variant': 'game-right',
            'regions': {'left': {'widthPx': 608, 'elements': _WIDE_SIDE}},
        },
    },
]


def seed(apps, schema_editor):
    LayoutPreset = apps.get_model('api', 'LayoutPreset')
    for spec in PRESETS:
        # Historical models don't run the custom save(), so scoped demotion
        # isn't a concern here — we set is_active directly and only one row
        # carries it.
        LayoutPreset.objects.get_or_create(
            layout_type='4x3',
            name=spec['name'],
            defaults={'is_active': spec['is_active'], 'config': spec['config']},
        )


def unseed(apps, schema_editor):
    LayoutPreset = apps.get_model('api', 'LayoutPreset')
    LayoutPreset.objects.filter(
        layout_type='4x3',
        name__in=[p['name'] for p in PRESETS],
    ).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0100_layoutpreset'),
    ]

    operations = [
        migrations.RunPython(seed, unseed),
    ]

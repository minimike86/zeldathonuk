"""Seed the canonical "what SpecialEffect does / how to help" blurbs.

These used to be hardcoded into the React CharityCluster fallback
list, but operators couldn't edit them without a code change. Moving
them into CharitySlide rows means the same blurbs render via the
configured path (the frontend just polls the API) AND can be edited /
reordered / paused / deleted from /control/omnibar like any other
charity slide.

Idempotent: the seed runs only if the CharitySlide table is empty so
re-applying the migration on an existing DB (or running it after the
operator has already curated their own list) is a no-op.
"""
from django.db import migrations


SEED_BLURBS = [
    {
        'title': 'SpecialEffect',
        'body': 'Helps disabled gamers play to the very best of their abilities.',
        'order': 10,
    },
    {
        'title': 'Custom kit',
        'body': "Donations fund bespoke controllers for people who couldn't otherwise play.",
        'order': 11,
    },
    {
        'title': '100% goes through',
        'body': 'Every pound raised in GameBlast goes directly to SpecialEffect.',
        'order': 12,
    },
    {
        'title': 'How to help',
        'body': 'Donate at zeldathon.co.uk/charity.',
        'order': 13,
    },
]


def seed(apps, schema_editor):
    CharitySlide = apps.get_model('api', 'CharitySlide')
    if CharitySlide.objects.exists():
        # Operator already has slides — leave them alone.
        return
    for blurb in SEED_BLURBS:
        CharitySlide.objects.create(
            kind='blurb',
            title=blurb['title'],
            body=blurb['body'],
            image_url='',
            alt_text='',
            order=blurb['order'],
            is_active=True,
        )


def unseed(apps, schema_editor):
    # Reverse: drop the exact rows we inserted. Keyed on the title +
    # body pair so operator-renamed slides are left untouched.
    CharitySlide = apps.get_model('api', 'CharitySlide')
    for blurb in SEED_BLURBS:
        CharitySlide.objects.filter(
            kind='blurb',
            title=blurb['title'],
            body=blurb['body'],
        ).delete()


class Migration(migrations.Migration):
    dependencies = [
        ('api', '0040_chest_announcer_between_cards_ms'),
    ]
    operations = [
        migrations.RunPython(seed, reverse_code=unseed),
    ]

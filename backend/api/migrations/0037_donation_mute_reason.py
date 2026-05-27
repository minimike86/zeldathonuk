"""Replace the simple `is_muted` boolean with a reasoned `mute_reason`
enum so the operator can record *why* a donation was suppressed
(naughty name / message / image, already-announced, etc.) instead of a
yes/no flag with no audit trail.

Backfill: any row currently muted (`is_muted=True`) becomes
`mute_reason='other'` — the operator's prior intent is preserved, even
though the historical reason is lost. New mutes pick a specific reason
from the dropdown in /control/donations.
"""
from django.db import migrations, models


MUTE_REASON_CHOICES = [
    ('', '— not muted —'),
    ('naughty_name', 'Inappropriate donor name'),
    ('naughty_message', 'Inappropriate message text'),
    ('naughty_image', 'Inappropriate donor image'),
    ('already_announced', 'Already announced on stream'),
    ('other', 'Other / manual'),
]


def backfill_mute_reason(apps, schema_editor):
    Donation = apps.get_model('api', 'Donation')
    Donation.objects.filter(is_muted=True).update(mute_reason='other')


def restore_is_muted(apps, schema_editor):
    Donation = apps.get_model('api', 'Donation')
    Donation.objects.exclude(mute_reason='').update(is_muted=True)


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0036_game_omnibar_layout'),
        # Unrelated parallel leaf — declared as a dep so this migration
        # rebases the graph into a single line without needing an
        # explicit merge migration.
        ('api', '0035_chest_announcer_sound_triggers'),
    ]

    operations = [
        migrations.AddField(
            model_name='donation',
            name='mute_reason',
            field=models.CharField(
                blank=True,
                choices=MUTE_REASON_CHOICES,
                db_index=True,
                default='',
                help_text=(
                    'Why this donation is muted from /obs/tts and '
                    '/obs/omnibar live-donation overlays. Empty string '
                    '= not muted. Lets the operator record WHY a row '
                    'was suppressed (naughty content in name/message/'
                    'image, repeat announcement, etc.) rather than a '
                    'yes/no flag with no audit trail. The donation '
                    'still counts toward totals — only the announcement '
                    'is suppressed.'
                ),
                max_length=32,
            ),
        ),
        migrations.RunPython(backfill_mute_reason, restore_is_muted),
        migrations.RemoveField(
            model_name='donation',
            name='is_muted',
        ),
    ]

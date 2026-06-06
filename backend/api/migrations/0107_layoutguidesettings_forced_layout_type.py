from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0106_layoutguidesettings'),
    ]

    operations = [
        migrations.AddField(
            model_name='layoutguidesettings',
            name='forced_layout_type',
            field=models.CharField(
                blank=True,
                choices=[
                    ('16x9', '16:9 widescreen'),
                    ('4x3', '4:3 standard'),
                    ('3ds', 'Nintendo 3DS'),
                    ('ds-top', 'Nintendo DS — top screen only'),
                    ('ds-both', 'Nintendo DS — both screens'),
                    ('fsa-split', 'Four Swords Adventures — 4-player split'),
                ],
                default='',
                help_text='When set, /obs/full forces this aspect ratio instead '
                          'of following the currently-playing game. Blank = auto '
                          '(follow the schedule). Set from /control/layouts.',
                max_length=20,
            ),
        ),
    ]

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0061_gameitem_link_group_link_kind'),
    ]

    operations = [
        migrations.AddField(
            model_name='gameitem',
            name='countable',
            field=models.BooleanField(
                default=False,
                help_text='If set, this item is tracked as a tally that can go '
                          'up/down (e.g. Small Key, Map, Compass collected once '
                          'per dungeon) instead of a single collected/not-collected '
                          'toggle.',
            ),
        ),
        migrations.AddField(
            model_name='collecteditem',
            name='quantity',
            field=models.PositiveIntegerField(
                default=1,
                help_text='How many collected. Always 1 for normal toggle items; '
                          'for countable items (keys, maps...) this is the tally. '
                          'A row is deleted when the tally drops to 0.',
            ),
        ),
    ]

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0063_item_sets'),
    ]

    operations = [
        migrations.AddField(
            model_name='gameitem',
            name='starts_collected',
            field=models.BooleanField(
                default=False,
                help_text='Player begins the game already holding this item. '
                          'Applied by the "Reset to start" action on /control/items.',
            ),
        ),
        migrations.AddField(
            model_name='gameitem',
            name='unlocks_with',
            field=models.ManyToManyField(
                blank=True,
                help_text='Items collected at the same time as this one (e.g. Bow '
                          '+ Quiver). Collecting or clearing any member cascades '
                          'to the rest of the connected group.',
                to='api.gameitem',
            ),
        ),
    ]

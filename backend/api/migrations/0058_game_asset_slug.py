from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0057_raffle'),
    ]

    operations = [
        migrations.AddField(
            model_name='game',
            name='asset_slug',
            field=models.SlugField(
                blank=True,
                help_text='Short asset-folder key under '
                          '/assets/img/game-franchise/legend-of-zelda/<slug>/ '
                          "(e.g. 'lttp'). Used to resolve the per-game item sprite folder.",
                max_length=40,
            ),
        ),
    ]

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0022_theme_hue_links'),
    ]

    operations = [
        migrations.AddField(
            model_name='event',
            name='gameblast_logo_url',
            field=models.URLField(
                blank=True,
                help_text=(
                    "SpecialEffect's current GameBlast campaign logo (e.g. "
                    'GB22, GB23…). Surfaced in the OBS omnibar and ad-panel '
                    'carousel. Refresh this each year when the campaign '
                    'rebrands.'
                ),
            ),
        ),
    ]

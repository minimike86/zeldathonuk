import django.core.validators
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0095_remove_setpiece_uniq_auto_setpiece_per_entry_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='chestannouncersettings',
            name='scale',
            field=models.FloatField(
                default=1.0,
                validators=[
                    django.core.validators.MinValueValidator(0.1),
                    django.core.validators.MaxValueValidator(4.0),
                ],
                help_text=(
                    'Overall size of the scene (hero, chest, card, confetti) '
                    'as a multiplier of the container-derived default. 1.0 is '
                    'the legacy size; lower values shrink the scene for tall '
                    'OBS sources (e.g. a full 1920x1080 browser source, where '
                    'the default is huge). The ground baseline stays fixed, so '
                    'the scene scales toward the floor line. Range 0.25–2.0 '
                    'enforced client-side.'
                ),
            ),
        ),
    ]

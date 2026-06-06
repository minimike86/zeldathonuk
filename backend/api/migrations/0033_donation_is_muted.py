from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0032_setpiece_substate'),
    ]

    operations = [
        migrations.AddField(
            model_name='donation',
            name='is_muted',
            field=models.BooleanField(
                default=False,
                help_text=(
                    'When true the /obs/tts and /obs/omnibar live-donation '
                    'overlays skip this donation entirely (no card, no '
                    'speech). Lets the operator suppress profanity or '
                    'already-announced repeats. Donation still counts '
                    'toward totals — only the announcement is muted.'
                ),
            ),
        ),
    ]

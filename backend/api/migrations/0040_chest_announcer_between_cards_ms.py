from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0039_charity_slides'),
    ]

    operations = [
        migrations.AddField(
            model_name='chestannouncersettings',
            name='between_cards_ms',
            field=models.PositiveIntegerField(
                default=1500,
                help_text=(
                    'Pause in milliseconds between donation cards when '
                    'multiple donations queue up. Hero stays at the chest '
                    'in idle pose for this long before reaching in for the '
                    'next donation, giving viewers a beat to register each '
                    'donor before the next reveal. Range 0–10000 enforced '
                    'client-side.'
                ),
            ),
        ),
    ]

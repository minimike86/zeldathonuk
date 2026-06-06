from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0040_chest_announcer_between_cards_ms'),
    ]

    operations = [
        migrations.AddField(
            model_name='chestannouncersettings',
            name='card_min_hold_ms',
            field=models.PositiveIntegerField(
                default=2800,
                help_text=(
                    'Minimum time (ms) a donation card stays on screen, even '
                    'if the audio finishes earlier. Keeps the visual rhythm '
                    'consistent for short sounds. Range 500–60000 enforced '
                    'client-side.'
                ),
            ),
        ),
        migrations.AddField(
            model_name='chestannouncersettings',
            name='card_max_hold_ms',
            field=models.PositiveIntegerField(
                default=20000,
                help_text=(
                    'Hard ceiling (ms) on how long a card can stay on screen '
                    'waiting for audio to finish. A long-running custom sting '
                    'gets cut off after this to keep the donation queue '
                    'moving. Should be >= card_min_hold_ms. Range up to '
                    '300000 (5 min) enforced client-side.'
                ),
            ),
        ),
    ]

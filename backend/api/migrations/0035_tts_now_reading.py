import django.db.models.deletion
from django.db import migrations, models
import django.utils.timezone


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0034_chest_announcer_settings'),
    ]

    operations = [
        migrations.CreateModel(
            name='TtsNowReading',
            fields=[
                (
                    'id',
                    models.AutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name='ID',
                    ),
                ),
                (
                    'started_at',
                    models.DateTimeField(
                        default=django.utils.timezone.now,
                        help_text=(
                            'When the current utterance started. Updated '
                            'on every transition so a stale row (e.g. a '
                            'crashed overlay) can be detected by comparing '
                            'against wall-clock.'
                        ),
                    ),
                ),
                (
                    'donation',
                    models.ForeignKey(
                        blank=True,
                        help_text=(
                            'Donation currently being narrated, or NULL '
                            'when the TTS overlay is idle.'
                        ),
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name='+',
                        to='api.donation',
                    ),
                ),
            ],
            options={
                'verbose_name_plural': 'tts now reading',
            },
        ),
    ]

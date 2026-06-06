import django.db.models.deletion
from django.db import migrations, models
import django.utils.timezone


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0030_theme_depths'),
    ]

    operations = [
        migrations.CreateModel(
            name='TtsReplay',
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
                    'requested_at',
                    models.DateTimeField(
                        default=django.utils.timezone.now,
                        help_text=(
                            'Bumped on every replay request. The /obs/tts '
                            'page uses this as a high-water mark — when it '
                            'moves forward, enqueue the linked donation.'
                        ),
                    ),
                ),
                (
                    'donation',
                    models.ForeignKey(
                        blank=True,
                        help_text=(
                            'The donation to re-announce. Cleared (without '
                            'dropping the singleton row) when the donation '
                            'is deleted.'
                        ),
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name='+',
                        to='api.donation',
                    ),
                ),
            ],
            options={
                'verbose_name_plural': 'tts replays',
            },
        ),
    ]

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0034_chest_announcer_settings'),
    ]

    operations = [
        migrations.CreateModel(
            name='ChestAnnouncerSoundTrigger',
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
                    'name',
                    models.CharField(
                        max_length=120,
                        help_text=(
                            'Operator-facing label '
                            '(e.g. "£6.70 sting", "OoT theme").'
                        ),
                    ),
                ),
                (
                    'kind',
                    models.CharField(
                        max_length=16,
                        choices=[
                            ('game', 'Game'),
                            ('amount', 'Amount'),
                            ('keyword', 'Keyword'),
                        ],
                    ),
                ),
                (
                    'match',
                    models.CharField(
                        max_length=200,
                        blank=True,
                        help_text=(
                            'amount: a decimal string like "6.70" — matches '
                            '£6.70 (±0.005). keyword: comma-separated terms, '
                            'case-insensitive substring. game: leave blank, '
                            'the `game` FK below drives the match.'
                        ),
                    ),
                ),
                (
                    'sound_url',
                    models.CharField(
                        max_length=500,
                        help_text=(
                            'Absolute URL or site-relative path to an audio '
                            'file (mp3/wav/ogg). Streamer is responsible for '
                            'licensing.'
                        ),
                    ),
                ),
                (
                    'volume',
                    models.FloatField(
                        default=0.6,
                        help_text=(
                            'Playback gain (0.0–1.0). Defaults to 0.6 — '
                            'louder than the fanfare since the streamer '
                            'presumably wants the sting to land.'
                        ),
                    ),
                ),
                (
                    'priority',
                    models.PositiveIntegerField(
                        default=10,
                        help_text=(
                            'Lower number = higher priority. Multiple '
                            'triggers can match the same donation; the '
                            'lowest-priority active trigger wins.'
                        ),
                    ),
                ),
                ('is_active', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                (
                    'game',
                    models.ForeignKey(
                        null=True,
                        blank=True,
                        on_delete=models.deletion.SET_NULL,
                        related_name='chest_sound_triggers',
                        to='api.game',
                        help_text=(
                            'Only used when kind=game. Fires while this '
                            'game is the currently-playing schedule entry.'
                        ),
                    ),
                ),
            ],
            options={
                'ordering': ['priority', 'name'],
                'verbose_name': 'Chest announcer sound trigger',
                'verbose_name_plural': 'Chest announcer sound triggers',
            },
        ),
    ]

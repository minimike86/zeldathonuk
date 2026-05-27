from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0033_donation_is_muted'),
    ]

    operations = [
        migrations.CreateModel(
            name='ChestAnnouncerSettings',
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
                    'audio_enabled',
                    models.BooleanField(
                        default=False,
                        help_text=(
                            'When true, the chest announcer plays a short '
                            'procedural fanfare on each donation card reveal. '
                            'Default false because the omnibar already '
                            'announces donations via TTS — leave off when '
                            'both overlays are in the scene to avoid '
                            'overlapping audio.'
                        ),
                    ),
                ),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'verbose_name': 'Chest announcer settings',
                'verbose_name_plural': 'Chest announcer settings',
            },
        ),
    ]

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0050_charity_logo_thumbnail'),
    ]

    operations = [
        migrations.CreateModel(
            name='CharitySocialLink',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('platform', models.CharField(
                    max_length=20,
                    choices=[
                        ('twitter', 'X / Twitter'),
                        ('facebook', 'Facebook'),
                        ('instagram', 'Instagram'),
                        ('youtube', 'YouTube'),
                        ('tiktok', 'TikTok'),
                        ('linkedin', 'LinkedIn'),
                        ('bluesky', 'Bluesky'),
                        ('threads', 'Threads'),
                        ('mastodon', 'Mastodon'),
                        ('twitch', 'Twitch'),
                        ('discord', 'Discord'),
                        ('reddit', 'Reddit'),
                        ('patreon', 'Patreon'),
                        ('other', 'Other'),
                    ],
                    help_text='Pick from the closed catalogue. Use `Other` for '
                              'platforms we have not enumerated yet.',
                )),
                ('url', models.URLField(
                    help_text='Full URL to the profile (the display layer renders '
                              'the icon + handle / label).',
                )),
                ('handle', models.CharField(
                    blank=True,
                    max_length=80,
                    help_text='Optional human-readable handle (e.g. "@specialeffect"). '
                              'When blank, the display layer derives a label from the '
                              'URL or platform name.',
                )),
                ('order', models.PositiveIntegerField(default=0)),
                ('charity', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='social_links',
                    to='api.charity',
                )),
            ],
            options={
                'ordering': ['charity', 'order', 'id'],
            },
        ),
    ]

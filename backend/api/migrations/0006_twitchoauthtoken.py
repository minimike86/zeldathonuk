from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0005_switch2_catalogue'),
    ]

    operations = [
        migrations.CreateModel(
            name='TwitchOAuthToken',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('access_token', models.CharField(blank=True, max_length=200)),
                ('refresh_token', models.CharField(blank=True, max_length=200)),
                (
                    'expires_at',
                    models.DateTimeField(
                        blank=True,
                        help_text='UTC instant the access_token stops working. Null = unknown (env-seeded).',
                        null=True,
                    ),
                ),
                ('scopes', models.CharField(blank=True, max_length=400)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'verbose_name': 'Twitch OAuth token',
                'verbose_name_plural': 'Twitch OAuth token',
            },
        ),
    ]

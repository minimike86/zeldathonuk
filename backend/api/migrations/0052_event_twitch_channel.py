from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0051_charity_social_links'),
    ]

    operations = [
        migrations.AddField(
            model_name='event',
            name='twitch_channel',
            field=models.CharField(
                blank=True,
                default='zeldathonuk',
                max_length=50,
                help_text='Twitch channel login name (the bit after twitch.tv/) used for the embedded stream, chat, and "Follow Us On Twitch" links. Lowercase, 4-25 chars per Twitch rules. Blank → consumers fall back to "zeldathonuk".',
            ),
        ),
    ]

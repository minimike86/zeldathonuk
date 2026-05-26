from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0009_nowplayingaudio_is_paused'),
    ]

    operations = [
        migrations.AddField(
            model_name='runner',
            name='profile_image_url',
            field=models.URLField(blank=True),
        ),
    ]

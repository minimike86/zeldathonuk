from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0046_trigger_subhead'),
    ]

    operations = [
        migrations.AddField(
            model_name='scheduleentrysoundtrigger',
            name='tag',
            field=models.CharField(
                blank=True,
                default='',
                max_length=64,
                help_text='Banner tag pill label (the gold chip on the left). Blank falls back to "NOW PLAYING" on the omnibar. Used to label the cue — e.g. "BREAK STARTING", "BIG MOMENT", etc.',
            ),
        ),
    ]

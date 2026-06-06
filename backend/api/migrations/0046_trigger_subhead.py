from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0045_schedule_entry_sound_triggers'),
    ]

    operations = [
        migrations.AddField(
            model_name='scheduleentrysoundtrigger',
            name='subhead',
            field=models.CharField(
                blank=True,
                default='',
                max_length=240,
                help_text='Optional smaller text shown beneath the headline on the celebration banner. Ignored when `show_banner` is false. Use for context like "Charity break · 15 min" under a "BREAK STARTING" headline.',
            ),
        ),
    ]

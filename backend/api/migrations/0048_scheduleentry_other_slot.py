from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0047_trigger_tag'),
    ]

    operations = [
        migrations.AlterField(
            model_name='scheduleentry',
            name='slot_type',
            field=models.CharField(
                choices=[
                    ('game', 'Game'),
                    ('start', 'Stream start'),
                    ('meal', 'Meal break'),
                    ('sleep', 'Sleep break'),
                    ('break', 'Break'),
                    ('end', 'Stream end'),
                    ('other', 'Other'),
                ],
                default='game',
                max_length=16,
            ),
        ),
    ]

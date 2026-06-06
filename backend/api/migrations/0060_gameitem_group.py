from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0059_gameobjective_scheduleentryobjective_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='gameitem',
            name='group',
            field=models.CharField(
                blank=True,
                help_text='Optional section label used to cluster items on the '
                          'control grid (e.g. "Equipment", "Dungeon Items", '
                          '"Songs"). Imported from the wiki gallery caption; '
                          'falls back to category when blank.',
                max_length=60,
            ),
        ),
    ]

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0043_chest_replay'),
    ]

    operations = [
        migrations.AddField(
            model_name='event',
            name='omnibar_transitions',
            field=models.JSONField(
                blank=True,
                default=dict,
                help_text='Per-panel omnibar transition config — enter direction, '
                          'exit direction, durations, delay-before-enter. Shape: '
                          '{ "default": { "enter": "left", "exit": "left", '
                          '"enterMs": 520, "exitMs": 480, "delayMs": 0 }, '
                          '"panels": { "<panel-id>": { ...overrides } } }. '
                          'Empty dict falls back to the defaults in '
                          'frontend/src/routes/obs/omnibar/hooks/useTransitionsConfig.ts.',
            ),
        ),
    ]

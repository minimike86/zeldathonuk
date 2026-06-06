from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0044_event_omnibar_transitions'),
    ]

    operations = [
        migrations.CreateModel(
            name='SoundAsset',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(help_text='Operator-facing label (e.g. "MM Clock Tower Bell").', max_length=120)),
                ('url', models.CharField(help_text='Absolute URL or site-relative path to the audio file.', max_length=500)),
                ('volume', models.FloatField(default=0.85, help_text='Playback volume, 0.0–1.0. Applied to every trigger using this asset.')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
            options={
                'ordering': ['name'],
            },
        ),
        migrations.CreateModel(
            name='ScheduleEntrySoundTrigger',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('anchor', models.CharField(choices=[('start', 'Entry start'), ('end', 'Entry end')], default='start', help_text="Whether `offset_seconds` counts from the entry's start or end ETA.", max_length=8)),
                ('offset_seconds', models.IntegerField(default=0, help_text='Signed seconds offset from the anchor. -30 fires 30s before the anchor, 0 fires at it, +120 fires two minutes after.')),
                ('message', models.CharField(blank=True, help_text='Banner headline shown when `show_banner` is true. Ignored otherwise.', max_length=240)),
                ('priority', models.SmallIntegerField(default=5, help_text='Priority on the created OmnibarOverride.')),
                ('duration_seconds', models.PositiveIntegerField(default=6, help_text='How long the override stays live, in seconds.')),
                ('show_banner', models.BooleanField(default=True, help_text='When false the omnibar plays the sound but skips the celebration banner takeover — useful for ambient cues like warning bells. The override row is still created for the audit trail.')),
                ('is_active', models.BooleanField(default=True)),
                ('last_fired_at', models.DateTimeField(blank=True, help_text='Stamped by the SSE evaluator when this trigger fires. Empty = eligible to fire. Cleared by the /api/schedule-entry-sound-triggers/reset/ action so a trigger can be re-armed for a re-run.', null=True)),
                ('schedule_entry', models.ForeignKey(on_delete=models.deletion.CASCADE, related_name='sound_triggers', to='api.scheduleentry')),
                ('sound', models.ForeignKey(help_text='Which sound from the library to play.', on_delete=models.deletion.PROTECT, to='api.soundasset')),
            ],
            options={
                'ordering': ['schedule_entry__order', 'anchor', 'offset_seconds'],
                'indexes': [models.Index(fields=['is_active', 'last_fired_at'], name='api_schedu_is_acti_idx')],
            },
        ),
    ]

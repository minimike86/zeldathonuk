from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0060_gameitem_group'),
    ]

    operations = [
        migrations.AddField(
            model_name='gameitem',
            name='link_group',
            field=models.CharField(
                blank=True,
                help_text='Optional family name tying related items together '
                          'within a section (e.g. "Sword", "Masks", "Adult '
                          'Trade"). Items sharing a link_group render in one '
                          'cluster.',
                max_length=60,
            ),
        ),
        migrations.AddField(
            model_name='gameitem',
            name='link_kind',
            field=models.CharField(
                blank=True,
                choices=[
                    ('upgrade', 'Upgrade chain'),
                    ('trade', 'Trade sequence'),
                    ('set', 'Related set'),
                ],
                help_text='How the link_group members relate: an ordered upgrade '
                          'chain, an ordered trade sequence, or an unordered '
                          'related set. Ordered kinds sequence by `order`.',
                max_length=10,
            ),
        ),
    ]

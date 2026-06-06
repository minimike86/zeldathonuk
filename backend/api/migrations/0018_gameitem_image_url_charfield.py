from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0017_donation_platform_profile'),
    ]

    operations = [
        migrations.AlterField(
            model_name='gameitem',
            name='image_url',
            field=models.CharField(
                blank=True,
                help_text=(
                    'Absolute URL or site-relative path '
                    '(e.g. /assets/img/game-items/oot/Master.png).'
                ),
                max_length=500,
            ),
        ),
    ]

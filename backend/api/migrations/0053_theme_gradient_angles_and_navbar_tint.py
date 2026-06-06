from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0052_event_twitch_channel'),
    ]

    operations = [
        migrations.AddField(
            model_name='themesettings',
            name='background_gradient_angle',
            field=models.IntegerField(
                default=180,
                help_text='Direction of the page background gradient in degrees (--theme-bg-angle). 0 = upward, 90 = right, 180 = downward (default), 270 = left.',
            ),
        ),
        migrations.AddField(
            model_name='themesettings',
            name='navbar_tint_color',
            field=models.CharField(
                default='#2b1b25',
                max_length=40,
                help_text='Top stop of the navbar overlay gradient (--theme-navbar-tint), painted over the background gradient to lift the navbar slightly. Accepts hex or rgba.',
            ),
        ),
        migrations.AddField(
            model_name='themesettings',
            name='button_gradient_angle',
            field=models.IntegerField(
                default=180,
                help_text='Direction of the primary button gradient in degrees (--theme-button-angle). 0 = upward, 90 = right, 180 = downward (default), 270 = left.',
            ),
        ),
    ]

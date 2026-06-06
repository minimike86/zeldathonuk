from django.db import migrations, models


HELP = {
    'logo_url': (
        'Hero / navbar wordmark. Falls back to bundled SVG when blank. '
        'Absolute URL or site-relative path (e.g. /assets/img/foo.svg).'
    ),
    'logo_small_url': (
        'Compact mark used in tight spaces (omnibar pill). '
        'Absolute URL or site-relative path.'
    ),
    'favicon_url': (
        'Browser tab icon. Blank = use the default favicon. '
        'Absolute URL or site-relative path.'
    ),
    'background_video_url': (
        'Optional looping background video for the page shell. When blank '
        'the gradient alone is shown. Absolute URL or site-relative path.'
    ),
    'background_image_url': (
        'Optional static background image used when no video is set. '
        'Absolute URL or site-relative path.'
    ),
}


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0027_theme_great_fairy'),
    ]

    operations = [
        migrations.AlterField(
            model_name='themesettings',
            name=name,
            field=models.CharField(blank=True, help_text=help_text, max_length=500),
        )
        for name, help_text in HELP.items()
    ]

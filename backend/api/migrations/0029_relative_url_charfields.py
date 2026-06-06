"""Convert remaining operator-set media URL fields from URLField to
CharField so site-relative paths (/assets/img/foo.svg) are accepted
alongside absolute URLs. Mirrors 0018 (GameItem.image_url) and 0028
(ThemeSettings media). URLField rejects anything without a scheme,
which broke the /control forms whenever an operator pasted a path
from /public/assets.
"""
from django.db import migrations, models


HELP = {
    'event__logo_url': (
        'Square-ish event logo (used in headers, overlays). '
        'Absolute URL or site-relative path.'
    ),
    'event__banner_url': (
        'Wide event poster/banner (used on landing, social cards). '
        'Absolute URL or site-relative path.'
    ),
    'event__gameblast_logo_url': (
        "SpecialEffect's current GameBlast campaign logo (e.g. GB22, "
        'GB23…). Surfaced in the OBS omnibar and ad-panel carousel. '
        'Refresh this each year when the campaign rebrands. '
        'Absolute URL or site-relative path.'
    ),
    'incentive__image_url': (
        'Reward / incentive artwork. Absolute URL or '
        'site-relative path (e.g. /assets/img/foo.svg).'
    ),
    'milestone__audio_url': (
        'Optional fanfare audio. The OBS browser source plays '
        'this once when the milestone is crossed. Absolute URL '
        'or site-relative path.'
    ),
}


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0028_theme_media_charfields'),
    ]

    operations = [
        migrations.AlterField(
            model_name=key.split('__')[0],
            name=key.split('__')[1],
            field=models.CharField(blank=True, help_text=help_text, max_length=500),
        )
        for key, help_text in HELP.items()
    ]

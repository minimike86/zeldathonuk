from django.db import migrations


GOLDEN_GODDESS = {
    'name': 'Golden Goddess',
    'is_active': False,

    # Palette — warm regal gold over a dark walnut bg. Primary is the
    # bright Triforce gold; secondary is a deep bronze that pairs cleanly
    # with the dark bg without muddying the highlight stops.
    'primary': '#f6c453',
    'primary_bright': '#ffe082',
    'secondary': '#8a5a1a',
    'background_from': '#2b1d0a',
    'background_to': '#100a04',
    'text_color': '#ffffff',
    'text_muted': 'rgba(255, 230, 180, 0.65)',
    'line_color': 'rgba(255, 196, 96, 0.45)',

    # Branding — bundled gold logo assets, no favicon override.
    'logo_url': '/assets/img/Zeldathon-Logo-2026-ClassicGold.svg',
    'logo_small_url': '/assets/img/Zeldathon-Logo-2026-Gold-Flash.svg',
    'favicon_url': '',

    # No background media — the dark walnut gradient + image hue rotate
    # are enough on their own. Streamers can wire one in later via
    # /control/theme if they want.
    'background_video_url': '',
    'background_image_url': '',

    # Button: dark walnut to bright gold, dark ink text for contrast on
    # the bright stop. Border is a translucent gold so the button reads
    # as a single warm element instead of fighting the palette.
    'button_gradient_from': '#5a3c0a',
    'button_gradient_to': '#f6c453',
    'button_text_color': '#1a1208',
    'button_border_color': 'rgba(255, 220, 130, 0.55)',
    'divider_thickness': 2,
    # Bloodmoon source images sit around -50°; +20° from sepia neutral
    # pulls decorative carousel photos into the warm gold register.
    'image_hue_rotate': 20,
    'link_color': '#ffe082',
    'link_hover_color': '#ffffff',

    'heading_font': "'Bungee', sans-serif",
    'body_font': "'Open Sans', sans-serif",
}


def add_golden_goddess(apps, schema_editor):
    Theme = apps.get_model('api', 'ThemeSettings')
    # Idempotent — re-running this migration after a manual rename should
    # not produce a duplicate row.
    Theme.objects.get_or_create(name=GOLDEN_GODDESS['name'], defaults=GOLDEN_GODDESS)


def remove_golden_goddess(apps, schema_editor):
    Theme = apps.get_model('api', 'ThemeSettings')
    Theme.objects.filter(name=GOLDEN_GODDESS['name'], is_active=False).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0023_event_gameblast_logo_url'),
    ]

    operations = [
        migrations.RunPython(add_golden_goddess, remove_golden_goddess),
    ]

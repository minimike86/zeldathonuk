from django.db import migrations


DEPTHS = {
    'name': 'Depths',
    'is_active': False,

    # Palette — the TotK underground: near-black sky shot through with
    # lightroot bioluminescence. Primary is the bright lightroot cyan
    # that punches against pure black; primary_bright is the cool-white
    # glow tip; secondary is a deep teal that sits between the accent
    # and the void without going muddy on radial gradients.
    'primary': '#5ce0e6',
    'primary_bright': '#a8f5f8',
    'secondary': '#1a4a52',
    'background_from': '#040a0d',
    'background_to': '#000000',
    'text_color': '#e6fbfd',
    'text_muted': 'rgba(168, 245, 248, 0.6)',
    'line_color': 'rgba(92, 224, 230, 0.35)',

    # Branding — no dedicated Depths mark yet; the white wordmark reads
    # cleanest against the near-black bg. Swap when one ships.
    'logo_url': '/assets/img/Zeldathon-Logo-WW-white.svg',
    'logo_small_url': '/assets/img/Zeldathon-Logo-WW-white.svg',
    'favicon_url': '',

    # No background media — the lightroot palette + extreme dark
    # carry the atmosphere on their own. Streamers can attach an
    # ambient Depths loop via /control/theme if they want.
    'background_video_url': '',
    'background_image_url': '',

    # Button: void-black stop into glowing cyan, dark-ink text on the
    # bright stop. Border is a translucent lightroot cyan so the
    # button reads as a single glowing relic rather than fighting the
    # palette.
    'button_gradient_from': '#0a1f24',
    'button_gradient_to': '#5ce0e6',
    'button_text_color': '#02161a',
    'button_border_color': 'rgba(168, 245, 248, 0.55)',
    'divider_thickness': 2,
    # Bloodmoon source images sit around -50° (red-magenta family).
    # Pushing +180° flips them across the colour wheel into the
    # cyan-teal register that matches the lightroot accent — keeps
    # decorative carousel photos coherent with the chrome instead of
    # leaving them stranded in pink.
    'image_hue_rotate': 180,
    'link_color': '#a8f5f8',
    'link_hover_color': '#ffffff',

    'heading_font': "'Bungee', sans-serif",
    'body_font': "'Open Sans', sans-serif",
}


def add_depths(apps, schema_editor):
    Theme = apps.get_model('api', 'ThemeSettings')
    # Idempotent — get_or_create so re-running this migration after a
    # manual rename doesn't produce a duplicate row.
    Theme.objects.get_or_create(name=DEPTHS['name'], defaults=DEPTHS)


def remove_depths(apps, schema_editor):
    Theme = apps.get_model('api', 'ThemeSettings')
    # Only drop the seed when it's inactive — never delete a theme the
    # operator has switched the site over to.
    Theme.objects.filter(name=DEPTHS['name'], is_active=False).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0029_relative_url_charfields'),
    ]

    operations = [
        migrations.RunPython(add_depths, remove_depths),
    ]

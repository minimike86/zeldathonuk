from django.db import migrations


GREAT_FAIRY = {
    'name': 'Great Fairy',
    'is_active': False,

    # Palette — hot magenta-pink over a deep plum bg, evoking the Great
    # Fairy fountain glow. Primary is the bright fountain magenta;
    # primary_bright lifts toward bubblegum so highlights/glows pop;
    # secondary drops to a deep mulberry that anchors the palette
    # without going muddy on radial gradients.
    'primary': '#ff2d96',
    'primary_bright': '#ff8ec9',
    'secondary': '#8a1a5e',
    'background_from': '#2a0a20',
    'background_to': '#100408',
    'text_color': '#ffffff',
    'text_muted': 'rgba(255, 200, 230, 0.65)',
    'line_color': 'rgba(255, 130, 200, 0.45)',

    # Branding — Bloodmoon SVG is the closest tonal match in the bundled
    # set (no dedicated Great Fairy mark yet). Swap when one ships.
    'logo_url': '/assets/img/Zeldathon-Logo-2026-Bloodmoon.svg',
    'logo_small_url': '/assets/img/Zeldathon-Logo-2026-Bloodmoon.svg',
    'favicon_url': '',

    # No background media — the plum gradient + hue-rotated decorative
    # images carry the look. Streamers can attach a video/still via
    # /control/theme if they want a fairy-fountain loop later.
    'background_video_url': '',
    'background_image_url': '',

    # Button: dark plum stop into hot magenta, white text. Border is a
    # translucent magenta so the button reads as one glowing chip
    # rather than competing with the bg accent.
    'button_gradient_from': '#3d0e2c',
    'button_gradient_to': '#ff2d96',
    'button_text_color': '#ffffff',
    'button_border_color': 'rgba(255, 180, 220, 0.55)',
    'divider_thickness': 2,
    # Bloodmoon source images sit around -50° (toward red). Shifting
    # +30° from there nudges decorative carousel images into the
    # magenta/pink register without flattening them.
    'image_hue_rotate': -20,
    'link_color': '#ffb3d9',
    'link_hover_color': '#ffffff',

    'heading_font': "'Bungee', sans-serif",
    'body_font': "'Open Sans', sans-serif",
}


def add_great_fairy(apps, schema_editor):
    Theme = apps.get_model('api', 'ThemeSettings')
    # Idempotent — get_or_create so re-running the migration after a
    # manual rename doesn't produce a duplicate row.
    Theme.objects.get_or_create(name=GREAT_FAIRY['name'], defaults=GREAT_FAIRY)


def remove_great_fairy(apps, schema_editor):
    Theme = apps.get_model('api', 'ThemeSettings')
    # Only drop the seed when it's inactive — never delete a theme the
    # operator has switched the site over to.
    Theme.objects.filter(name=GREAT_FAIRY['name'], is_active=False).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0026_override_target_lane'),
    ]

    operations = [
        migrations.RunPython(add_great_fairy, remove_great_fairy),
    ]

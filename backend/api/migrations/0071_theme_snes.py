from django.db import migrations


# Super Nintendo (JP/PAL) controller theme — flat light-grey console
# body for the page, dark deep-purple stamp for chrome / type, and the
# four iconic face-button colours as accents. D-pad purple is the
# brand-leading hue so buttons read as the controller's directional
# cluster rather than any single face button.
SNES = {
    'name': 'Super Nintendo',
    'is_active': False,

    # Palette — D-pad purple drives accents, deep purple-grey anchors
    # chrome, light grey is the controller body. primary_bright lifts
    # purple toward lavender for hover/glow.
    'primary': '#5a3c92',
    'primary_bright': '#7d5fb5',
    'secondary': '#2a2733',
    # Solid controller-body grey — both stops match so the page is
    # one flat field, no gradient seam.
    'background_from': '#d6d2cb',
    'background_to': '#d6d2cb',
    'background_gradient_angle': 180,
    # Navbar tint = deep purple-grey at 85% so the top chrome reads
    # as the controller's darker bezel band.
    'navbar_tint_color': 'rgba(42, 39, 51, 0.85)',
    # Dark purple-grey type on light grey body — the SNES type
    # contrast on the moulded plastic.
    'text_color': '#2a2733',
    'text_muted': 'rgba(42, 39, 51, 0.65)',
    'line_color': 'rgba(42, 39, 51, 0.3)',

    # Branding — bundled SNES wordmark sits at /public/assets/img/
    # brand/logo. Same file for the compact slot until a small mark
    # exists; the editor can override per-deployment.
    'logo_url': '/assets/img/brand/logo/Zeldathon-2026-SNES.svg',
    'logo_small_url': '/assets/img/brand/logo/Zeldathon-2026-SNES.svg',
    'favicon_url': '',

    # No background media — the flat plastic plate carries the look.
    'background_video_url': '',
    'background_image_url': '',

    # Button: D-pad purple into lavender, white type, deep purple-grey
    # border. Reads as a pressed Start/Select stamp on the controller.
    'button_gradient_from': '#5a3c92',
    'button_gradient_to': '#7d5fb5',
    'button_gradient_angle': 180,
    'button_text_color': '#ffffff',
    'button_border_color': 'rgba(42, 39, 51, 0.6)',
    'divider_thickness': 2,
    # Slight purple-ward shift for decorative imagery so press photos
    # tilt into the SNES register without going magenta.
    'image_hue_rotate': 25,
    # Links: D-pad purple at rest, B-button blue on hover so the
    # interaction echoes the four-colour face cluster.
    'link_color': '#5a3c92',
    'link_hover_color': '#5b6dc6',

    'heading_font': "'Bungee', sans-serif",
    'body_font': "'Open Sans', sans-serif",
}


def upsert_snes(apps, schema_editor):
    Theme = apps.get_model('api', 'ThemeSettings')
    # update_or_create so a manually-created "Super Nintendo" theme
    # picks up corrections without losing its primary key.
    Theme.objects.update_or_create(
        name=SNES['name'], defaults=SNES,
    )


def remove_snes(apps, schema_editor):
    Theme = apps.get_model('api', 'ThemeSettings')
    # Only drop the seed when it's inactive — never delete a theme the
    # operator has switched the site over to.
    Theme.objects.filter(name=SNES['name'], is_active=False).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0070_theme_gameboy'),
    ]

    operations = [
        migrations.RunPython(upsert_snes, remove_snes),
    ]

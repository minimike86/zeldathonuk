from django.db import migrations


# Retro Game Boy LCD theme — flat olive-green plate, dark stamped UI on
# top. The three hand-picked colours below come from the bundled
# GameBoy wordmark so brand chrome and the logo agree pixel-for-pixel.
GAMEBOY = {
    'name': 'Retro Game Boy',
    'is_active': False,

    # Palette — mid + light olive from the wordmark drive accents, the
    # dark stamp colour anchors solid UI. Primary is the mid olive so
    # buttons / chips read as the screen bezel rather than the LCD
    # ground; primary_bright lifts to the light olive for hover.
    'primary': '#4d533c',
    'primary_bright': '#8b956d',
    'secondary': '#1f1f1f',
    # Solid LCD plate — both stops the same so the page is one flat
    # field of Game-Boy green, no gradient bleed at the seam.
    'background_from': '#c4cfa1',
    'background_to': '#c4cfa1',
    'background_gradient_angle': 180,
    # Navbar tint = dark stamp at 85% so the top chrome reads as the
    # Game Boy's plastic bezel above the LCD.
    'navbar_tint_color': 'rgba(31, 31, 31, 0.85)',
    # Dark stamp on green LCD — the original Game Boy contrast.
    'text_color': '#1f1f1f',
    'text_muted': 'rgba(31, 31, 31, 0.65)',
    'line_color': 'rgba(31, 31, 31, 0.35)',

    # Branding — bundled pixel-style wordmarks. The "Pocket" variant
    # for the compact slot keeps the small mark legible.
    'logo_url': '/assets/img/brand/logo/Zeldathon-2026-Pixel-GameBoy-transparent.svg',
    'logo_small_url': '/assets/img/brand/logo/Zeldathon-2026-Pixel-GameBoyPocket-transparent.svg',
    'favicon_url': '',

    # No background media — the flat LCD plate is the whole point.
    'background_video_url': '',
    'background_image_url': '',

    # Button: dark stamp into mid olive, light-olive border so the
    # button reads as a stamped key on the Game Boy face.
    'button_gradient_from': '#1f1f1f',
    'button_gradient_to': '#4d533c',
    'button_gradient_angle': 180,
    'button_text_color': '#c4cfa1',
    'button_border_color': 'rgba(31, 31, 31, 0.7)',
    'divider_thickness': 2,
    # Decorative imagery shifts into the olive register so press
    # photos match the LCD palette rather than fighting it.
    'image_hue_rotate': 60,
    'link_color': '#1f1f1f',
    'link_hover_color': '#4d533c',

    'heading_font': "'Bungee', sans-serif",
    'body_font': "'Open Sans', sans-serif",
}


def upsert_gameboy(apps, schema_editor):
    Theme = apps.get_model('api', 'ThemeSettings')
    # update_or_create so a manually-created "Retro Game Boy" theme
    # picks up corrections without losing its primary key.
    Theme.objects.update_or_create(
        name=GAMEBOY['name'], defaults=GAMEBOY,
    )


def remove_gameboy(apps, schema_editor):
    Theme = apps.get_model('api', 'ThemeSettings')
    # Only drop the seed when it's inactive — never delete a theme the
    # operator has switched the site over to.
    Theme.objects.filter(name=GAMEBOY['name'], is_active=False).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0069_alter_gameitem_unique_together'),
    ]

    operations = [
        migrations.RunPython(upsert_gameboy, remove_gameboy),
    ]

from django.db import migrations


WIND_WAKER = {
    'name': 'Wind Waker',
    'is_active': False,

    # Palette — sky cyan + ocean teal under a King-of-Red-Lions sail
    # accent. Primary is the sail red so brand chips/links pop against
    # the blue-green ground; primary_bright lifts toward coral for
    # hover/glow, secondary drops to a deep ocean teal that anchors
    # the palette and keeps darker UI surfaces (modal headers etc.)
    # from going muddy against the bright sky-blue background.
    'primary': '#d94a2d',
    'primary_bright': '#ff7a52',
    'secondary': '#0a4b6e',
    'background_from': '#5fb6c8',
    'background_to': '#0d2a3d',
    # Slight upward tilt so the gradient feels like a horizon — the
    # bright sky stays at the top of the viewport and the ocean
    # darkens toward the bottom. 180° is the default but we restate
    # it here so future tweaks live alongside the rest of the palette.
    'background_gradient_angle': 180,
    # Navbar overlay tint — a slightly deeper teal than `secondary`
    # so the chrome reads as the ship's hull sitting above the sea.
    'navbar_tint_color': 'rgba(8, 50, 75, 0.85)',
    'text_color': '#ffffff',
    # Lifted off the default 0.6α so cream-coloured copy reads as
    # parchment over the bright background instead of washing out.
    'text_muted': 'rgba(230, 245, 255, 0.7)',
    # Sea-foam-ish translucent border — replaces the leftover
    # bloodmoon red that was previously bleeding through on
    # `.schedule-hero-kpi` and other line-driven surfaces.
    'line_color': 'rgba(150, 220, 235, 0.45)',

    # Branding — bundled Wind Waker wordmark sits at /public/assets/
    # img/brand/logo. White variant for the small/compact slot since
    # it reads better against the deep-ocean navbar tint.
    'logo_url': '/assets/img/brand/logo/Zeldathon-Logo-WW.svg',
    'logo_small_url': '/assets/img/brand/logo/Zeldathon-Logo-WW-white.svg',
    'favicon_url': '',

    # No background media by default — the cel-shaded gradient carries
    # the look on its own. Streamers can attach a looping water/sky
    # video via /control/theme if they want one.
    'background_video_url': '',
    'background_image_url': '',

    # Button: deep sail crimson into bright sail coral, cream border.
    # Reads as a wax-sealed scroll button against the sea background.
    'button_gradient_from': '#9a2818',
    'button_gradient_to': '#e87544',
    'button_gradient_angle': 180,
    'button_text_color': '#ffffff',
    'button_border_color': 'rgba(255, 220, 170, 0.6)',
    'divider_thickness': 2,
    # Decorative carousel imagery shifts to the cyan/teal register
    # so press photos lean into the Great Sea palette rather than
    # the default bloodmoon red. +160° from neutral lands solidly in
    # cool blues without going purple.
    'image_hue_rotate': 160,
    'link_color': '#ffb98a',
    'link_hover_color': '#ffffff',

    'heading_font': "'Bungee', sans-serif",
    'body_font': "'Open Sans', sans-serif",
}


def upsert_wind_waker(apps, schema_editor):
    Theme = apps.get_model('api', 'ThemeSettings')
    # update_or_create so a manually-created "Wind Waker" theme picks
    # up the corrected palette + new fields (gradient angles, navbar
    # tint) without losing its primary key, while a fresh install
    # still gets the seed.
    Theme.objects.update_or_create(
        name=WIND_WAKER['name'], defaults=WIND_WAKER,
    )


def remove_wind_waker(apps, schema_editor):
    Theme = apps.get_model('api', 'ThemeSettings')
    # Only drop the seed when it's inactive — never delete a theme the
    # operator has switched the site over to.
    Theme.objects.filter(name=WIND_WAKER['name'], is_active=False).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0053_theme_gradient_angles_and_navbar_tint'),
    ]

    operations = [
        migrations.RunPython(upsert_wind_waker, remove_wind_waker),
    ]

from django.db import migrations


# Correction to 0071_theme_snes — the original seed used the North-
# American SNES purple action-button palette by mistake. PAL/JP Super
# Famicom controllers have four coloured face buttons (green / blue /
# red / yellow) on the same light-grey body, with a dark-grey D-pad
# and bezel. This migration re-seeds with blue as the lead UI accent
# (the X button), red as link-hover (A), green on the divider line,
# and yellow trim on the button border so all four PAL colours read
# somewhere in the chrome without fighting each other.
SNES_PAL = {
    'name': 'Super Nintendo',
    'is_active': False,

    # Palette — PAL X-button blue drives accents, deep neutral
    # anchors chrome, controller-body grey fills the background.
    'primary': '#5b6dc6',
    'primary_bright': '#8898db',
    'secondary': '#2a2733',
    'background_from': '#d6d2cb',
    'background_to': '#d6d2cb',
    'background_gradient_angle': 180,
    'navbar_tint_color': 'rgba(42, 39, 51, 0.85)',
    'text_color': '#2a2733',
    'text_muted': 'rgba(42, 39, 51, 0.65)',
    # Y-button green tinted line so the divider hints at the second
    # PAL face colour without dominating.
    'line_color': 'rgba(79, 156, 79, 0.45)',

    # Branding — bundled SNES wordmark.
    'logo_url': '/assets/img/brand/logo/Zeldathon-2026-SNES.svg',
    'logo_small_url': '/assets/img/brand/logo/Zeldathon-2026-SNES.svg',
    'favicon_url': '',

    'background_video_url': '',
    'background_image_url': '',

    # Buttons: X-blue base → lifted blue, B-yellow trim border so the
    # CTA reads as a moulded SNES face button stamped on the chassis.
    'button_gradient_from': '#3848a5',
    'button_gradient_to': '#5b6dc6',
    'button_gradient_angle': 180,
    'button_text_color': '#ffffff',
    'button_border_color': 'rgba(221, 194, 77, 0.7)',
    'divider_thickness': 2,
    # Push decorative imagery toward blue so press photos sit in the
    # PAL register rather than fighting it.
    'image_hue_rotate': 200,
    # Links at rest = X-button blue, hover = A-button red so all four
    # PAL face colours show up somewhere in the chrome.
    'link_color': '#3848a5',
    'link_hover_color': '#d24d4d',

    'heading_font': "'Bungee', sans-serif",
    'body_font': "'Open Sans', sans-serif",
}


def upsert_snes_pal(apps, schema_editor):
    Theme = apps.get_model('api', 'ThemeSettings')
    # update_or_create against the same name as 0071 so the seed is
    # corrected in place without losing the row's primary key — any
    # operator that has already activated "Super Nintendo" sees the
    # corrected palette without re-activating.
    Theme.objects.update_or_create(
        name=SNES_PAL['name'], defaults=SNES_PAL,
    )


def revert_snes_pal(apps, schema_editor):
    # No-op reverse — going backwards would mean re-applying the wrong
    # US-purple seed from 0071, which is what we're trying to fix. The
    # previous migration's own forward still runs in a clean rebuild
    # before this one, so a fresh DB still lands on the corrected
    # palette via update_or_create.
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0071_theme_snes'),
    ]

    operations = [
        migrations.RunPython(upsert_snes_pal, revert_snes_pal),
    ]

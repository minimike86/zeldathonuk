from django.db import migrations


# Opts the "Super Nintendo" theme into the new multi-colour palette
# fields introduced in 0073. The base palette from 0072 stays — this
# migration only fills in the new slots so the PAL theme:
#   • surfaces all four face-button colours (accents 1/2/3 + the blue
#     primary) across UI status / badge slots,
#   • renders control cards as off-white "SNES plastic" surfaces with
#     dark text rather than the bloodmoon-era semi-transparent black,
#   • locks the omnibar to the theme: light controller-body lane fill,
#     blue tag-pill accent (X button), and yellow ticker stripe (B).
SNES_OPT_INS = {
    # Y / A / B buttons in that order (X drives `primary` already).
    'accent_1': '#4f9c4f',   # Y-button green — success / positive register
    'accent_2': '#ddc24d',   # B-button yellow — warning / caution register
    'accent_3': '#d24d4d',   # A-button red    — danger / attention register

    # Off-white card surface evoking the SNES moulded plastic, with
    # the theme's deep purple-grey for text and the X-button blue as
    # the card edge so cards read as bordered plates on the body.
    'surface_color':        '#f1ede5',
    'surface_text_color':   '#2a2733',
    'surface_border_color': 'rgba(56, 72, 165, 0.55)',

    # Omnibar lane = controller-body grey (matches the page bg so the
    # broadcast layer reads as one continuous chassis); tag pill
    # accent = X-blue; ticker accent = B-yellow.
    'omnibar_lane_bg':       '#d6d2cb',
    'omnibar_tag_color':     '#3848a5',
    'omnibar_ticker_accent': '#ddc24d',
}


def opt_in_snes(apps, schema_editor):
    Theme = apps.get_model('api', 'ThemeSettings')
    # Update in place by name. Skip silently if the SNES seed isn't
    # present (e.g. someone deleted it) — no need to recreate the
    # whole theme here; that's 0072's job.
    Theme.objects.filter(name='Super Nintendo').update(**SNES_OPT_INS)


def opt_out_snes(apps, schema_editor):
    Theme = apps.get_model('api', 'ThemeSettings')
    # Reverse: blank the new fields back out so the theme rendered
    # exactly as it did after 0072 ran on its own.
    Theme.objects.filter(name='Super Nintendo').update(
        accent_1='', accent_2='', accent_3='',
        surface_color='rgba(0, 0, 0, 0.35)',
        surface_text_color='', surface_border_color='',
        omnibar_lane_bg='', omnibar_tag_color='', omnibar_ticker_accent='',
    )


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0073_theme_multicolor_palette'),
    ]

    operations = [
        migrations.RunPython(opt_in_snes, opt_out_snes),
    ]

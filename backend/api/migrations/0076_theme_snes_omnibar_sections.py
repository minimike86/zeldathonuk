from django.db import migrations


# Opt the "Super Nintendo" theme into per-section omnibar gradients
# (added in 0075). Picks one of the four PAL face-button colours per
# section so the broadcast bar surfaces the whole palette across its
# layout rather than one global tag colour:
#
#   • Brand / logo pill (left)  → X-button blue (the SNES system blue)
#   • Top lane tag              → A-button red    (game-state register)
#   • Bottom lane tag           → Y-button green  (donation / charity /
#                                                  schedule register)
#   • Right total cluster       → B-button yellow (money on-screen)
#
# Each gradient runs deeper-shade → brighter-shade top-to-bottom so
# the lit-pill look (top sheen + bottom shoulder) reads correctly.
SNES_OMNIBAR_SECTIONS = {
    # Brand (logo pill) — X-button blue.
    'omnibar_brand_from':       '#5b6dc6',
    'omnibar_brand_to':         '#3848a5',
    # Top lane — A-button red. The top lane carries game-state panels
    # (current game / objective / items / setpiece), red reads as the
    # "primary status" register.
    'omnibar_top_tag_from':     '#e36b66',
    'omnibar_top_tag_to':       '#b1322c',
    # Bottom lane — Y-button green. The bottom lane carries donation
    # reel, charity info, schedule, etc.; green reads as the "money /
    # supporting context" register.
    'omnibar_bottom_tag_from':  '#6dc26d',
    'omnibar_bottom_tag_to':    '#3d7d3d',
    # Right total cluster — B-button yellow. The big running-total
    # readout + charity logos paint in the "money on-screen" yellow so
    # the right cluster stands apart from the lanes.
    'omnibar_total_from':       '#e8d164',
    'omnibar_total_to':         '#b89530',
}


def opt_in_snes_sections(apps, schema_editor):
    Theme = apps.get_model('api', 'ThemeSettings')
    Theme.objects.filter(name='Super Nintendo').update(**SNES_OMNIBAR_SECTIONS)


def opt_out_snes_sections(apps, schema_editor):
    Theme = apps.get_model('api', 'ThemeSettings')
    # Reverse — blank the new section fields so the SNES theme reverts
    # to the pre-0075 behaviour of using `omnibar_tag_color` for every
    # section.
    Theme.objects.filter(name='Super Nintendo').update(
        omnibar_brand_from='', omnibar_brand_to='',
        omnibar_top_tag_from='', omnibar_top_tag_to='',
        omnibar_bottom_tag_from='', omnibar_bottom_tag_to='',
        omnibar_total_from='', omnibar_total_to='',
    )


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0075_theme_omnibar_section_gradients'),
    ]

    operations = [
        migrations.RunPython(opt_in_snes_sections, opt_out_snes_sections),
    ]

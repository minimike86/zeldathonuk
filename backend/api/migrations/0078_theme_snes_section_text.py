from django.db import migrations


# Per-section text colours for the SNES theme. The four section
# gradients seeded in 0076 each get a matching text colour that
# contrasts properly:
#   • Brand (blue)       → white  — high contrast on deep blue
#   • Top tag (red)      → white  — high contrast on deep red
#   • Bottom tag (green) → white  — high contrast on mid green
#   • Total (yellow)     → near-black — white on yellow is unreadable;
#                                       a dark stamp is the SNES type
#                                       contrast on B-button yellow.
SNES_TEXT = {
    'omnibar_brand_text':      '#ffffff',
    'omnibar_top_tag_text':    '#ffffff',
    'omnibar_bottom_tag_text': '#ffffff',
    'omnibar_total_text':      '#2a2733',
}


def opt_in_snes_text(apps, schema_editor):
    Theme = apps.get_model('api', 'ThemeSettings')
    Theme.objects.filter(name='Super Nintendo').update(**SNES_TEXT)


def opt_out_snes_text(apps, schema_editor):
    Theme = apps.get_model('api', 'ThemeSettings')
    Theme.objects.filter(name='Super Nintendo').update(
        omnibar_brand_text='', omnibar_top_tag_text='',
        omnibar_bottom_tag_text='', omnibar_total_text='',
    )


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0077_theme_omnibar_section_text'),
    ]

    operations = [
        migrations.RunPython(opt_in_snes_text, opt_out_snes_text),
    ]

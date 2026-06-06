from django.db import migrations


# Split tag-text vs lane-body-text for SNES.
#
# Tag pills sit ON the per-section gradient (top = red, bottom =
# green) — white reads cleanly on both. Those stay at white from 0078.
#
# Lane body content sits on the lane background, which on SNES is the
# light controller-body grey (`omnibar_lane_bg = #d6d2cb`). White
# panel copy on light grey is unreadable; the body needs the SNES
# deep purple-grey (`#2a2733`) so it matches the page text register.
SNES_LANE_BODY = {
    'omnibar_top_lane_text':    '#2a2733',
    'omnibar_bottom_lane_text': '#2a2733',
}


def opt_in(apps, schema_editor):
    Theme = apps.get_model('api', 'ThemeSettings')
    Theme.objects.filter(name='Super Nintendo').update(**SNES_LANE_BODY)


def opt_out(apps, schema_editor):
    Theme = apps.get_model('api', 'ThemeSettings')
    Theme.objects.filter(name='Super Nintendo').update(
        omnibar_top_lane_text='', omnibar_bottom_lane_text='',
    )


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0079_theme_omnibar_lane_body_text'),
    ]

    operations = [
        migrations.RunPython(opt_in, opt_out),
    ]

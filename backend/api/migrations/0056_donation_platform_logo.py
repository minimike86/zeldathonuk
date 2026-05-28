from django.db import migrations, models


# Site-relative logo paths for the platforms that ship an asset under
# /public/assets/img/fundraising-platforms/. Square-ish marks chosen so they
# sit well in the picker's 56×56 icon box. Other platforms (twitch, paypal,
# direct, other) keep the built-in FontAwesome glyph by leaving logo_url blank.
PLATFORM_LOGOS = {
    'tiltify': '/assets/img/fundraising-platforms/tiltify/Tiltify_Logo.png',
    'justgiving': '/assets/img/fundraising-platforms/justgiving/justgiving-g.svg',
    'facebook': '/assets/img/fundraising-platforms/facebook/thumb_icon_header_image_05_2018.png',
}


def seed_logos(apps, schema_editor):
    Profile = apps.get_model('api', 'DonationPlatformProfile')
    for platform, logo_url in PLATFORM_LOGOS.items():
        Profile.objects.update_or_create(
            platform=platform,
            defaults={'logo_url': logo_url},
        )


def clear_logos(apps, schema_editor):
    Profile = apps.get_model('api', 'DonationPlatformProfile')
    Profile.objects.filter(platform__in=PLATFORM_LOGOS).update(logo_url='')


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0055_seed_specialeffect_impact_tiers'),
    ]

    operations = [
        migrations.AddField(
            model_name='donationplatformprofile',
            name='logo_url',
            field=models.CharField(
                blank=True,
                help_text='Platform logo shown in the donation picker (e.g. '
                          '/assets/img/fundraising-platforms/tiltify/Tiltify_Logo.png). '
                          'Absolute URL or site-relative path. Blank → the picker '
                          'falls back to the built-in FontAwesome glyph.',
                max_length=500,
            ),
        ),
        migrations.RunPython(seed_logos, clear_logos),
    ]

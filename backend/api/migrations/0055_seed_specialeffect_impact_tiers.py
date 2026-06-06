"""Backfill the legacy "What could your donation do?" rows.

These tiers previously lived as a hardcoded `benefitRows` array in the
frontend /donations page. Now that the page reads them from
`CharityImpactTier`, seed the original SpecialEffect ladder so existing
and fresh databases keep the content.

Guarded twice so it never clobbers curated data:
  * only runs if a charity with slug "specialeffect" exists, and
  * only seeds if that charity has no impact tiers yet.
"""

from django.db import migrations

CHARITY_SLUG = 'specialeffect'

# (amount, image_url, alt_text, description, description_html)
TIERS = [
    (
        '5.00',
        '/assets/img/donation-items/xbox-controller-technology-games-design_dezeen_2364_col_23_1_-removebg-preview.png',
        'Flexible Fixings',
        'Can buy flexible fixings to enable a correct and firm hold of '
        'controller, joystick or button for safe and comfortable use.',
        '',
    ),
    (
        '10.00',
        '/assets/img/donation-items/infinity4ps-thumbstick-heights-removebg-preview.png',
        'Joystick Extensions',
        'Could purchase joystick extensions, to potentially enable greater '
        'control of a thumbstick, with its increased leverage.',
        '',
    ),
    (
        '25.00',
        '/assets/img/donation-items/sasha_setup-e1628153142123-removebg-preview.png',
        'Deliver Adaptive Gaming Setup',
        'Will enable us to deliver an adapted gaming setup quickly and '
        'directly to someone who needs it.',
        '',
    ),
    (
        '50.00',
        '/assets/img/donation-items/2_ALT_MiniJoystick-min-removebg-preview.png',
        'Low Force Joysticks',
        'Will buy a gamepad to be modified in the workshop with low force '
        'joysticks and buttons for a gamer with weak hand muscles to use.',
        '',
    ),
    (
        '75.00',
        '/assets/img/donation-items/3f2cd0bf-3b0e-402d-9c59-a8fdbd73ff47.png',
        'Xbox Adaptive Controller',
        'Will buy an interface box like an Xbox Adaptive Controller for use '
        'as part of a gaming setup.',
        'Will buy an interface box like an <a class="text-danger" '
        'href="https://www.xbox.com/en-GB/accessories/controllers/'
        'xbox-adaptive-controller" target="_blank" rel="noreferrer">'
        'Xbox Adaptive Controller</a> for use as part of a gaming setup.',
    ),
    (
        '100.00',
        '/assets/img/donation-items/monstertech_table_mount_warthog_joystick_hero_1_-removebg-preview.png',
        'Mounting System',
        'Can enable us to buy a mounting system which will hold a joystick '
        'and position it for optimum use by a gamer to control it.',
        '',
    ),
    (
        '200.00',
        '/assets/img/donation-items/img_01-removebg-preview.png',
        'Single Handed Controller',
        'Could buy a single handed controller to enable a disabled gamer to '
        'play with just one hand.',
        '',
    ),
]


def seed_tiers(apps, schema_editor):
    Charity = apps.get_model('api', 'Charity')
    CharityImpactTier = apps.get_model('api', 'CharityImpactTier')

    charity = Charity.objects.filter(slug=CHARITY_SLUG).first()
    if charity is None:
        return
    if charity.impact_tiers.exists():
        return

    CharityImpactTier.objects.bulk_create(
        [
            CharityImpactTier(
                charity=charity,
                amount=amount,
                currency='GBP',
                image_url=image_url,
                alt_text=alt_text,
                description=description,
                description_html=description_html,
                order=order,
            )
            for order, (
                amount,
                image_url,
                alt_text,
                description,
                description_html,
            ) in enumerate(TIERS)
        ]
    )


def unseed_tiers(apps, schema_editor):
    Charity = apps.get_model('api', 'Charity')
    CharityImpactTier = apps.get_model('api', 'CharityImpactTier')

    charity = Charity.objects.filter(slug=CHARITY_SLUG).first()
    if charity is None:
        return
    CharityImpactTier.objects.filter(
        charity=charity, amount__in=[t[0] for t in TIERS]
    ).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0054_theme_wind_waker'),
    ]

    operations = [
        migrations.RunPython(seed_tiers, unseed_tiers),
    ]

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0048_scheduleentry_other_slot'),
    ]

    operations = [
        migrations.CreateModel(
            name='Charity',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('slug', models.SlugField(
                    max_length=80,
                    unique=True,
                    help_text='URL-safe key (e.g. "specialeffect"). Used in API paths '
                              'and as a stable handle when seeding events.',
                )),
                ('name', models.CharField(max_length=200, unique=True)),
                ('short_name', models.CharField(
                    blank=True,
                    max_length=80,
                    help_text='Compact display label for tight UI (omnibar pills, '
                              'mobile cards). Falls back to `name` when blank.',
                )),
                ('charity_number', models.CharField(
                    blank=True,
                    max_length=40,
                    help_text='Registered charity number (e.g. UK Charity Commission '
                              'number). Free-text — different jurisdictions use '
                              'different formats.',
                )),
                ('mission_statement', models.TextField(
                    blank=True,
                    help_text='Short paragraph summarising what the charity does. '
                              'Surfaced on the public /charity page and on the '
                              '/donations side panel.',
                )),
                ('logo_url', models.CharField(
                    blank=True,
                    max_length=500,
                    help_text='Square-ish charity logo. Absolute URL or '
                              'site-relative path.',
                )),
                ('banner_url', models.CharField(
                    blank=True,
                    max_length=500,
                    help_text='Wide hero/banner image used on the /charity page and '
                              'in promotional content. Absolute URL or site-relative '
                              'path.',
                )),
                ('primary_website_url', models.URLField(
                    blank=True,
                    help_text='Main charity website. Additional sites (campaign '
                              'microsites, GameBlast page, etc.) go in '
                              'CharityWebsite rows.',
                )),
                ('help_cta_headline', models.CharField(
                    blank=True,
                    max_length=120,
                    help_text='Headline for the "how can the charity help you?" CTA. '
                              'e.g. "Need help adapting your gaming setup?".',
                )),
                ('help_cta_body', models.TextField(
                    blank=True,
                    help_text='Body copy under the help CTA headline.',
                )),
                ('help_cta_url', models.URLField(
                    blank=True,
                    help_text='Where the help CTA button links to (assessment form, '
                              'support page).',
                )),
                ('donate_cta_headline', models.CharField(
                    blank=True,
                    max_length=120,
                    help_text='Headline for the "make a donation" CTA. e.g. '
                              '"Every penny helps disabled gamers play".',
                )),
                ('donate_cta_body', models.TextField(
                    blank=True,
                    help_text='Body copy under the donate CTA headline.',
                )),
                ('donate_cta_url', models.URLField(
                    blank=True,
                    help_text='Evergreen donation page for the charity (used when '
                              'no event-scoped DonationPage applies).',
                )),
                ('supported_platforms', models.JSONField(
                    blank=True,
                    default=list,
                    help_text='List of DonationPlatform keys the charity supports '
                              '(e.g. ["justgiving", "tiltify", "twitch"]). Empty '
                              'list = no platform constraint declared.',
                )),
                ('is_active', models.BooleanField(
                    default=True,
                    help_text='Soft-delete switch. Inactive charities are hidden '
                              'from picker UIs but kept for historical audit / past '
                              'events.',
                )),
                ('order', models.PositiveIntegerField(
                    default=0,
                    help_text='Display order in catalogue pickers (lower = earlier).',
                )),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'ordering': ['order', 'name'],
                'verbose_name_plural': 'charities',
            },
        ),
        migrations.CreateModel(
            name='CharityWebsite',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('label', models.CharField(
                    max_length=120,
                    help_text='Display label (e.g. "GameBlast 24", "Workshop blog").',
                )),
                ('url', models.URLField()),
                ('order', models.PositiveIntegerField(default=0)),
                ('charity', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='websites',
                    to='api.charity',
                )),
            ],
            options={
                'ordering': ['charity', 'order', 'id'],
            },
        ),
        migrations.CreateModel(
            name='CharityVideo',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(max_length=200)),
                ('url', models.URLField(
                    help_text='Watch URL on YouTube / Vimeo / direct mp4.',
                )),
                ('thumbnail_url', models.CharField(
                    blank=True,
                    max_length=500,
                    help_text='Optional poster image. Falls back to a host-derived '
                              'thumbnail when blank.',
                )),
                ('description', models.TextField(
                    blank=True,
                    help_text='Short caption shown below the video tile.',
                )),
                ('order', models.PositiveIntegerField(default=0)),
                ('charity', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='videos',
                    to='api.charity',
                )),
            ],
            options={
                'ordering': ['charity', 'order', 'id'],
            },
        ),
        migrations.CreateModel(
            name='CharityImage',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('image_url', models.CharField(
                    max_length=500,
                    help_text='Absolute URL or site-relative path.',
                )),
                ('alt_text', models.CharField(
                    blank=True,
                    max_length=160,
                    help_text='Screen-reader alt + image fallback. Strongly '
                              'recommended.',
                )),
                ('caption', models.CharField(
                    blank=True,
                    max_length=200,
                    help_text='Optional visible caption shown under the image.',
                )),
                ('order', models.PositiveIntegerField(default=0)),
                ('charity', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='images',
                    to='api.charity',
                )),
            ],
            options={
                'ordering': ['charity', 'order', 'id'],
            },
        ),
        migrations.CreateModel(
            name='CharityImpactTier',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('amount', models.DecimalField(
                    decimal_places=2,
                    max_digits=10,
                    help_text='Donation amount this tier illustrates (e.g. 10.00).',
                )),
                ('currency', models.CharField(
                    default='GBP',
                    max_length=3,
                    help_text='ISO 4217 currency code. Display picks the symbol '
                              'from a small lookup table client-side.',
                )),
                ('image_url', models.CharField(
                    blank=True,
                    max_length=500,
                    help_text='Illustrative image for the benefit. Absolute URL or '
                              'site-relative path.',
                )),
                ('alt_text', models.CharField(
                    blank=True,
                    max_length=160,
                    help_text='Image alt + screen-reader label for the tier.',
                )),
                ('description', models.TextField(
                    help_text='Plain-text benefit description. Always required so '
                              'screen readers have something useful even when the '
                              'HTML variant is set.',
                )),
                ('description_html', models.TextField(
                    blank=True,
                    help_text='Optional HTML override used by the frontend when set. '
                              'Lets a tier embed inline links (e.g. an `<a>` to a '
                              'product page) without losing the plain-text fallback. '
                              'Operator is trusted; this is rendered via '
                              'dangerouslySetInnerHTML.',
                )),
                ('order', models.PositiveIntegerField(
                    default=0,
                    help_text='Display order in the table (lower = earlier). '
                              'Conventionally orders by ascending amount but the '
                              'field is independent so curators can pin a hero tier '
                              'to the top.',
                )),
                ('charity', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='impact_tiers',
                    to='api.charity',
                )),
            ],
            options={
                'ordering': ['charity', 'order', 'amount'],
                'indexes': [
                    models.Index(fields=['charity', 'order'], name='api_charity_charity_d2d108_idx'),
                ],
            },
        ),
        migrations.CreateModel(
            name='EventCharity',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('is_primary', models.BooleanField(
                    default=False,
                    help_text='Promotes this charity above others on landing CTAs '
                              'and in the omnibar charity-cluster rotation. Only '
                              'one EventCharity per Event can be primary at a '
                              'time; saving a row as primary demotes the others.',
                )),
                ('order', models.PositiveIntegerField(
                    default=0,
                    help_text='Display order when an event lists multiple charities '
                              '(lower = earlier).',
                )),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('charity', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='event_charities',
                    to='api.charity',
                )),
                ('event', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='event_charities',
                    to='api.event',
                )),
            ],
            options={
                'ordering': ['event', 'order', 'id'],
                'unique_together': {('event', 'charity')},
                'verbose_name_plural': 'event ↔ charity links',
            },
        ),
        migrations.AddField(
            model_name='event',
            name='charities',
            field=models.ManyToManyField(
                blank=True,
                help_text='Charities benefitting from this event. Use the '
                          'EventCharity rows directly to set is_primary / order.',
                related_name='events',
                through='api.EventCharity',
                to='api.charity',
            ),
        ),
    ]

from decimal import Decimal

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0056_donation_platform_logo'),
    ]

    operations = [
        migrations.CreateModel(
            name='Raffle',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=200)),
                ('description', models.TextField(blank=True)),
                ('image_url', models.CharField(
                    blank=True,
                    max_length=500,
                    help_text='Prize artwork. Absolute URL or site-relative path '
                              '(e.g. /assets/img/prizes/foo.jpg).',
                )),
                ('delivery_method', models.CharField(
                    choices=[
                        ('physical', 'Physical (postal)'),
                        ('email', 'Email'),
                        ('twitch', 'Twitch whisper'),
                        ('discord', 'Discord'),
                        ('code', 'Unlock code / digital'),
                        ('other', 'Other'),
                    ],
                    default='physical',
                    max_length=20,
                )),
                ('quantity', models.PositiveIntegerField(
                    default=1,
                    help_text='How many winners to draw for this prize.',
                )),
                ('min_amount', models.DecimalField(
                    decimal_places=2,
                    default=Decimal('0'),
                    max_digits=10,
                    help_text='Minimum donation to qualify as an entry. 0 = any donation.',
                )),
                ('condition_type', models.CharField(
                    choices=[
                        ('manual', 'Manual (operator opens/closes)'),
                        ('whole_event', 'Whole event'),
                        ('schedule_entry', 'While a schedule entry is playing'),
                        ('date_range', 'Between two dates/times'),
                    ],
                    default='manual',
                    max_length=20,
                    help_text='What makes this prize available to win — drives the '
                              'entry window.',
                )),
                ('window_start', models.DateTimeField(
                    blank=True,
                    null=True,
                    help_text='For condition_type=date_range: window opens at this time.',
                )),
                ('window_end', models.DateTimeField(
                    blank=True,
                    null=True,
                    help_text='For condition_type=date_range: window closes at this time.',
                )),
                ('status', models.CharField(
                    choices=[
                        ('draft', 'Draft'),
                        ('open', 'Open'),
                        ('closed', 'Closed'),
                        ('drawn', 'Drawn'),
                    ],
                    default='draft',
                    max_length=10,
                )),
                ('opened_at', models.DateTimeField(
                    blank=True,
                    null=True,
                    help_text='Stamped when a manual raffle is opened, and frozen as the '
                              'window start once drawn.',
                )),
                ('closed_at', models.DateTimeField(
                    blank=True,
                    null=True,
                    help_text='Stamped when the raffle is closed or drawn — freezes the '
                              'entry window so the draw is reproducible.',
                )),
                ('is_active', models.BooleanField(
                    default=True,
                    help_text='Show on the public /incentives page and the omnibar.',
                )),
                ('order', models.PositiveIntegerField(default=0)),
                ('payload', models.JSONField(blank=True, default=dict)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('event', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='raffles',
                    to='api.event',
                )),
                ('schedule_entry', models.ForeignKey(
                    blank=True,
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='raffles',
                    to='api.scheduleentry',
                    help_text='For condition_type=schedule_entry: entries are taken '
                              'while this schedule entry is being played.',
                )),
            ],
            options={
                'ordering': ['order', 'created_at'],
            },
        ),
        migrations.CreateModel(
            name='RaffleWinner',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('donor_name', models.CharField(
                    max_length=200,
                    help_text='Snapshot of the donor name at draw time.',
                )),
                ('drawn_at', models.DateTimeField(auto_now_add=True)),
                ('contact_info', models.TextField(
                    blank=True,
                    help_text='PII — postal address (physical) or email / handle (virtual). '
                              'Filled in by the operator after contacting the winner.',
                )),
                ('delivery_code', models.CharField(
                    blank=True,
                    max_length=255,
                    help_text='Unlock / redemption code for digital prizes.',
                )),
                ('fulfillment_status', models.CharField(
                    choices=[
                        ('pending', 'Pending contact'),
                        ('contacted', 'Contacted'),
                        ('sent', 'Sent / shipped'),
                        ('delivered', 'Delivered'),
                        ('forfeited', 'Forfeited / redraw'),
                    ],
                    default='pending',
                    max_length=12,
                )),
                ('notes', models.TextField(blank=True)),
                ('donation', models.ForeignKey(
                    blank=True,
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='raffle_wins',
                    to='api.donation',
                    help_text='The winning entry. SET_NULL so deleting a donation keeps '
                              'the winner row + its snapshot name.',
                )),
                ('raffle', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='winners',
                    to='api.raffle',
                )),
            ],
            options={
                'ordering': ['raffle', 'drawn_at'],
            },
        ),
    ]

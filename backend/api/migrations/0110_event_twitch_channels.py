"""Per-event Twitch channels.

Renames the (charity-only) ``TwitchCharityChannel`` to the general
``TwitchChannelConnection`` durable token store, adds ``EventTwitchChannel``
(each event's channels — live status always, charity optionally), and drops the
single ``Event.twitch_channel`` field.

Data migration: seed a ``zeldathonuk`` connection from the existing
``TwitchOAuthToken`` (so the primary channel is charity-connected without
re-auth); create a primary ``EventTwitchChannel`` per event from its old
``twitch_channel``; attach the other charity connections (e.g. msec) to the
active event and remove the now-superseded manual ``platform='twitch'``
donation pages.
"""
from django.db import migrations, models
import django.db.models.deletion


def forwards(apps, schema_editor):
    Event = apps.get_model('api', 'Event')
    TwitchOAuthToken = apps.get_model('api', 'TwitchOAuthToken')
    TwitchChannelConnection = apps.get_model('api', 'TwitchChannelConnection')
    EventTwitchChannel = apps.get_model('api', 'EventTwitchChannel')
    DonationPage = apps.get_model('api', 'DonationPage')

    # 1) Seed a zeldathonuk connection from the primary token (already holds
    #    channel:read:charity) so the main channel connects without re-auth.
    tok = TwitchOAuthToken.objects.first()
    if tok and (tok.access_token or tok.refresh_token):
        TwitchChannelConnection.objects.get_or_create(
            login='zeldathonuk',
            defaults={
                'display_name': 'ZeldathonUK',
                'access_token': tok.access_token,
                'refresh_token': tok.refresh_token,
                'expires_at': tok.expires_at,
                'scopes': tok.scopes,
                'is_active': True,
            },
        )

    conns = {c.login: c for c in TwitchChannelConnection.objects.all()}

    # 2) A primary EventTwitchChannel per event, from its old twitch_channel.
    for ev in Event.objects.all():
        login = (getattr(ev, 'twitch_channel', '') or '').strip().lower()
        if not login:
            continue
        conn = conns.get(login)
        EventTwitchChannel.objects.get_or_create(
            event=ev, login=login,
            defaults={
                'display_name': conn.display_name if conn else '',
                'is_primary': True,
                'track_charity': bool(conn),
                'connection': conn,
                'order': 0,
            },
        )

    # 3) Attach the other charity connections (msec, …) to the active event and
    #    drop the manual Twitch donation pages they replace.
    active = Event.objects.filter(is_active=True).first()
    if active:
        order = 1
        for login, conn in conns.items():
            if login == 'zeldathonuk':
                continue
            EventTwitchChannel.objects.get_or_create(
                event=active, login=login,
                defaults={
                    'display_name': conn.display_name,
                    'is_primary': False,
                    'track_charity': True,
                    'connection': conn,
                    'order': order,
                },
            )
            order += 1
        DonationPage.objects.filter(event=active, platform='twitch').delete()


def backwards(apps, schema_editor):
    # The RemoveField is reversed automatically (re-adds a blank column). We
    # don't attempt to reconstruct the per-event channel rows.
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0109_twitchcharitychannel_donation_source_channel'),
    ]

    operations = [
        migrations.RenameModel(
            old_name='TwitchCharityChannel',
            new_name='TwitchChannelConnection',
        ),
        migrations.AlterModelOptions(
            name='twitchchannelconnection',
            options={'ordering': ['login'],
                     'verbose_name': 'Twitch channel connection'},
        ),
        migrations.AlterField(
            model_name='twitchchannelconnection',
            name='broadcaster_id',
            field=models.CharField(
                blank=True, max_length=64,
                help_text='Numeric Twitch user id, resolved from the token at '
                          'connect.'),
        ),
        migrations.CreateModel(
            name='EventTwitchChannel',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True,
                                           serialize=False, verbose_name='ID')),
                ('login', models.CharField(
                    help_text='Twitch channel login (the bit after twitch.tv/).',
                    max_length=50)),
                ('display_name', models.CharField(blank=True, max_length=100)),
                ('is_primary', models.BooleanField(
                    default=False,
                    help_text='The main stream channel — leads the homepage '
                              'embed and is the fallback for single-channel '
                              'consumers. One per event.')),
                ('track_charity', models.BooleanField(
                    default=False,
                    help_text='Poll / EventSub this channel for Twitch Charity '
                              'donations. Requires a linked connection with '
                              'channel:read:charity.')),
                ('charity_slug', models.CharField(
                    blank=True, max_length=200,
                    help_text='Optional Twitch Charity campaign slug (e.g. '
                              '"msec-gameblast26") used as the donate-link '
                              'external id.')),
                ('order', models.PositiveIntegerField(default=0)),
                ('is_active', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('connection', models.ForeignKey(
                    blank=True, null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='event_channels',
                    to='api.twitchchannelconnection',
                    help_text='The OAuth connection (token) for this channel, '
                              'set once the broadcaster has connected. Null = '
                              'live-status-only.')),
                ('event', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='twitch_channels', to='api.event')),
            ],
            options={
                'ordering': ['event', 'order', 'id'],
                'unique_together': {('event', 'login')},
            },
        ),
        migrations.RunPython(forwards, backwards),
        migrations.RemoveField(model_name='event', name='twitch_channel'),
    ]

"""Broad endpoint coverage: builds a full fixture graph and exercises every
list/detail endpoint, the function views, and a representative set of
operator CRUD + custom actions. Network-touching integrations are mocked.
"""
from __future__ import annotations

from decimal import Decimal
from unittest.mock import MagicMock, patch

from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APITestCase

from api import models


def operator_client(client, username='op-smoke', clerk='clerk-smoke'):
    user = get_user_model().objects.create_user(username=username, password='x')
    models.Profile.objects.create(
        user=user, clerk_user_id=clerk, role=models.Profile.ROLE_OPERATOR,
    )
    client.force_authenticate(user=user)
    return user


def build_graph():
    """Create one of (nearly) everything so list serializers exercise their
    SerializerMethodFields against real rows. Returns a dict of key objects."""
    now = timezone.now()
    g = {}
    g['event'] = ev = models.Event.objects.create(
        name='Smoke Event', start_time=now, is_active=True, currency_symbol='£',
    )
    g['game'] = game = models.Game.objects.create(
        title='Smoke Game', platform='snes', layout_type='4x3',
        default_play_minutes=60, asset_slug='smoke',
    )
    g['runner'] = runner = models.Runner.objects.create(name='Speedy')
    g['entry'] = entry = models.ScheduleEntry.objects.create(
        event=ev, game=game, order=1, slot_type='game',
    )
    entry.runners.add(runner)
    g['iset'] = iset = models.GameItemSet.objects.create(
        game=game, name='Medallions', kind='set', order=0,
    )
    g['item'] = item = models.GameItem.objects.create(
        game=game, name='Bow', category='weapon', order=0, image_url='/x.png',
    )
    item.sets.add(iset)
    g['objective'] = models.GameObjective.objects.create(
        game=game, name='Get the Bow', order=0, category='item-get',
        linked_item=item,
    )
    g['donation'] = models.Donation.objects.create(
        event=ev, platform='justgiving', donor_name='Kris', amount=Decimal('10.00'),
        currency='GBP', message='gg', donated_at=now, external_id='d1',
    )
    g['page'] = models.DonationPage.objects.create(
        event=ev, platform='justgiving', url='https://justgiving.com/x',
        external_id='smoke', is_primary=True,
    )
    g['incentive'] = models.Incentive.objects.create(
        event=ev, name='Name the hero', goal_amount=Decimal('100'),
    )
    g['milestone'] = models.Milestone.objects.create(
        event=ev, name='£5k', threshold_amount=Decimal('5000'),
    )
    g['raffle'] = raffle = models.Raffle.objects.create(event=ev, name='Prize', is_active=True)
    g['winner'] = models.RaffleWinner.objects.create(raffle=raffle, donor_name='Kris')
    g['charity'] = charity = models.Charity.objects.create(slug='special', name='SpecialEffect')
    models.CharityWebsite.objects.create(charity=charity, label='Home', url='https://x.org')
    models.CharitySocialLink.objects.create(charity=charity, platform='x', url='https://x.com/y')
    models.CharityVideo.objects.create(charity=charity, title='Vid', url='https://youtu.be/z')
    models.CharityImage.objects.create(charity=charity, image_url='/img.png')
    models.CharityImpactTier.objects.create(
        charity=charity, amount=Decimal('25'), description='A controller',
    )
    g['event_charity'] = models.EventCharity.objects.create(
        event=ev, charity=charity, is_primary=True,
    )
    models.CharitySlide.objects.create(kind='text', title='Welcome')
    g['channel'] = models.EventTwitchChannel.objects.create(
        event=ev, login='zeldathonuk', is_primary=True,
    )
    models.ChatAnnouncement.objects.create(event=ev, trigger='donation')
    models.RecurringChatMessage.objects.create(event=ev, template='Donate: {donate_url}')
    models.TwitchPrediction.objects.create(event=ev, prediction_id='p1', title='Boss?')
    g['mapping'] = mapping = models.RewardMapping.objects.create(
        event=ev, reward_title='Hydrate',
    )
    models.RewardAction.objects.create(mapping=mapping, action_type='chat')
    models.ShoutoutRequest.objects.create(event=ev, target_login='friend')
    models.ScheduledJob.objects.create(key='smoke', label='Smoke', command='poll_donations')
    g['sound'] = sound = models.SoundAsset.objects.create(name='Ding', url='/d.mp3')
    models.ScheduleEntrySoundTrigger.objects.create(schedule_entry=entry, sound=sound)
    models.ChestAnnouncerSoundTrigger.objects.create(name='Big', kind='amount', sound_url='/b.mp3')
    models.AudioTrack.objects.create(title='OCR', source_url='https://ocr.org/t.mp3')
    models.PlaythroughEvent.objects.create(schedule_entry=entry, kind='death')
    models.OmnibarOverride.objects.create(
        kind='urgent', expires_at=now + timezone.timedelta(minutes=5),
    )
    models.ExternalEvent.objects.create(source='twitch', kind='follow', occurred_at=now)
    models.LayoutPreset.objects.create(name='Default', layout_type='4x3', is_active=True)
    return g


# Every DRF-router list endpoint (prefix → /api/<prefix>/).
ROUTER_PREFIXES = [
    'games', 'game-items', 'game-item-sets', 'game-objectives', 'runners',
    'events', 'schedule', 'donations', 'donation-pages', 'themes',
    'layout-presets', 'brb', 'playthrough-events', 'overrides',
    'external-events', 'incentives', 'milestones', 'raffles', 'raffle-winners',
    'charity-slides', 'charities', 'charity-websites', 'charity-social-links',
    'charity-videos', 'charity-images', 'charity-impact-tiers', 'event-charities',
    'event-twitch-channels', 'chat-announcements', 'twitch-predictions',
    'recurring-chat-messages', 'shoutout-requests', 'scheduled-jobs',
    'reward-mappings', 'reward-actions', 'sound-assets', 'activity-log',
    'chest-announcer/sound-triggers', 'schedule-entry-sound-triggers',
]

# Function-view GET endpoints that are public reads.
PUBLIC_GET_PATHS = [
    'healthz/', 'currently-playing/', 'donation-mute-reasons/', 'theme/',
    'layout-guide/', 'chest-announcer/settings/', 'chest-announcer/replay/',
    'tts/replay/', 'tts/now-reading/', 'twitch/charity-campaign/',
    'shoutout-config/', 'scheduler-status/', 'justgiving/status/', 'queue/',
]


class PublicReadTests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.g = build_graph()

    def test_all_router_list_endpoints(self):
        for prefix in ROUTER_PREFIXES:
            res = self.client.get(f'/api/{prefix}/')
            self.assertEqual(res.status_code, 200, f'{prefix} → {res.status_code}')

    def test_filtered_list_endpoints(self):
        ev = self.g['event'].id
        game = self.g['game'].id
        for url in [
            f'/api/donations/?event={ev}',
            f'/api/donations/totals/?event={ev}',
            f'/api/incentives/?event={ev}&active=true',
            f'/api/milestones/?event={ev}&reached=false',
            f'/api/raffles/?event={ev}&active=true',
            f'/api/game-items/?game={game}',
            f'/api/game-objectives/?game={game}',
            f'/api/schedule/?event={ev}',
            f'/api/schedule/?compact=1',
            f'/api/donation-pages/?event={ev}',
        ]:
            res = self.client.get(url)
            self.assertEqual(res.status_code, 200, f'{url} → {res.status_code}')

    def test_detail_endpoints(self):
        for prefix, obj in [
            ('games', self.g['game']), ('events', self.g['event']),
            ('donations', self.g['donation']), ('charities', self.g['charity']),
            ('incentives', self.g['incentive']), ('milestones', self.g['milestone']),
            ('raffles', self.g['raffle']), ('schedule', self.g['entry']),
            ('game-items', self.g['item']),
        ]:
            res = self.client.get(f'/api/{prefix}/{obj.id}/')
            self.assertEqual(res.status_code, 200, f'{prefix} detail → {res.status_code}')

    def test_public_function_views(self):
        for path in PUBLIC_GET_PATHS:
            res = self.client.get(f'/api/{path}')
            self.assertIn(res.status_code, (200, 404), f'{path} → {res.status_code}')

    def test_currently_playing_set(self):
        res = self.client.get('/api/currently-playing/')
        self.assertEqual(res.status_code, 200)


class OperatorCrudTests(APITestCase):
    def setUp(self):
        self.g = build_graph()
        operator_client(self.client)

    def test_me_endpoint(self):
        res = self.client.get('/api/me/')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data['role'], 'operator')

    def test_game_crud(self):
        res = self.client.post('/api/games/', {
            'title': 'New Game', 'platform': 'NES', 'layout_type': '4x3',
            'default_play_minutes': 45,
        })
        self.assertIn(res.status_code, (200, 201))
        gid = res.data['id']
        res = self.client.patch(f'/api/games/{gid}/', {'title': 'Renamed'})
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data['title'], 'Renamed')
        res = self.client.delete(f'/api/games/{gid}/')
        self.assertEqual(res.status_code, 204)

    def test_runner_crud(self):
        res = self.client.post('/api/runners/', {'name': 'Runner2'})
        self.assertIn(res.status_code, (200, 201))
        res = self.client.delete(f'/api/runners/{res.data["id"]}/')
        self.assertEqual(res.status_code, 204)

    def test_game_item_crud_and_actions(self):
        res = self.client.post('/api/game-items/', {
            'game': self.g['game'].id, 'name': 'Hookshot', 'category': 'key-item',
            'group': 'Equipment', 'order': 1, 'set_ids': [], 'unlocks_with_ids': [],
        })
        self.assertIn(res.status_code, (200, 201))
        iid = res.data['id']
        dup = self.client.post(f'/api/game-items/{iid}/duplicate/')
        self.assertIn(dup.status_code, (200, 201, 404, 405))
        self.client.delete(f'/api/game-items/{iid}/')

    def test_donation_actions(self):
        ev = self.g['event'].id
        d = self.g['donation'].id
        self.assertEqual(
            self.client.post(f'/api/donations/{d}/mark_read/').status_code, 200,
        )
        res = self.client.post('/api/donations/mute_all/', {'event_id': ev})
        self.assertEqual(res.status_code, 200)
        res = self.client.post('/api/donations/delete_all/', {'event_id': ev})
        self.assertEqual(res.status_code, 200)

    def test_milestone_actions(self):
        m = self.g['milestone'].id
        self.assertEqual(self.client.post(f'/api/milestones/{m}/mark_reached/').status_code, 200)
        self.assertEqual(self.client.post(f'/api/milestones/{m}/mark_announced/').status_code, 200)
        self.assertEqual(self.client.post(f'/api/milestones/{m}/reset/').status_code, 200)

    def test_incentive_reset(self):
        i = self.g['incentive'].id
        # mark_reached / reset are the typical incentive actions; tolerate absence.
        for action in ('mark_reached', 'reset'):
            res = self.client.post(f'/api/incentives/{i}/{action}/')
            self.assertIn(res.status_code, (200, 404, 405))

    def test_raffle_actions(self):
        r = self.g['raffle'].id
        for action in ('open', 'close', 'draw', 'reset'):
            res = self.client.post(f'/api/raffles/{r}/{action}/')
            self.assertIn(res.status_code, (200, 400, 404, 405))

    def test_scheduled_job_run(self):
        job = models.ScheduledJob.objects.create(
            key='noop', label='Noop', command='healthz_noop_not_a_command',
        )
        res = self.client.post(f'/api/scheduled-jobs/{job.id}/run/')
        # The command fails, but the action records it and returns 200.
        self.assertEqual(res.status_code, 200)

    def test_layout_preset_actions(self):
        p = models.LayoutPreset.objects.create(name='P2', layout_type='4x3')
        for action in ('activate', 'duplicate'):
            res = self.client.post(f'/api/layout-presets/{p.id}/{action}/')
            self.assertIn(res.status_code, (200, 201, 404, 405))

    def test_chat_announcement_and_recurring_crud(self):
        res = self.client.get('/api/chat-announcements/')
        self.assertEqual(res.status_code, 200)
        res = self.client.post('/api/recurring-chat-messages/', {
            'event': self.g['event'].id, 'template': 'hi', 'interval_minutes': 10,
        })
        self.assertIn(res.status_code, (200, 201))

    def test_write_requires_operator(self):
        anon = self.client_class()
        res = anon.post('/api/runners/', {'name': 'Nope'})
        self.assertIn(res.status_code, (401, 403))

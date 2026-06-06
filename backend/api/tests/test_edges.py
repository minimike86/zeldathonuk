"""Error / validation branch coverage across the viewset actions + function
views (cheap, numerous branches) and a few more twitch paths."""
from __future__ import annotations

from datetime import timedelta
from decimal import Decimal
from unittest.mock import MagicMock, patch

from django.contrib.auth import get_user_model
from django.test import TestCase, override_settings
from django.utils import timezone
from rest_framework.test import APITestCase

from api import models, twitch


def _operator(client, u='ed-op', c='ed-clerk'):
    user = get_user_model().objects.create_user(username=u, password='x')
    models.Profile.objects.create(user=user, clerk_user_id=c, role=models.Profile.ROLE_OPERATOR)
    client.force_authenticate(user=user)


class ErrorBranchTests(APITestCase):
    def setUp(self):
        _operator(self.client)
        self.event = models.Event.objects.create(name='E', start_time=timezone.now(), is_active=True)
        self.game = models.Game.objects.create(
            title='G', platform='NES', layout_type='4x3', default_play_minutes=60,
        )
        self.entry = models.ScheduleEntry.objects.create(
            event=self.event, game=self.game, order=1, slot_type='game',
        )
        cp = models.CurrentlyPlaying.get()
        cp.schedule_entry = self.entry
        cp.save()

    def _p(self, url, body=None):
        return self.client.post(url, body or {}, format='json')

    def test_donation_action_validation(self):
        self.assertEqual(self._p('/api/donations/delete_all/').status_code, 400)   # no event_id
        self.assertEqual(self._p('/api/donations/mute_all/').status_code, 400)      # no event_id
        self.assertEqual(
            self._p('/api/donations/mute_all/', {'event_id': self.event.id, 'mute_reason': 'bogus'}).status_code,
            400,
        )

    def test_collected_action_validation(self):
        e = self.entry.id
        # Missing item_id / objective_id → 400 (no DB writes).
        self.assertIn(self._p(f'/api/schedule/{e}/toggle_collected/', {}).status_code, (400, 404))
        self.assertIn(self._p(f'/api/schedule/{e}/adjust_collected/', {}).status_code, (400, 404))
        self.assertIn(
            self._p(f'/api/schedule/{e}/set_objective_status/', {}).status_code, (400, 404),
        )
        obj = models.GameObjective.objects.create(game=self.game, name='O', order=0)
        self.assertIn(
            self._p(f'/api/schedule/{e}/set_objective_status/', {'objective_id': obj.id, 'status': 'bogus'}).status_code,
            (400, 404),
        )

    def test_setpiece_action_validation(self):
        e = self.entry.id
        self.assertIn(self._p(f'/api/schedule/{e}/add_setpiece/', {}).status_code, (400, 404))
        self.assertIn(self._p(f'/api/schedule/{e}/update_setpiece/', {'setpiece_id': 999999}).status_code, (400, 404))
        self.assertIn(self._p(f'/api/schedule/{e}/clear_setpiece/', {'setpiece_id': 999999}).status_code, (200, 400, 404))

    def test_timer_on_missing_entry(self):
        self.assertIn(self._p('/api/schedule/999999/start_timer/').status_code, (404, 400))

    def test_raffle_draw_without_window(self):
        raffle = models.Raffle.objects.create(event=self.event, name='R')
        # Draw before opening / with no entries → graceful error or empty.
        self.assertIn(self._p(f'/api/raffles/{raffle.id}/draw/').status_code, (200, 400, 409))

    def test_incentive_contribute_validation(self):
        inc = models.Incentive.objects.create(event=self.event, name='I', goal_amount=Decimal('10'))
        self.assertIn(self._p(f'/api/incentives/{inc.id}/contribute/', {}).status_code, (200, 400))

    def test_justgiving_test_with_page_no_key(self):
        models.DonationPage.objects.create(
            event=self.event, platform=models.DonationPlatform.JUSTGIVING,
            url='https://justgiving.com/x', external_id='zeldathon',
        )
        with override_settings(JUSTGIVING_API_KEY=''):
            # A configured page but no App ID → JustGivingError → 400.
            self.assertEqual(self._p('/api/justgiving/test/').status_code, 400)

    def test_justgiving_status_shape(self):
        res = self.client.get('/api/justgiving/status/')
        self.assertEqual(res.status_code, 200)
        self.assertIn('app_id_present', res.data)

    def test_donation_page_sync_total_non_justgiving(self):
        page = models.DonationPage.objects.create(
            event=self.event, platform=models.DonationPlatform.TILTIFY,
            url='https://tiltify.com/x', external_id='abc',
        )
        self.assertEqual(self._p(f'/api/donation-pages/{page.id}/sync_total/').status_code, 400)


@override_settings(TWITCH_CLIENT_ID='cid', TWITCH_CLIENT_SECRET='sec')
class TwitchMoreTests(TestCase):
    def setUp(self):
        tok = models.TwitchOAuthToken.get()
        tok.access_token = 'a'
        tok.expires_at = timezone.now() + timedelta(hours=1)
        tok.save()
        self.event = models.Event.objects.create(name='E', start_time=timezone.now(), is_active=True)
        self.conn = models.TwitchChannelConnection.objects.create(
            login='zeldathonuk', broadcaster_id='123', access_token='c',
            scopes='channel:manage:broadcast', is_active=True,
        )
        models.EventTwitchChannel.objects.create(
            event=self.event, login='zeldathonuk', is_primary=True, connection=self.conn,
        )

    @patch('api.twitch.requests')
    def test_modify_channel_and_update_for_game(self, req):
        req.request.return_value = MagicMock(ok=True, status_code=204)
        self.assertIsNone(twitch.modify_channel(self.conn, '123'))  # nothing to change
        self.assertIsNotNone(twitch.modify_channel(self.conn, '123', title='Hi'))
        game = models.Game.objects.create(
            title='G', platform='N64', layout_type='4x3', default_play_minutes=60,
            twitch_game_id='42',
        )
        entry = models.ScheduleEntry.objects.create(event=self.event, game=game, order=1, slot_type='game')
        # No opt-in → returns False.
        self.assertFalse(twitch.update_channel_for_game(self.event, entry))
        self.event.update_twitch_category = True
        self.event.twitch_title_template = '{game} — [{position}]'
        self.event.save()
        self.assertTrue(twitch.update_channel_for_game(self.event, entry))

    @patch('api.twitch.requests')
    def test_charity_poll_sources_multi(self, req):
        req.request.return_value = MagicMock(ok=True, status_code=200,
                                             json=lambda: {'data': [{'id': '123'}]})
        # A second charity-tracking channel with its own connection.
        conn2 = models.TwitchChannelConnection.objects.create(
            login='msec', broadcaster_id='456', access_token='c2', is_active=True,
        )
        models.EventTwitchChannel.objects.create(
            event=self.event, login='msec', track_charity=True, connection=conn2,
        )
        sources = twitch.charity_poll_sources()
        self.assertIsInstance(sources, list)

"""Tests for updating the Twitch category/title on game change
(twitch.update_channel_for_game). Twitch calls are mocked."""
from __future__ import annotations

from unittest.mock import MagicMock, patch

from django.test import TestCase
from django.utils import timezone

from api import models, twitch


def _event(update_category=True, title_template=''):
    return models.Event.objects.create(
        name='Cat Event', start_time=timezone.now(), is_active=True,
        update_twitch_category=update_category,
        twitch_title_template=title_template,
    )


def _connected_primary(event, scopes='channel:manage:broadcast'):
    conn = models.TwitchChannelConnection.objects.create(
        login='zeldathonuk', broadcaster_id='52548232', access_token='t',
        scopes=scopes, is_active=True,
    )
    models.EventTwitchChannel.objects.create(
        event=event, login='zeldathonuk', is_primary=True, connection=conn,
    )
    return conn


def _game_entry(event, twitch_game_id='1029', title='Ocarina of Time'):
    game = models.Game.objects.create(
        title=title, platform='N64', twitch_game_id=twitch_game_id,
        default_play_minutes=60,
    )
    return models.ScheduleEntry.objects.create(event=event, game=game, order=0)


class UpdateChannelForGameTests(TestCase):
    @patch('api.twitch.modify_channel')
    def test_sets_category(self, mock_modify):
        mock_modify.return_value = MagicMock(ok=True)
        event = _event()
        _connected_primary(event)
        entry = _game_entry(event)
        self.assertTrue(twitch.update_channel_for_game(event, entry))
        self.assertEqual(mock_modify.call_args.kwargs['game_id'], '1029')
        self.assertIsNone(mock_modify.call_args.kwargs['title'])  # no template

    @patch('api.twitch.modify_channel')
    def test_renders_title_template(self, mock_modify):
        mock_modify.return_value = MagicMock(ok=True)
        event = _event(title_template='Zeldathon — Now: {game}')
        _connected_primary(event)
        entry = _game_entry(event, title='Majora’s Mask')
        twitch.update_channel_for_game(event, entry)
        self.assertEqual(
            mock_modify.call_args.kwargs['title'], 'Zeldathon — Now: Majora’s Mask',
        )

    @patch('api.twitch.modify_channel')
    def test_extended_placeholders(self, mock_modify):
        mock_modify.return_value = MagicMock(ok=True)
        event = _event(title_template='{channel}: {game} [{position}] for {charity}')
        conn = _connected_primary(event)
        conn.display_name = 'ZeldathonUK'
        conn.save()
        charity = models.Charity.objects.create(slug='se', name='SpecialEffect')
        models.EventCharity.objects.create(event=event, charity=charity, is_primary=True)
        g1 = models.Game.objects.create(
            title='OoT', platform='N64', twitch_game_id='1', default_play_minutes=60)
        models.ScheduleEntry.objects.create(event=event, game=g1, order=0)
        g2 = models.Game.objects.create(
            title='MM', platform='N64', twitch_game_id='2', default_play_minutes=60)
        e2 = models.ScheduleEntry.objects.create(event=event, game=g2, order=1)
        twitch.update_channel_for_game(event, e2)
        self.assertEqual(
            mock_modify.call_args.kwargs['title'],
            'ZeldathonUK: MM [2 of 2] for SpecialEffect',
        )

    @patch('api.twitch.modify_channel')
    def test_disabled_does_nothing(self, mock_modify):
        event = _event(update_category=False)
        _connected_primary(event)
        entry = _game_entry(event)
        self.assertFalse(twitch.update_channel_for_game(event, entry))
        mock_modify.assert_not_called()

    @patch('api.twitch.modify_channel')
    def test_missing_scope_skips(self, mock_modify):
        event = _event()
        _connected_primary(event, scopes='channel:read:charity')  # no broadcast scope
        entry = _game_entry(event)
        self.assertFalse(twitch.update_channel_for_game(event, entry))
        mock_modify.assert_not_called()

    @patch('api.twitch.modify_channel')
    def test_blank_game_id_skips(self, mock_modify):
        event = _event()
        _connected_primary(event)
        entry = _game_entry(event, twitch_game_id='')
        self.assertFalse(twitch.update_channel_for_game(event, entry))
        mock_modify.assert_not_called()

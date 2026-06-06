"""Tests for Twitch predictions helpers (api.twitch) and the shared
event_primary_connection resolver. Twitch calls are mocked."""
from __future__ import annotations

from unittest.mock import MagicMock, patch

from django.test import TestCase
from django.utils import timezone

from api import models, twitch


def _event():
    return models.Event.objects.create(
        name='Pred Event', start_time=timezone.now(), is_active=True,
    )


class PredictionHelperTests(TestCase):
    @patch('api.twitch._request_as')
    def test_create_prediction_body_and_return(self, mock_req):
        mock_req.return_value = MagicMock(ok=True)
        mock_req.return_value.json.return_value = {'data': [{
            'id': 'p1', 'title': 'Beat boss?', 'status': 'ACTIVE',
            'outcomes': [{'id': 'o1', 'title': 'Yes'}, {'id': 'o2', 'title': 'No'}],
        }]}
        conn = models.TwitchChannelConnection(login='zeldathonuk', access_token='t')
        data = twitch.create_prediction(conn, '123', 'Beat boss?', ['Yes', 'No'], 120)
        self.assertEqual(data['id'], 'p1')
        body = mock_req.call_args.kwargs['json']
        self.assertEqual(body['broadcaster_id'], '123')
        self.assertEqual([o['title'] for o in body['outcomes']], ['Yes', 'No'])
        self.assertEqual(body['prediction_window'], 120)

    @patch('api.twitch._request_as')
    def test_window_is_clamped(self, mock_req):
        mock_req.return_value = MagicMock(ok=True)
        mock_req.return_value.json.return_value = {'data': [{}]}
        conn = models.TwitchChannelConnection(login='z', access_token='t')
        twitch.create_prediction(conn, '1', 'T', ['a', 'b'], 5000)
        self.assertEqual(mock_req.call_args.kwargs['json']['prediction_window'], 1800)

    @patch('api.twitch._request_as')
    def test_blank_outcomes_dropped(self, mock_req):
        mock_req.return_value = MagicMock(ok=True)
        mock_req.return_value.json.return_value = {'data': [{}]}
        conn = models.TwitchChannelConnection(login='z', access_token='t')
        twitch.create_prediction(conn, '1', 'T', ['Yes', '', '  ', 'No'], 60)
        self.assertEqual(
            [o['title'] for o in mock_req.call_args.kwargs['json']['outcomes']],
            ['Yes', 'No'],
        )

    @patch('api.twitch._request_as')
    def test_end_prediction_resolved_includes_winner(self, mock_req):
        mock_req.return_value = MagicMock(ok=True)
        mock_req.return_value.json.return_value = {'data': [{'id': 'p1', 'status': 'RESOLVED'}]}
        conn = models.TwitchChannelConnection(login='z', access_token='t')
        twitch.end_prediction(conn, '1', 'p1', 'RESOLVED', 'o2')
        body = mock_req.call_args.kwargs['json']
        self.assertEqual(body['status'], 'RESOLVED')
        self.assertEqual(body['winning_outcome_id'], 'o2')

    @patch('api.twitch._request_as')
    def test_end_prediction_cancel_omits_winner(self, mock_req):
        mock_req.return_value = MagicMock(ok=True)
        mock_req.return_value.json.return_value = {'data': [{'id': 'p1', 'status': 'CANCELED'}]}
        conn = models.TwitchChannelConnection(login='z', access_token='t')
        twitch.end_prediction(conn, '1', 'p1', 'CANCELED')
        self.assertNotIn('winning_outcome_id', mock_req.call_args.kwargs['json'])

    @patch('api.twitch._request_as')
    def test_create_failure_raises(self, mock_req):
        mock_req.return_value = MagicMock(ok=False, status_code=403, text='no scope')
        conn = models.TwitchChannelConnection(login='z', access_token='t')
        with self.assertRaises(twitch.TwitchAuthError):
            twitch.create_prediction(conn, '1', 'T', ['a', 'b'], 60)


class PrimaryConnectionTests(TestCase):
    def test_returns_primary_connected(self):
        ev = _event()
        conn = models.TwitchChannelConnection.objects.create(
            login='zeldathonuk', access_token='t', is_active=True,
        )
        models.EventTwitchChannel.objects.create(
            event=ev, login='zeldathonuk', is_primary=True, connection=conn,
        )
        self.assertEqual(twitch.event_primary_connection(ev).id, conn.id)

    def test_none_when_no_connection(self):
        ev = _event()
        models.EventTwitchChannel.objects.create(event=ev, login='x', is_primary=True)
        self.assertIsNone(twitch.event_primary_connection(ev))

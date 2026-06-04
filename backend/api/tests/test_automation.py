"""Tests for the automation layer: ScheduledJob is_due + run_job (mocked
call_command) and the EventSub dashboard endpoints (mocked Twitch)."""
from __future__ import annotations

from datetime import timedelta
from unittest.mock import patch

from django.test import TestCase
from django.urls import reverse
from django.utils import timezone

from api import jobs, models


class ScheduledJobTests(TestCase):
    def test_is_due_logic(self):
        j = models.ScheduledJob.objects.create(
            key='k', label='L', command='poll_donations',
            enabled=True, interval_seconds=60,
        )
        self.assertTrue(j.is_due)  # never run
        j.last_run_at = timezone.now()
        self.assertFalse(j.is_due)
        j.last_run_at = timezone.now() - timedelta(seconds=61)
        self.assertTrue(j.is_due)
        j.enabled = False
        self.assertFalse(j.is_due)

    @patch('api.jobs.call_command')
    def test_run_job_records_ok(self, mock_cc):
        def fake(name, *args, stdout=None, stderr=None):
            stdout.write('did the thing')
        mock_cc.side_effect = fake
        j = models.ScheduledJob.objects.create(
            key='k', label='L', command='poll_donations --twitch',
        )
        jobs.run_job(j)
        j.refresh_from_db()
        self.assertEqual(j.last_status, 'ok')
        self.assertIn('did the thing', j.last_output)
        # command name + arg parsed via shlex
        self.assertEqual(mock_cc.call_args.args[0], 'poll_donations')
        self.assertEqual(mock_cc.call_args.args[1], '--twitch')

    @patch('api.jobs.call_command', side_effect=RuntimeError('kaboom'))
    def test_run_job_records_error(self, _mock_cc):
        j = models.ScheduledJob.objects.create(key='k', label='L', command='x')
        jobs.run_job(j)
        j.refresh_from_db()
        self.assertEqual(j.last_status, 'error')
        self.assertIn('kaboom', j.last_output)

    @patch('api.jobs.call_command')
    def test_run_due_only_runs_enabled_and_due(self, mock_cc):
        models.ScheduledJob.objects.create(
            key='on', label='On', command='a', enabled=True,
        )
        models.ScheduledJob.objects.create(
            key='off', label='Off', command='b', enabled=False,
        )
        ran = jobs.run_due()
        self.assertEqual([j.key for j in ran], ['on'])


class SchedulerHeartbeatTests(TestCase):
    def test_status_reflects_beat(self):
        # No beat yet → not alive.
        resp = self.client.get(reverse('scheduler-status'))
        self.assertFalse(resp.json()['alive'])
        # After a beat → alive + recent.
        models.SchedulerHeartbeat.beat()
        body = self.client.get(reverse('scheduler-status')).json()
        self.assertTrue(body['alive'])
        self.assertLess(body['seconds_ago'], 5)


class EventSubDashboardTests(TestCase):
    @patch('api.twitch.list_eventsub_subscriptions')
    def test_list_subscriptions(self, mock_list):
        mock_list.return_value = [
            {'id': '1', 'type': 'channel.follow', 'status': 'enabled',
             'transport': {'callback': 'https://x/cb'}},
            {'id': '2', 'type': 'channel.cheer', 'status': 'webhook_callback_verification_failed',
             'transport': {'callback': 'https://x/cb'}},
        ]
        resp = self.client.get(reverse('eventsub-subscriptions'))
        self.assertEqual(resp.status_code, 200)
        body = resp.json()
        self.assertEqual(len(body['subscriptions']), 2)
        # enabled sorts first
        self.assertEqual(body['subscriptions'][0]['status'], 'enabled')
        self.assertEqual(body['counts']['enabled'], 1)

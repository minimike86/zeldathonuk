"""Smoke-coverage of the management commands. Network-touching ones are mocked;
seeds run for real (they only write to the test DB)."""
from __future__ import annotations

from unittest.mock import MagicMock, patch

from django.core.management import call_command
from django.test import TestCase
from django.utils import timezone

from api import models


class SeedCommandTests(TestCase):
    def test_populate_zelda_data(self):
        call_command('populate_zelda_data', verbosity=0)
        self.assertTrue(models.Game.objects.exists())

    def test_seed_walkthroughs(self):
        # Depends on games existing; seed those first.
        call_command('populate_zelda_data', verbosity=0)
        call_command('seed_walkthroughs', verbosity=0)


class JobCommandTests(TestCase):
    def test_run_scheduled_jobs_single_pass(self):
        models.ScheduledJob.objects.create(
            key='noop', label='Noop', command='healthz', enabled=True,
            interval_seconds=0,
        )
        # One pass (no --loop). The 'healthz' command isn't a real management
        # command, so the job records an error — but the runner never raises.
        call_command('run_scheduled_jobs', verbosity=0)

    def test_post_chat_reminders_no_active_event(self):
        call_command('post_chat_reminders', verbosity=0)

    def test_process_shoutouts_empty_queue(self):
        call_command('process_shoutouts', verbosity=0)

    def test_prune_activity_log(self):
        models.ActivityLog.objects.create(category='webhook', action='x', summary='y')
        call_command('prune_activity_log', days=0, verbosity=0)


class PollDonationsCommandTests(TestCase):
    def setUp(self):
        self.event = models.Event.objects.create(
            name='E', start_time=timezone.now(), is_active=True, currency_symbol='£',
        )

    @patch('api.tiltify.requests.get')
    def test_tiltify_branch(self, mock_get):
        models.DonationPage.objects.create(
            event=self.event, platform=models.DonationPlatform.TILTIFY,
            url='https://tiltify.com/x', external_id='12345',  # numeric id → no slug lookup
        )
        # First call returns donations, the trailing call is the summary sync.
        mock_get.side_effect = [
            MagicMock(ok=True, status_code=200, json=lambda: {'data': [{
                'id': 't1', 'donor_name': 'Kris',
                'amount': {'value': '5', 'currency': 'GBP'},
                'donor_comment': 'gg', 'completed_at': '2026-01-01T00:00:00Z',
            }], 'metadata': {'after': None}}),
            MagicMock(ok=True, status_code=200, json=lambda: {'data': {
                'id': 'cid', 'total_amount_raised': {'value': '5', 'currency': 'GBP'},
                'donation_count': 1, 'status': 'published',
            }}),
        ]
        # TILTIFY_ACCESS_TOKEN override skips the OAuth token POST.
        with self.settings(TILTIFY_ACCESS_TOKEN='tok'):
            call_command('poll_donations', '--tiltify', verbosity=0)
        self.assertEqual(models.Donation.objects.filter(external_id='t1').count(), 1)

    @patch('api.justgiving.requests.get')
    def test_justgiving_branch(self, mock_get):
        models.DonationPage.objects.create(
            event=self.event, platform=models.DonationPlatform.JUSTGIVING,
            url='https://justgiving.com/x', external_id='zeldathon',
        )
        mock_get.return_value = MagicMock(
            ok=True, status_code=200,
            json=lambda: {'donations': [], 'pagination': {'totalPages': 1}},
        )
        with self.settings(JUSTGIVING_API_KEY='app'):
            call_command('poll_donations', '--justgiving', verbosity=0)

    def test_skips_when_unconfigured(self):
        # No tokens / pages configured → each branch skips cleanly.
        with self.settings(
            TILTIFY_ACCESS_TOKEN='', TILTIFY_CLIENT_ID='', TILTIFY_CLIENT_SECRET='',
            JUSTGIVING_API_KEY='',
        ):
            call_command('poll_donations', verbosity=0)


class ImportZeldaItemsCommandTests(TestCase):
    @patch('api.zeldawiki._api_get')
    def test_import_one_game_no_wiki_page(self, mock_api):
        # No wiki page found → command runs, reports "no matching page".
        mock_api.return_value = None
        game = models.Game.objects.create(
            title='Test', platform='NES', layout_type='4x3', default_play_minutes=60,
        )
        call_command('import_zelda_items', f'--game-id={game.id}', '--delay=0', verbosity=0)

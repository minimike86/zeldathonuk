"""Tests for the JustGiving polling ingestion (api.justgiving).

The JustGiving API is mocked — no real network calls. Covers pagination +
newest-first early-stop, the Accepted-only filter, per-event page resolution
from DonationPage, dedupe, donationDate → donated_at, and the status / test
endpoints.
"""
from __future__ import annotations

from decimal import Decimal
from unittest.mock import MagicMock, patch

from django.contrib.auth import get_user_model
from django.test import override_settings
from django.utils import timezone
from rest_framework.test import APITestCase

from api import justgiving, models


def _event(active=True):
    return models.Event.objects.create(
        name='JG Event', start_time=timezone.now(), is_active=active,
        currency_symbol='£',
    )


def _jg_page(event, short_name='zeldathon', primary=True):
    return models.DonationPage.objects.create(
        event=event, platform=models.DonationPlatform.JUSTGIVING,
        url=f'https://www.justgiving.com/{short_name}', external_id=short_name,
        is_primary=primary,
    )


# A JustGiving /Date(...)/ stamp → 2021-01-16T03:24:15Z.
_JG_DATE = '/Date(1610767455000+0000)/'


def _donation_obj(did, *, amount='10.00', status='Accepted', gift_aid=None):
    d = {
        'id': did,
        'amount': amount,
        'donorDisplayName': f'Donor {did}',
        'currencyCode': 'GBP',
        'message': 'gg',
        'donationDate': _JG_DATE,
        'status': status,
        'image': '',
    }
    if gift_aid is not None:
        d['estimatedTaxReclaim'] = gift_aid
    return d


def _resp(body, *, ok=True, status_code=200):
    m = MagicMock()
    m.ok = ok
    m.status_code = status_code
    m.text = str(body)
    m.json.return_value = body
    return m


@override_settings(JUSTGIVING_API_KEY='app123', JUSTGIVING_ENV='production')
class FetchPageDonationsTests(APITestCase):
    def test_paginates_until_total_pages(self):
        pages = {
            1: _resp({'donations': [_donation_obj(1), _donation_obj(2)],
                      'pagination': {'totalPages': 2}}),
            2: _resp({'donations': [_donation_obj(3)],
                      'pagination': {'totalPages': 2}}),
        }
        with patch('api.justgiving.requests.get',
                   side_effect=lambda *a, **k: pages[k['params']['page']]) as mock_get:
            out = justgiving.fetch_page_donations('zeldathon')
        self.assertEqual([d['id'] for d in out], [1, 2, 3])
        self.assertEqual(mock_get.call_count, 2)

    def test_early_stop_when_page_all_known(self):
        page1 = _resp({'donations': [_donation_obj(1), _donation_obj(2)],
                       'pagination': {'totalPages': 5}})
        with patch('api.justgiving.requests.get', return_value=page1) as mock_get:
            out = justgiving.fetch_page_donations('zeldathon', known_ids={'1', '2'})
        # Page 1 ids all known → stop without fetching page 2.
        self.assertEqual(len(out), 2)
        self.assertEqual(mock_get.call_count, 1)

    def test_non_ok_raises(self):
        with patch('api.justgiving.requests.get',
                   return_value=_resp('nope', ok=False, status_code=404)):
            with self.assertRaises(justgiving.JustGivingError):
                justgiving.fetch_page_donations('missing')

    def test_api_base_switches_on_env(self):
        self.assertEqual(justgiving.api_base(), 'https://api.justgiving.com')
        with override_settings(JUSTGIVING_ENV='staging'):
            self.assertEqual(justgiving.api_base(), 'https://api.staging.justgiving.com')


@override_settings(JUSTGIVING_API_KEY='app123', JUSTGIVING_ENV='production')
class IngestEventTests(APITestCase):
    def setUp(self):
        self.event = _event()
        _jg_page(self.event, 'zeldathon')

    def _patch(self, donations):
        body = _resp({'donations': donations, 'pagination': {'totalPages': 1}})
        return patch('api.justgiving.requests.get', return_value=body)

    def test_ingests_accepted_only_and_maps_fields(self):
        donations = [
            _donation_obj(1, amount='10.00', gift_aid='2.50'),
            _donation_obj(2, amount='5.00', status='Pending'),    # skipped
            _donation_obj(3, amount='0', status='Accepted'),      # skipped (£0)
            _donation_obj(4, amount='-1', status='Accepted'),     # skipped (<0)
        ]
        with self._patch(donations):
            result = justgiving.ingest_event(self.event)
        self.assertEqual(result['total_ingested'], 1)
        self.assertEqual(models.Donation.objects.count(), 1)
        d = models.Donation.objects.get()
        self.assertEqual(d.platform, models.DonationPlatform.JUSTGIVING)
        self.assertEqual(d.external_id, '1')
        self.assertEqual(d.amount, Decimal('10.00'))
        self.assertEqual(d.gift_aid_amount, Decimal('2.50'))
        # donationDate → donated_at (2021-01-16), NOT ingest time.
        self.assertEqual(d.donated_at.year, 2021)
        self.assertEqual(d.donated_at.month, 1)

    def test_rerun_dedupes_and_counts_only_new(self):
        with self._patch([_donation_obj(1)]):
            first = justgiving.ingest_event(self.event)
            second = justgiving.ingest_event(self.event)
        self.assertEqual(first['total_ingested'], 1)
        self.assertEqual(second['total_ingested'], 0)  # already known
        self.assertEqual(models.Donation.objects.count(), 1)

    def test_skips_when_no_active_event(self):
        self.event.is_active = False
        self.event.save()
        with self.assertRaises(justgiving.JustGivingError):
            justgiving.ingest_active_event()

    def test_one_404_page_does_not_abort_siblings(self):
        # Add a second (working) page; the first 404s. The good page should
        # still ingest, and the bad one is reported with an error.
        _jg_page(self.event, 'good-page', primary=False)

        def _router(url, **kwargs):
            if 'zeldathon' in url:  # the original page → 404 (new /page/ product)
                return _resp('{}', ok=False, status_code=404)
            return _resp({'donations': [_donation_obj(7)],
                          'pagination': {'totalPages': 1}})

        with patch('api.justgiving.requests.get', side_effect=_router):
            result = justgiving.ingest_event(self.event)
        # The good page ingested; the bad page is recorded with an error.
        by_name = {p['short_name']: p for p in result['pages']}
        self.assertEqual(by_name['good-page']['ingested'], 1)
        self.assertIn('error', by_name['zeldathon'])
        self.assertEqual(result['total_ingested'], 1)

    def test_summary_404_explains_new_page_product(self):
        with patch('api.justgiving.requests.get',
                   return_value=_resp('{}', ok=False, status_code=404)):
            with self.assertRaises(justgiving.JustGivingError) as ctx:
                justgiving.fetch_page_summary('zeldathonuk-2026-15th-anniversary-stream')
        self.assertIn('page/', str(ctx.exception).lower())


@override_settings(JUSTGIVING_API_KEY='app123', JUSTGIVING_ENV='staging')
class EndpointTests(APITestCase):
    def setUp(self):
        self.event = _event()
        _jg_page(self.event, 'zeldathon')

    def test_status_is_public_and_reports_config(self):
        res = self.client.get('/api/justgiving/status/')
        self.assertEqual(res.status_code, 200)
        self.assertTrue(res.data['app_id_present'])
        self.assertEqual(res.data['env'], 'staging')
        self.assertEqual(res.data['api_base'], 'https://api.staging.justgiving.com')
        self.assertEqual(
            [p['short_name'] for p in res.data['pages']], ['zeldathon'],
        )

    def test_test_endpoint_requires_operator(self):
        res = self.client.post('/api/justgiving/test/')
        self.assertIn(res.status_code, (401, 403))

    def test_test_endpoint_ingests_for_operator(self):
        user = get_user_model().objects.create_user(username='op', password='x')
        models.Profile.objects.create(
            user=user, clerk_user_id='clerk_jg', role=models.Profile.ROLE_OPERATOR,
        )
        self.client.force_authenticate(user=user)
        body = _resp({'donations': [_donation_obj(9)],
                      'pagination': {'totalPages': 1}})
        with patch('api.justgiving.requests.get', return_value=body):
            res = self.client.post('/api/justgiving/test/')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data['total_ingested'], 1)
        self.assertEqual(models.Donation.objects.count(), 1)


@override_settings(JUSTGIVING_API_KEY='app123', JUSTGIVING_ENV='production')
class PageTotalTests(APITestCase):
    """The aggregate page total (page-details endpoint) keeps working even when
    the itemized donations feed is empty — that's how a completed/past event's
    total stays visible."""

    def setUp(self):
        self.event = _event()
        self.page = _jg_page(self.event, 'gameblast17-michael-warner')

    def _summary_resp(self, **over):
        body = {
            'pageId': '9558537',
            'grandTotalRaisedExcludingGiftAid': '360',
            'donationCount': 16,
            'currencyCode': 'GBP',
            'status': 'Completed',
        }
        body.update(over)
        return _resp(body)

    def test_fetch_page_summary_maps_fields(self):
        with patch('api.justgiving.requests.get', return_value=self._summary_resp()):
            s = justgiving.fetch_page_summary('gameblast17-michael-warner')
        self.assertEqual(s['raised'], Decimal('360'))
        self.assertEqual(s['donation_count'], 16)
        self.assertEqual(s['currency'], 'GBP')
        self.assertEqual(s['status'], 'Completed')

    def test_sync_page_total_stores_aggregate_for_completed_page(self):
        with patch('api.justgiving.requests.get', return_value=self._summary_resp()):
            justgiving.sync_page_total(self.page)
        self.page.refresh_from_db()
        self.assertEqual(self.page.total_raised, Decimal('360.00'))
        self.assertEqual(self.page.total_donation_count, 16)
        self.assertEqual(self.page.total_currency, 'GBP')
        self.assertEqual(self.page.total_status, 'Completed')
        self.assertIsNotNone(self.page.total_synced_at)

    def test_sync_page_total_rejects_non_justgiving(self):
        page = models.DonationPage.objects.create(
            event=self.event, platform=models.DonationPlatform.TILTIFY,
            url='https://tiltify.com/x', external_id='abc',
        )
        with self.assertRaises(justgiving.JustGivingError):
            justgiving.sync_page_total(page)

    def test_endpoint_requires_operator(self):
        res = self.client.post(f'/api/donation-pages/{self.page.id}/sync_total/')
        self.assertIn(res.status_code, (401, 403))

    def _operator(self, username, clerk):
        user = get_user_model().objects.create_user(username=username, password='x')
        models.Profile.objects.create(
            user=user, clerk_user_id=clerk, role=models.Profile.ROLE_OPERATOR,
        )
        self.client.force_authenticate(user=user)

    def test_endpoint_updates_for_operator(self):
        self._operator('op2', 'clerk_jg2')
        with patch('api.justgiving.requests.get', return_value=self._summary_resp()):
            res = self.client.post(f'/api/donation-pages/{self.page.id}/sync_total/')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data['total_donation_count'], 16)
        self.assertEqual(Decimal(str(res.data['total_raised'])), Decimal('360.00'))

    def test_endpoint_rejects_non_justgiving_page(self):
        page = models.DonationPage.objects.create(
            event=self.event, platform=models.DonationPlatform.TILTIFY,
            url='https://tiltify.com/x', external_id='abc',
        )
        self._operator('op3', 'clerk_jg3')
        res = self.client.post(f'/api/donation-pages/{page.id}/sync_total/')
        self.assertEqual(res.status_code, 400)

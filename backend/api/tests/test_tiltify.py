"""Tests for the Tiltify v5 ingestion (api.tiltify) + the signed webhook.

The Tiltify API is mocked — no real network calls. Covers the OAuth2 token
fetch/cache/override, cursor pagination + newest-first early-stop, per-event
campaign resolution from DonationPage, dedupe, amount/currency mapping, the
campaign summary + per-page total sync, the status/test endpoints, and webhook
signature verification.
"""
from __future__ import annotations

import base64
import hashlib
import hmac
import json
import time
from decimal import Decimal
from unittest.mock import MagicMock, patch

from django.contrib.auth import get_user_model
from django.test import override_settings
from django.utils import timezone
from rest_framework.test import APITestCase

from api import models, tiltify


def _event(active=True):
    return models.Event.objects.create(
        name='Tiltify Event', start_time=timezone.now(), is_active=active,
        currency_symbol='£',
    )


def _tlt_page(event, campaign_id='12345', primary=True):
    return models.DonationPage.objects.create(
        event=event, platform=models.DonationPlatform.TILTIFY,
        url=f'https://tiltify.com/+team/{campaign_id}', external_id=campaign_id,
        is_primary=primary,
    )


def _donation_obj(did, *, value='10.00', currency='GBP', comment='gg'):
    return {
        'id': str(did),
        'amount': {'value': value, 'currency': currency},
        'donor_name': f'Donor {did}',
        'donor_comment': comment,
        'completed_at': '2021-01-16T03:24:15Z',
    }


def _resp(body, *, ok=True, status_code=200):
    m = MagicMock()
    m.ok = ok
    m.status_code = status_code
    m.text = str(body)
    m.json.return_value = body
    return m


def _reset_token_cache():
    tiltify._token_cache = None


@override_settings(
    TILTIFY_CLIENT_ID='cid', TILTIFY_CLIENT_SECRET='secret',
    TILTIFY_ACCESS_TOKEN='', TILTIFY_WEBHOOK_SECRET='',
)
class TokenTests(APITestCase):
    def setUp(self):
        _reset_token_cache()

    def tearDown(self):
        _reset_token_cache()

    def test_fetches_and_caches_token(self):
        tok = _resp({'access_token': 'abc', 'expires_in': 3600})
        with patch('api.tiltify.requests.post', return_value=tok) as mock_post:
            self.assertEqual(tiltify._get_access_token(), 'abc')
            # Second call is served from cache — no extra POST.
            self.assertEqual(tiltify._get_access_token(), 'abc')
        self.assertEqual(mock_post.call_count, 1)

    def test_refreshes_when_expired(self):
        first = _resp({'access_token': 'old', 'expires_in': 3600})
        second = _resp({'access_token': 'new', 'expires_in': 3600})
        with patch('api.tiltify.requests.post', side_effect=[first, second]) as mock_post:
            self.assertEqual(tiltify._get_access_token(), 'old')
            # Force the cache to look expired.
            tiltify._token_cache = ('old', time.time() - 1)
            self.assertEqual(tiltify._get_access_token(), 'new')
        self.assertEqual(mock_post.call_count, 2)

    @override_settings(TILTIFY_ACCESS_TOKEN='manual-override')
    def test_static_override_skips_oauth(self):
        with patch('api.tiltify.requests.post') as mock_post:
            self.assertEqual(tiltify._get_access_token(), 'manual-override')
        mock_post.assert_not_called()

    @override_settings(TILTIFY_CLIENT_ID='', TILTIFY_CLIENT_SECRET='')
    def test_missing_creds_raises(self):
        with self.assertRaises(tiltify.TiltifyError):
            tiltify._get_access_token()

    def test_token_endpoint_error_raises(self):
        with patch('api.tiltify.requests.post',
                   return_value=_resp('nope', ok=False, status_code=401)):
            with self.assertRaises(tiltify.TiltifyError):
                tiltify._get_access_token()


@override_settings(
    TILTIFY_CLIENT_ID='cid', TILTIFY_CLIENT_SECRET='secret',
    TILTIFY_ACCESS_TOKEN='static',  # skip the token POST in these tests
)
class FetchCampaignDonationsTests(APITestCase):
    def setUp(self):
        _reset_token_cache()

    def test_paginates_until_cursor_exhausted(self):
        pages = [
            _resp({'data': [_donation_obj(1), _donation_obj(2)],
                   'metadata': {'after': 'CURSOR2'}}),
            _resp({'data': [_donation_obj(3)], 'metadata': {'after': None}}),
        ]
        with patch('api.tiltify.requests.get', side_effect=pages) as mock_get:
            out = tiltify.fetch_campaign_donations('12345')
        self.assertEqual([d['id'] for d in out], ['1', '2', '3'])
        self.assertEqual(mock_get.call_count, 2)

    def test_early_stop_when_page_all_known(self):
        page1 = _resp({'data': [_donation_obj(1), _donation_obj(2)],
                       'metadata': {'after': 'CURSOR2'}})
        with patch('api.tiltify.requests.get', return_value=page1) as mock_get:
            out = tiltify.fetch_campaign_donations('12345', known_ids={'1', '2'})
        self.assertEqual(len(out), 2)
        self.assertEqual(mock_get.call_count, 1)  # didn't follow the cursor

    def test_non_ok_raises(self):
        with patch('api.tiltify.requests.get',
                   return_value=_resp('nope', ok=False, status_code=404)):
            with self.assertRaises(tiltify.TiltifyError):
                tiltify.fetch_campaign_donations('missing')


@override_settings(
    TILTIFY_CLIENT_ID='cid', TILTIFY_CLIENT_SECRET='secret',
    TILTIFY_ACCESS_TOKEN='static',
)
class IngestEventTests(APITestCase):
    def setUp(self):
        _reset_token_cache()
        self.event = _event()
        _tlt_page(self.event, '12345')

    def _patch_donations(self, donations):
        body = _resp({'data': donations, 'metadata': {'after': None}})
        return patch('api.tiltify.requests.get', return_value=body)

    def test_ingests_and_maps_fields(self):
        donations = [
            _donation_obj(1, value='10.00', currency='GBP'),
            _donation_obj(2, value='0'),    # skipped (£0)
            _donation_obj(3, value='-1'),   # skipped (<0)
        ]
        # The trailing sync_page_total call also hits requests.get; give it a
        # summary body via a side-effect that returns donations first.
        with patch('api.tiltify.requests.get') as mock_get:
            mock_get.side_effect = [
                _resp({'data': donations, 'metadata': {'after': None}}),
                _resp({'data': {'total_amount_raised': {'value': '10.00',
                                                        'currency': 'GBP'},
                                'donation_count': 1, 'status': 'published',
                                'id': '12345'}}),
            ]
            result = tiltify.ingest_event(self.event)
        self.assertEqual(result['total_ingested'], 1)
        self.assertEqual(models.Donation.objects.count(), 1)
        d = models.Donation.objects.get()
        self.assertEqual(d.platform, models.DonationPlatform.TILTIFY)
        self.assertEqual(d.external_id, '1')
        self.assertEqual(d.amount, Decimal('10.00'))
        self.assertEqual(d.currency, 'GBP')
        # completed_at → donated_at (2021-01-16), NOT ingest time.
        self.assertEqual(d.donated_at.year, 2021)

    def test_rerun_dedupes_and_counts_only_new(self):
        with self._patch_donations([_donation_obj(1)]):
            first = tiltify.ingest_event(self.event)
            second = tiltify.ingest_event(self.event)
        self.assertEqual(first['total_ingested'], 1)
        self.assertEqual(second['total_ingested'], 0)
        self.assertEqual(models.Donation.objects.count(), 1)

    def test_skips_when_no_active_event(self):
        self.event.is_active = False
        self.event.save()
        with self.assertRaises(tiltify.TiltifyError):
            tiltify.ingest_active_event()


@override_settings(
    TILTIFY_CLIENT_ID='cid', TILTIFY_CLIENT_SECRET='secret',
    TILTIFY_ACCESS_TOKEN='static',
)
class CampaignSummaryTests(APITestCase):
    def setUp(self):
        _reset_token_cache()
        self.event = _event()
        self.page = _tlt_page(self.event, '12345')

    def _summary_resp(self, **over):
        data = {
            'id': '12345',
            'total_amount_raised': {'value': '360.00', 'currency': 'GBP'},
            'donation_count': 16,
            'status': 'published',
        }
        data.update(over)
        return _resp({'data': data})

    def test_fetch_campaign_summary_maps_fields(self):
        with patch('api.tiltify.requests.get', return_value=self._summary_resp()):
            s = tiltify.fetch_campaign_summary('12345')
        self.assertEqual(s['raised'], Decimal('360.00'))
        self.assertEqual(s['donation_count'], 16)
        self.assertEqual(s['currency'], 'GBP')
        self.assertEqual(s['status'], 'published')

    def test_sync_page_total_stores_aggregate(self):
        with patch('api.tiltify.requests.get', return_value=self._summary_resp()):
            tiltify.sync_page_total(self.page)
        self.page.refresh_from_db()
        self.assertEqual(self.page.total_raised, Decimal('360.00'))
        self.assertEqual(self.page.total_donation_count, 16)
        self.assertEqual(self.page.total_currency, 'GBP')
        self.assertEqual(self.page.total_status, 'published')
        self.assertIsNotNone(self.page.total_synced_at)

    def test_sync_page_total_rejects_non_tiltify(self):
        page = models.DonationPage.objects.create(
            event=self.event, platform=models.DonationPlatform.JUSTGIVING,
            url='https://justgiving.com/x', external_id='abc',
        )
        with self.assertRaises(tiltify.TiltifyError):
            tiltify.sync_page_total(page)


@override_settings(
    TILTIFY_CLIENT_ID='cid', TILTIFY_CLIENT_SECRET='secret',
    TILTIFY_ACCESS_TOKEN='static', TILTIFY_WEBHOOK_SECRET='',
)
class EndpointTests(APITestCase):
    def setUp(self):
        _reset_token_cache()
        self.event = _event()
        _tlt_page(self.event, '12345')

    def test_status_is_public_and_reports_config(self):
        res = self.client.get('/api/tiltify/status/')
        self.assertEqual(res.status_code, 200)
        self.assertTrue(res.data['creds_present'])
        self.assertFalse(res.data['webhook_secret_present'])
        self.assertEqual(res.data['api_base'], 'https://v5api.tiltify.com')
        self.assertEqual(
            [c['campaign_id'] for c in res.data['campaigns']], ['12345'],
        )

    def test_test_endpoint_requires_operator(self):
        res = self.client.post('/api/tiltify/test/')
        self.assertIn(res.status_code, (401, 403))

    def _operator(self, username, clerk):
        user = get_user_model().objects.create_user(username=username, password='x')
        models.Profile.objects.create(
            user=user, clerk_user_id=clerk, role=models.Profile.ROLE_OPERATOR,
        )
        self.client.force_authenticate(user=user)

    def test_test_endpoint_ingests_for_operator(self):
        self._operator('tlt-op', 'clerk_tlt')
        with patch('api.tiltify.requests.get') as mock_get:
            mock_get.side_effect = [
                _resp({'data': [_donation_obj(9)], 'metadata': {'after': None}}),
                _resp({'data': {'total_amount_raised': {'value': '10.00',
                                                        'currency': 'GBP'},
                                'donation_count': 1, 'status': 'published',
                                'id': '12345'}}),
            ]
            res = self.client.post('/api/tiltify/test/')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data['total_ingested'], 1)
        self.assertEqual(models.Donation.objects.count(), 1)

    def test_sync_total_endpoint_for_tiltify_page(self):
        self._operator('tlt-op2', 'clerk_tlt2')
        page = models.DonationPage.objects.get(external_id='12345')
        summary = _resp({'data': {'total_amount_raised': {'value': '360.00',
                                                          'currency': 'GBP'},
                                  'donation_count': 16, 'status': 'published',
                                  'id': '12345'}})
        with patch('api.tiltify.requests.get', return_value=summary):
            res = self.client.post(f'/api/donation-pages/{page.id}/sync_total/')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data['total_donation_count'], 16)


class WebhookTests(APITestCase):
    def setUp(self):
        self.event = _event()

    def _body(self, did='wh1'):
        return {
            'meta': {'event_type': 'public:direct:donationUpdated'},
            'data': {
                'id': did,
                'amount': {'value': '25.00', 'currency': 'GBP'},
                'donor_name': 'Webhook Donor',
                'donor_comment': 'via webhook',
            },
        }

    @override_settings(TILTIFY_WEBHOOK_SECRET='')
    def test_unsigned_ingests_when_no_secret(self):
        res = self.client.post('/api/webhooks/tiltify/', self._body(), format='json')
        self.assertEqual(res.status_code, 201)
        self.assertEqual(models.Donation.objects.count(), 1)
        d = models.Donation.objects.get()
        self.assertEqual(d.amount, Decimal('25.00'))
        self.assertEqual(d.external_id, 'wh1')

    @override_settings(TILTIFY_WEBHOOK_SECRET='whsecret')
    def test_valid_signature_ingests(self):
        body = self._body('wh-signed')
        raw = json.dumps(body).encode()
        ts = '1700000000'
        sig = base64.b64encode(
            hmac.new(b'whsecret', f'{ts}.'.encode() + raw, hashlib.sha256).digest()
        ).decode()
        res = self.client.post(
            '/api/webhooks/tiltify/', raw, content_type='application/json',
            HTTP_X_TILTIFY_SIGNATURE=sig, HTTP_X_TILTIFY_TIMESTAMP=ts,
        )
        self.assertEqual(res.status_code, 201)
        self.assertEqual(models.Donation.objects.count(), 1)

    @override_settings(TILTIFY_WEBHOOK_SECRET='whsecret')
    def test_invalid_signature_rejected(self):
        body = self._body('wh-bad')
        raw = json.dumps(body).encode()
        res = self.client.post(
            '/api/webhooks/tiltify/', raw, content_type='application/json',
            HTTP_X_TILTIFY_SIGNATURE='not-the-right-sig', HTTP_X_TILTIFY_TIMESTAMP='1700000000',
        )
        self.assertEqual(res.status_code, 401)
        self.assertEqual(models.Donation.objects.count(), 0)

    @override_settings(TILTIFY_WEBHOOK_SECRET='whsecret')
    def test_missing_signature_rejected(self):
        res = self.client.post('/api/webhooks/tiltify/', self._body('wh-nosig'), format='json')
        self.assertEqual(res.status_code, 401)

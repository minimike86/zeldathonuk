"""Tiltify v5 donation ingestion.

Tiltify offers both real-time webhooks (see ``webhooks.tiltify_webhook``) and a
polled public API. This module is the *polling* half — a backfill/safety-net
that pulls a campaign's donations through the same writer the webhook uses, so
the two converge on one idempotent ``Donation`` row per
``(platform, external_id)``.

Unlike JustGiving's App-ID-in-the-path scheme, Tiltify v5 is OAuth2: the app
exchanges client credentials (``settings.TILTIFY_CLIENT_ID`` /
``TILTIFY_CLIENT_SECRET``) for a short-lived ``Bearer`` access token
(``scope=public``), cached here and refreshed on expiry. A static
``settings.TILTIFY_ACCESS_TOKEN`` may be set to override the fetch (one-off
tests).

The campaign id(s) to poll come from the active event's
:class:`api.models.DonationPage` rows (``platform='tiltify'``, ``external_id`` =
campaign id), matching JustGiving's per-event configuration. ``ingest_event`` is
shared by the ``poll_donations`` command and the ``/api/tiltify/test/`` button,
so both take exactly one path.

Donations are written through :func:`api.webhooks._ingest`, which dedupes on
``(platform, external_id)`` via ``update_or_create`` and fires the milestone
signal — the same writer the webhooks and other pollers use.
"""
from __future__ import annotations

import re
import time
from datetime import datetime
from decimal import Decimal, InvalidOperation

import requests
from django.conf import settings
from django.utils import timezone

from . import models
from .webhooks import _active_event, _ingest

# Tiltify v5 API host (OAuth token + public resources both live here).
_API_BASE = 'https://v5api.tiltify.com'

# A campaign UUID — used as-is against the donations/details endpoints.
_UUID_RE = re.compile(
    r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$', re.I,
)

# Resolved-slug cache: 'userslug/campaignslug' → campaign UUID. Saves a lookup
# on every poll tick once a slug has been resolved.
_campaign_id_cache: dict[str, str] = {}

# How many donations to request per page, and a safety ceiling on pages so a
# misconfigured campaign id can't spin forever.
_PAGE_SIZE = 100
_MAX_PAGES = 50

# Network timeout (seconds) for each request.
_TIMEOUT = 20

# Re-fetch the access token this many seconds before it actually expires, so a
# request never races a token that lapses mid-flight.
_TOKEN_SKEW = 60

# Module-level access-token cache: (token, expires_at_epoch). Each process keeps
# its own — the web and scheduler containers each fetch once per ~token life.
_token_cache: tuple[str, float] | None = None


class TiltifyError(RuntimeError):
    """Raised when the Tiltify API can't be reached or is misconfigured."""


def api_base() -> str:
    """Tiltify v5 API host root."""
    return _API_BASE


def _get_access_token(*, force: bool = False) -> str:
    """Return a valid Tiltify access token, fetching/refreshing as needed.

    A non-empty ``settings.TILTIFY_ACCESS_TOKEN`` short-circuits the OAuth
    exchange (manual override). Otherwise the client-credentials grant runs
    against ``{base}/oauth/token`` and the result is cached until shortly
    before it expires. Raises :class:`TiltifyError` when no credentials are
    configured or the token endpoint fails.
    """
    global _token_cache

    override = (settings.TILTIFY_ACCESS_TOKEN or '').strip()
    if override:
        return override

    if not force and _token_cache is not None:
        token, expires_at = _token_cache
        if time.time() < expires_at - _TOKEN_SKEW:
            return token

    client_id = (settings.TILTIFY_CLIENT_ID or '').strip()
    client_secret = (settings.TILTIFY_CLIENT_SECRET or '').strip()
    if not client_id or not client_secret:
        raise TiltifyError(
            'TILTIFY_CLIENT_ID / TILTIFY_CLIENT_SECRET are not set.'
        )
    try:
        resp = requests.post(
            f'{_API_BASE}/oauth/token',
            data={
                'grant_type': 'client_credentials',
                'client_id': client_id,
                'client_secret': client_secret,
                'scope': 'public',
            },
            timeout=_TIMEOUT,
        )
    except requests.RequestException as exc:
        raise TiltifyError(f'Tiltify token request failed: {exc}') from exc
    if not resp.ok:
        raise TiltifyError(
            f'Tiltify token error {resp.status_code}: {resp.text[:200]}'
        )
    body = resp.json() or {}
    token = body.get('access_token')
    if not token:
        raise TiltifyError('Tiltify token response had no access_token.')
    expires_in = int(body.get('expires_in') or 3600)
    _token_cache = (token, time.time() + expires_in)
    return token


def _auth_headers() -> dict:
    return {
        'Authorization': f'Bearer {_get_access_token()}',
        'Accept': 'application/json',
    }


def event_pages(event: 'models.Event') -> list[dict]:
    """The Tiltify campaign id(s) to poll for an event.

    Sourced solely from the event's configured DonationPages
    (``platform='tiltify'`` with a non-empty ``external_id``) — no global
    fallback. Returns ``[{campaign_id, label, url, is_primary}]``; empty when
    the event has no Tiltify page linked.
    """
    pages: list[dict] = []
    qs = event.donation_pages.filter(
        platform=models.DonationPlatform.TILTIFY,
    ).exclude(external_id='')
    for p in qs:
        pages.append({
            'campaign_id': p.external_id.strip(),
            'label': p.label or 'Tiltify',
            'url': p.url,
            'is_primary': p.is_primary,
        })
    return pages


def _resolve_campaign_id(raw: str) -> str:
    """Resolve a DonationPage ``external_id`` to a Tiltify campaign id usable
    against the public endpoints.

    Accepts three forms:

    * a campaign **UUID** (``a1b2…``) — returned as-is;
    * a **legacy numeric id** (``12345``) — returned as-is;
    * a **``userslug/campaignslug``** pair — looked up via
      ``/api/public/campaigns/by/slugs/{user}/{campaign}`` and resolved to the
      UUID (cached thereafter).

    A bare campaign slug (no ``/``) can't be resolved — the user/team slug is
    required — so it raises :class:`TiltifyError` with guidance. The endpoints
    reject a slug as ``legacy_campaign_id is invalid`` (HTTP 422), so we resolve
    before calling them.
    """
    value = (raw or '').strip().strip('/')
    if not value:
        raise TiltifyError('Page has no campaign id (external_id).')
    if _UUID_RE.match(value) or value.isdigit():
        return value
    if '/' in value:
        if value in _campaign_id_cache:
            return _campaign_id_cache[value]
        user_slug, _, campaign_slug = value.partition('/')
        user_slug = user_slug.lstrip('@').strip()
        campaign_slug = campaign_slug.strip().strip('/')
        url = f'{_API_BASE}/api/public/campaigns/by/slugs/{user_slug}/{campaign_slug}'
        try:
            resp = requests.get(url, headers=_auth_headers(), timeout=_TIMEOUT)
        except requests.RequestException as exc:
            raise TiltifyError(f'Tiltify request failed: {exc}') from exc
        if not resp.ok:
            raise TiltifyError(
                f'Tiltify could not resolve campaign slug '
                f'"{user_slug}/{campaign_slug}" ({resp.status_code}): '
                f'{resp.text[:200]}'
            )
        data = (resp.json() or {}).get('data') or {}
        resolved = str(data.get('id') or '')
        if not resolved:
            raise TiltifyError(
                f'Tiltify returned no id for slug "{user_slug}/{campaign_slug}".'
            )
        _campaign_id_cache[value] = resolved
        return resolved
    raise TiltifyError(
        f'"{value}" is a bare campaign slug — Tiltify needs the campaign UUID, '
        'a legacy numeric id, or the "userslug/campaignslug" pair from the '
        'campaign URL (tiltify.com/@USERSLUG/CAMPAIGNSLUG).'
    )


def fetch_campaign_donations(
    campaign_id: str,
    *,
    known_ids: set[str] | None = None,
    page_size: int = _PAGE_SIZE,
    max_pages: int = _MAX_PAGES,
) -> list[dict]:
    """Fetch a campaign's donations, newest-first, paginating until exhausted.

    Tiltify v5 paginates with a cursor: each response carries
    ``metadata.after``, which is passed back as the ``after`` query param to
    fetch the next page. When ``known_ids`` is supplied, stop as soon as a page
    contains only already-ingested donation ids — donations come back
    newest-first, so once an entire page is known there's nothing newer beyond
    it. Raises :class:`TiltifyError` on a non-OK response.
    """
    base = api_base()
    resolved_id = _resolve_campaign_id(campaign_id)
    collected: list[dict] = []
    after: str | None = None
    page = 0
    while page < max_pages:
        params: dict = {'limit': page_size}
        if after:
            params['after'] = after
        url = f'{base}/api/public/campaigns/{resolved_id}/donations'
        try:
            resp = requests.get(
                url, headers=_auth_headers(), params=params, timeout=_TIMEOUT,
            )
        except requests.RequestException as exc:
            raise TiltifyError(f'Tiltify request failed: {exc}') from exc
        if not resp.ok:
            raise TiltifyError(
                f'Tiltify error {resp.status_code}: {resp.text[:200]}'
            )
        body = resp.json() or {}
        items = body.get('data') or []
        if not items:
            break
        collected.extend(items)
        if known_ids is not None:
            page_ids = {str(d.get('id') or '') for d in items}
            # Every id on this page already ingested → nothing newer behind it.
            if page_ids and page_ids <= known_ids:
                break
        after = (body.get('metadata') or {}).get('after')
        if not after:
            break
        page += 1
    return collected


def _amount(value) -> Decimal | None:
    """Tiltify amounts are ``{'value': '5.00', 'currency': 'USD'}``; accept a
    bare scalar too."""
    if isinstance(value, dict):
        value = value.get('value')
    try:
        return Decimal(str(value))
    except (InvalidOperation, TypeError, ValueError):
        return None


def _currency(value, default: str = 'GBP') -> str:
    if isinstance(value, dict):
        return value.get('currency') or default
    return default


def _parse_iso(value: str | None):
    """Parse a Tiltify ISO-8601 timestamp; fall back to now() so a row still
    saves when the field is absent/unparseable."""
    if not value:
        return timezone.now()
    try:
        return datetime.fromisoformat(value.replace('Z', '+00:00'))
    except (ValueError, TypeError):
        return timezone.now()


def fetch_campaign_summary(campaign_id: str) -> dict:
    """Fetch a campaign's aggregate from the campaign-details endpoint.

    Returns ``{raised, donation_count, currency, status, page_id}`` mapped from
    ``total_amount_raised {value,currency}`` and ``status``. Raises
    :class:`TiltifyError` on a non-OK response.
    """
    base = api_base()
    resolved_id = _resolve_campaign_id(campaign_id)
    url = f'{base}/api/public/campaigns/{resolved_id}'
    try:
        resp = requests.get(url, headers=_auth_headers(), timeout=_TIMEOUT)
    except requests.RequestException as exc:
        raise TiltifyError(f'Tiltify request failed: {exc}') from exc
    if not resp.ok:
        raise TiltifyError(
            f'Tiltify error {resp.status_code}: {resp.text[:200]}'
        )
    body = (resp.json() or {}).get('data')
    if not isinstance(body, dict):
        body = {}
    total = body.get('total_amount_raised') or body.get('amount_raised')
    count = body.get('donation_count')
    return {
        'raised': _amount(total),
        'donation_count': int(count) if count is not None else None,
        'currency': _currency(total, default=''),
        'status': body.get('status') or '',
        'page_id': str(body.get('id') or campaign_id),
    }


def sync_page_total(page: 'models.DonationPage') -> None:
    """Sync a Tiltify DonationPage's cached aggregate total in place.

    Keyed on the campaign id in ``external_id``. Raises :class:`TiltifyError`
    for a non-Tiltify page, a blank campaign id, or a transport/config problem.
    """
    if page.platform != models.DonationPlatform.TILTIFY:
        raise TiltifyError('Totals sync is Tiltify-only.')
    campaign_id = (page.external_id or '').strip()
    if not campaign_id:
        raise TiltifyError('Page has no campaign id (external_id).')
    summary = fetch_campaign_summary(campaign_id)
    page.total_raised = summary['raised']
    page.total_donation_count = summary['donation_count']
    page.total_currency = summary['currency']
    page.total_status = summary['status']
    page.total_synced_at = timezone.now()
    page.save(update_fields=[
        'total_raised', 'total_donation_count', 'total_currency',
        'total_status', 'total_synced_at',
    ])


def ingest_event(event: 'models.Event') -> dict:
    """Pull + ingest donations for every Tiltify campaign on ``event``.

    Returns ``{'pages': [{campaign_id, fetched, ingested}], 'total_ingested'}``.
    Raises :class:`TiltifyError` for config/transport problems so callers can
    surface them.
    """
    pages = event_pages(event)
    known_ids = set(
        models.Donation.objects.filter(
            platform=models.DonationPlatform.TILTIFY,
        ).values_list('external_id', flat=True)
    )
    results: list[dict] = []
    total_ingested = 0
    for page in pages:
        campaign_id = page['campaign_id']
        donations = fetch_campaign_donations(campaign_id, known_ids=known_ids)
        ingested = 0
        for d in donations:
            amount = _amount(d.get('amount'))
            if amount is None or amount <= 0:
                continue
            external_id = str(d.get('id') or '').strip()
            if not external_id:
                continue
            was_known = external_id in known_ids
            donation = _ingest(
                platform=models.DonationPlatform.TILTIFY,
                external_id=external_id,
                donor_name=d.get('donor_name', 'Anonymous') or 'Anonymous',
                amount=amount,
                currency=_currency(d.get('amount')),
                message=d.get('donor_comment', '') or d.get('comment', '') or '',
                donated_at=_parse_iso(d.get('completed_at') or d.get('created_at')),
            )
            if donation is not None:
                known_ids.add(external_id)
                # Count only genuinely-new donations so "Fetch now" reports new
                # arrivals, not idempotent re-writes of the whole campaign.
                if not was_known:
                    ingested += 1
        results.append({
            'campaign_id': campaign_id,
            'fetched': len(donations),
            'ingested': ingested,
        })
        total_ingested += ingested
    # Keep each campaign's cached aggregate fresh alongside the itemized stream.
    # Best-effort — a summary failure must not abort donation ingest.
    for page_obj in event.donation_pages.filter(
        platform=models.DonationPlatform.TILTIFY,
    ).exclude(external_id=''):
        try:
            sync_page_total(page_obj)
        except TiltifyError:
            pass
    return {'pages': results, 'total_ingested': total_ingested}


def ingest_active_event() -> dict:
    """Convenience wrapper: ingest for the active event, or raise if none."""
    event = _active_event()
    if not event:
        raise TiltifyError('No active event.')
    return ingest_event(event)

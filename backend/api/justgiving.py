"""JustGiving donation ingestion.

JustGiving has no native real-time webhooks, so donations are pulled by
polling the public *fundraising page donations* endpoint:

    {base}/{appId}/v1/fundraising/pages/{shortName}/donations

The App ID (``settings.JUSTGIVING_API_KEY``) goes in the URL path; the page
short name(s) come from the active event's :class:`api.models.DonationPage`
rows (``platform='justgiving'``, ``external_id`` = short name), matching how
the rest of the donation system is configured per-event. ``ingest_event`` is
shared by the ``poll_donations`` management command (scheduler tick) and the
``/api/justgiving/test/`` "fetch now" button, so both take exactly one path.

Donations are written through :func:`api.webhooks._ingest`, which dedupes on
``(platform, external_id)`` via ``update_or_create`` and fires the milestone
signal — the same writer the webhooks and other pollers use.
"""
from __future__ import annotations

import logging
from datetime import datetime, timezone as dt_timezone
from decimal import Decimal, InvalidOperation

import requests
from django.conf import settings
from django.utils import timezone

from . import models
from .webhooks import _active_event, _ingest

logger = logging.getLogger(__name__)

# Host roots for the two JustGiving environments, selected by JUSTGIVING_ENV.
_BASES = {
    'production': 'https://api.justgiving.com',
    'staging': 'https://api.staging.justgiving.com',
}

# JustGiving donation statuses. Only money that has actually cleared should
# count toward the total — Pending may still be Rejected/Cancelled later, and
# would be picked up on a later poll once it flips to Accepted.
_ACCEPTED_STATUSES = {'accepted'}

# How many donations to request per page, and a safety ceiling on pages so a
# misconfigured short name can't spin forever.
_PAGE_SIZE = 150
_MAX_PAGES = 50

# Network timeout (seconds) for each request.
_TIMEOUT = 20


class JustGivingError(RuntimeError):
    """Raised when the JustGiving API can't be reached or is misconfigured."""


def _raise_for_response(resp, short_name: str) -> None:
    """Raise a :class:`JustGivingError` describing a non-OK API response.

    A 404 on the v1 fundraising endpoint almost always means the short name
    isn't a *classic* fundraising page — most commonly because it's one of
    JustGiving's newer ``justgiving.com/page/{slug}`` "Page" products, which the
    legacy v1 API doesn't serve. Spell that out so a 404 here doesn't read as a
    mysterious bug."""
    if resp.status_code == 404:
        raise JustGivingError(
            f'JustGiving 404 for "{short_name}": no classic fundraising page '
            f'with that short name. If your page URL is '
            f'justgiving.com/page/{short_name} (the newer "Page" product), the '
            f'legacy v1 API does not serve it — use a classic '
            f'/fundraising/ page or the JustGiving Data API once access is '
            f'granted.'
        )
    raise JustGivingError(
        f'JustGiving error {resp.status_code}: {resp.text[:200]}'
    )


def api_base() -> str:
    """Host root for the configured JustGiving environment — production
    (api.justgiving.com) or staging (api.staging.justgiving.com)."""
    env = (settings.JUSTGIVING_ENV or 'production').strip().lower()
    return _BASES.get(env, _BASES['production'])


def app_id() -> str:
    """The JustGiving App ID, or raise if it isn't configured."""
    appid = (settings.JUSTGIVING_API_KEY or '').strip()
    if not appid:
        raise JustGivingError('JUSTGIVING_API_KEY (App ID) is not set.')
    return appid


def event_pages(event: 'models.Event') -> list[dict]:
    """The JustGiving page short name(s) to poll for an event.

    Sourced solely from the event's configured DonationPages
    (``platform='justgiving'`` with a non-empty ``external_id``) — no global
    fallback. Returns ``[{short_name, label, url, is_primary}]``; empty when
    the event has no JustGiving page linked.
    """
    pages: list[dict] = []
    qs = event.donation_pages.filter(
        platform=models.DonationPlatform.JUSTGIVING,
    ).exclude(external_id='')
    for p in qs:
        pages.append({
            'short_name': p.external_id.strip(),
            'label': p.label or 'JustGiving',
            'url': p.url,
            'is_primary': p.is_primary,
        })
    return pages


def fetch_page_donations(
    short_name: str,
    *,
    known_ids: set[str] | None = None,
    page_size: int = _PAGE_SIZE,
    max_pages: int = _MAX_PAGES,
) -> list[dict]:
    """Fetch a page's donations, newest-first, paginating until exhausted.

    When ``known_ids`` is supplied, stop as soon as a page contains only
    already-ingested donation ids — donations come back newest-first, so once
    an entire page is known there's nothing newer beyond it. Keeps each poll
    proportional to the number of *new* donations rather than the whole
    history. Raises :class:`JustGivingError` on a non-OK response.
    """
    base = api_base()
    appid = app_id()
    collected: list[dict] = []
    page = 1
    while page <= max_pages:
        url = f'{base}/{appid}/v1/fundraising/pages/{short_name}/donations'
        try:
            resp = requests.get(
                url,
                headers={'Accept': 'application/json'},
                params={'pageSize': page_size, 'page': page},
                timeout=_TIMEOUT,
            )
        except requests.RequestException as exc:
            raise JustGivingError(f'JustGiving request failed: {exc}') from exc
        if not resp.ok:
            _raise_for_response(resp, short_name)
        body = resp.json() or {}
        items = body.get('donations') or []
        if not items:
            break
        collected.extend(items)
        if known_ids is not None:
            page_ids = {str(d.get('id') or d.get('donationRef') or '') for d in items}
            # Every id on this page already ingested → nothing newer behind it.
            if page_ids and page_ids <= known_ids:
                break
        # Respect the API's own page count when present.
        total_pages = (body.get('pagination') or {}).get('totalPages')
        if total_pages is not None and page >= int(total_pages):
            break
        page += 1
    return collected


def _amount(value) -> Decimal | None:
    try:
        return Decimal(str(value))
    except (InvalidOperation, TypeError, ValueError):
        return None


def _parse_jg_date(value: str):
    """JustGiving emits ``/Date(1610767455000+0000)/``. Pull the millis out;
    fall back to now() when absent/unparseable so a row still saves."""
    if not value:
        return timezone.now()
    try:
        millis = int(value[6:-7])
        return datetime.fromtimestamp(millis / 1000, tz=dt_timezone.utc)
    except (ValueError, IndexError):
        return timezone.now()


def fetch_page_summary(short_name: str) -> dict:
    """Fetch a page's aggregate from the page-details endpoint.

    Unlike the donations feed (which goes empty once a page is "Completed"),
    the page-details endpoint keeps reporting the running total + donation
    count for the life of the page — so this is how past events' totals stay
    visible. Returns ``{raised, donation_count, currency, status, page_id}``.
    Raises :class:`JustGivingError` on a non-OK response.
    """
    base = api_base()
    appid = app_id()
    url = f'{base}/{appid}/v1/fundraising/pages/{short_name}'
    try:
        resp = requests.get(
            url, headers={'Accept': 'application/json'}, timeout=_TIMEOUT,
        )
    except requests.RequestException as exc:
        raise JustGivingError(f'JustGiving request failed: {exc}') from exc
    if not resp.ok:
        _raise_for_response(resp, short_name)
    body = resp.json() or {}
    count = body.get('donationCount')
    return {
        # Same basis as the itemized donations (excludes Gift Aid).
        'raised': _amount(body.get('grandTotalRaisedExcludingGiftAid')),
        'donation_count': int(count) if count is not None else None,
        'currency': body.get('currencyCode') or '',
        'status': body.get('status') or '',
        'page_id': str(body.get('pageId') or ''),
    }


def sync_page_total(page: 'models.DonationPage') -> None:
    """Sync a JustGiving DonationPage's cached aggregate total in place.

    Works for any event's page (including completed/past ones) — keyed on the
    page short name in ``external_id``. Raises :class:`JustGivingError` for a
    non-JustGiving page, a blank short name, or a transport/config problem.
    """
    if page.platform != models.DonationPlatform.JUSTGIVING:
        raise JustGivingError('Totals sync is JustGiving-only.')
    short_name = (page.external_id or '').strip()
    if not short_name:
        raise JustGivingError('Page has no short name (external_id).')
    summary = fetch_page_summary(short_name)
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
    """Pull + ingest donations for every JustGiving page on ``event``.

    Returns ``{'pages': [{short_name, fetched, ingested}], 'total_ingested'}``.
    Raises :class:`JustGivingError` for config/transport problems so callers
    can surface them.
    """
    pages = event_pages(event)
    known_ids = set(
        models.Donation.objects.filter(
            platform=models.DonationPlatform.JUSTGIVING,
        ).values_list('external_id', flat=True)
    )
    results: list[dict] = []
    total_ingested = 0
    for page in pages:
        short_name = page['short_name']
        try:
            donations = fetch_page_donations(short_name, known_ids=known_ids)
        except JustGivingError as exc:
            # One unreachable/unsupported page (e.g. a new /page/ product that
            # 404s on the v1 API) must not suppress the event's other pages.
            logger.warning('JustGiving page %s skipped: %s', short_name, exc)
            results.append({
                'short_name': short_name, 'fetched': 0, 'ingested': 0,
                'error': str(exc),
            })
            continue
        ingested = 0
        for d in donations:
            # Only count cleared donations; Pending/Rejected/Cancelled are
            # skipped (a Pending one is re-polled once it flips to Accepted).
            status = str(d.get('status') or 'Accepted').strip().lower()
            if status not in _ACCEPTED_STATUSES:
                continue
            amount = _amount(d.get('amount'))
            if amount is None or amount <= 0:
                continue
            external_id = str(d.get('id') or d.get('donationRef') or '').strip()
            if not external_id:
                continue
            was_known = external_id in known_ids
            donation = _ingest(
                platform=models.DonationPlatform.JUSTGIVING,
                external_id=external_id,
                donor_name=d.get('donorDisplayName', 'Anonymous') or 'Anonymous',
                amount=amount,
                currency=d.get('currencyCode', 'GBP') or 'GBP',
                message=d.get('message', '') or '',
                donated_at=_parse_jg_date(d.get('donationDate', '')),
                gift_aid_amount=(
                    _amount(d.get('estimatedTaxReclaim'))
                    if d.get('estimatedTaxReclaim')
                    else None
                ),
                image_url=d.get('image', '') or '',
            )
            if donation is not None:
                known_ids.add(external_id)
                # Count only genuinely-new donations so "Fetch now" reports
                # new arrivals, not idempotent re-writes of the whole page.
                if not was_known:
                    ingested += 1
        results.append({
            'short_name': short_name,
            'fetched': len(donations),
            'ingested': ingested,
        })
        total_ingested += ingested
    # Keep each page's cached aggregate fresh alongside the itemized stream,
    # so the per-page total in /control/events stays current during a live
    # show. Best-effort — a summary failure must not abort donation ingest.
    for page_obj in event.donation_pages.filter(
        platform=models.DonationPlatform.JUSTGIVING,
    ).exclude(external_id=''):
        try:
            sync_page_total(page_obj)
        except JustGivingError:
            pass
    return {'pages': results, 'total_ingested': total_ingested}


def ingest_active_event() -> dict:
    """Convenience wrapper: ingest for the active event, or raise if none."""
    event = _active_event()
    if not event:
        raise JustGivingError('No active event.')
    return ingest_event(event)

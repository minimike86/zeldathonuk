"""Webhook ingest endpoints for donation platforms.

Each platform POSTs to its own URL; we normalise to a `Donation` row keyed
by `external_id` so re-deliveries are idempotent.

JustGiving: configure the webhook URL in the JustGiving dashboard.
Tiltify:    configure via Tiltify's webhook setup (campaign settings).
Facebook:   no public donor webhook API — out of scope.
Twitch:     no public donor webhook API — out of scope.

In dev these are unauthenticated. Add signature verification before exposing
publicly (HMAC headers vary per platform).
"""
from __future__ import annotations

from decimal import Decimal
from typing import Any

from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response

from . import models


def _active_event() -> models.Event | None:
    return models.Event.objects.filter(is_active=True).first()


def _ingest(
    *,
    platform: str,
    external_id: str,
    donor_name: str,
    amount: Decimal,
    currency: str = 'GBP',
    message: str = '',
    donated_at: Any | None = None,
    gift_aid_amount: Decimal | None = None,
    image_url: str = '',
) -> models.Donation | None:
    event = _active_event()
    if not event:
        return None
    donation, _ = models.Donation.objects.update_or_create(
        platform=platform,
        external_id=external_id,
        defaults={
            'event': event,
            'donor_name': donor_name or 'Anonymous',
            'amount': amount,
            'currency': currency or 'GBP',
            'message': message or '',
            'donated_at': donated_at or timezone.now(),
            'gift_aid_amount': gift_aid_amount,
            'image_url': image_url or '',
        },
    )
    return donation


# ──────────────────────────────────────────────────────────────────────────────
# JustGiving webhook — fields documented at
# https://api.justgiving.com/docs/resources/v1/Donation/Webhook
# ──────────────────────────────────────────────────────────────────────────────
@api_view(['POST'])
@permission_classes([AllowAny])
def justgiving_webhook(request: Request) -> Response:
    payload = request.data or {}
    external_id = str(payload.get('donationRef') or payload.get('id') or '')
    if not external_id:
        return Response({'error': 'donationRef/id required'}, status=400)
    donation = _ingest(
        platform=models.DonationPlatform.JUSTGIVING,
        external_id=external_id,
        donor_name=payload.get('donorDisplayName', 'Anonymous'),
        amount=Decimal(str(payload.get('amount', '0'))),
        currency=payload.get('currencyCode', 'GBP'),
        message=payload.get('message', ''),
        gift_aid_amount=(
            Decimal(str(payload['estimatedTaxReclaim']))
            if payload.get('estimatedTaxReclaim')
            else None
        ),
        image_url=payload.get('image', '') or '',
    )
    if donation is None:
        return Response({'error': 'no active event'}, status=409)
    return Response({'id': donation.id, 'status': 'ok'}, status=201)


# ──────────────────────────────────────────────────────────────────────────────
# Tiltify webhook — campaign:donation.created
# https://developers.tiltify.com/webhooks-events
# ──────────────────────────────────────────────────────────────────────────────
@api_view(['POST'])
@permission_classes([AllowAny])
def tiltify_webhook(request: Request) -> Response:
    payload = request.data or {}
    data = payload.get('data', payload)
    external_id = str(data.get('id') or '')
    if not external_id:
        return Response({'error': 'id required'}, status=400)
    donation = _ingest(
        platform=models.DonationPlatform.TILTIFY,
        external_id=external_id,
        donor_name=data.get('donor_name', 'Anonymous'),
        amount=Decimal(str(data.get('amount', {}).get('value', data.get('amount', '0')))),
        currency=data.get('amount', {}).get('currency', 'GBP')
        if isinstance(data.get('amount'), dict)
        else 'GBP',
        message=data.get('donor_comment', '') or data.get('comment', '') or '',
    )
    if donation is None:
        return Response({'error': 'no active event'}, status=409)
    return Response({'id': donation.id, 'status': 'ok'}, status=201)


# ──────────────────────────────────────────────────────────────────────────────
# Generic webhook for everything else (curl test, Zapier, IFTTT) — same shape
# as the platform-specific ones but you supply `platform` in the body.
# ──────────────────────────────────────────────────────────────────────────────
@api_view(['POST'])
@permission_classes([AllowAny])
def generic_webhook(request: Request) -> Response:
    payload = request.data or {}
    platform = payload.get('platform', 'other')
    external_id = str(payload.get('external_id') or payload.get('id') or '')
    if not external_id:
        return Response({'error': 'external_id required'}, status=400)
    donation = _ingest(
        platform=platform,
        external_id=external_id,
        donor_name=payload.get('donor_name', 'Anonymous'),
        amount=Decimal(str(payload.get('amount', '0'))),
        currency=payload.get('currency', 'GBP'),
        message=payload.get('message', ''),
        gift_aid_amount=(
            Decimal(str(payload['gift_aid_amount']))
            if payload.get('gift_aid_amount')
            else None
        ),
        image_url=payload.get('image_url', ''),
    )
    if donation is None:
        return Response({'error': 'no active event'}, status=409)
    return Response({'id': donation.id, 'status': 'ok'}, status=201)

"""Twitch EventSub webhook intake.

Receives push notifications from Twitch (follows, subs, raids, bits)
and writes them into ``ExternalEvent`` so the omnibar can render them
on its next poll tick. Three message types matter:

1. ``webhook_callback_verification`` — fires when we register a new
   subscription. We must echo back the ``challenge`` string in the
   response body within 10 seconds.
2. ``notification`` — the actual event. Includes ``subscription.type``
   (``channel.follow``, ``channel.subscribe``, ``channel.raid``,
   ``channel.cheer`` etc.) and an ``event`` payload.
3. ``revocation`` — Twitch is telling us a subscription was killed
   (auth lapsed, target changed, etc.). We just log it.

Security: every request carries an HMAC-SHA256 signature in
``Twitch-Eventsub-Message-Signature`` computed as
``sha256=<hex>`` over ``message_id + timestamp + raw_body`` using
``settings.TWITCH_EVENTSUB_SECRET`` as the key. We reject anything
that doesn't verify when the secret is configured. When it isn't (dev
mode), verification is skipped — useful for local Twitch CLI
``trigger`` simulations.

Idempotency: Twitch can retry deliveries, so we dedupe by
``Twitch-Eventsub-Message-Id`` against the most recent
``ExternalEvent.payload['_msg_id']`` rows from the same source.
"""
from __future__ import annotations

import hashlib
import hmac
import json
from datetime import datetime, timezone as dt_timezone
from decimal import Decimal, ROUND_HALF_UP

from django.conf import settings
from django.http import HttpResponse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.request import Request
from rest_framework.response import Response

from . import models


HEADER_MSG_ID = 'twitch-eventsub-message-id'
HEADER_TIMESTAMP = 'twitch-eventsub-message-timestamp'
HEADER_SIGNATURE = 'twitch-eventsub-message-signature'
HEADER_MSG_TYPE = 'twitch-eventsub-message-type'

MSG_VERIFICATION = 'webhook_callback_verification'
MSG_NOTIFICATION = 'notification'
MSG_REVOCATION = 'revocation'


def _verify_signature(request: Request) -> bool:
    """Return True if the request signature matches our secret, OR if
    no secret is configured (dev mode)."""
    secret = getattr(settings, 'TWITCH_EVENTSUB_SECRET', '') or ''
    if not secret:
        return True
    msg_id = request.META.get(_meta_key(HEADER_MSG_ID), '')
    ts = request.META.get(_meta_key(HEADER_TIMESTAMP), '')
    sig = request.META.get(_meta_key(HEADER_SIGNATURE), '')
    if not (msg_id and ts and sig):
        return False
    body = request.body or b''
    payload = msg_id.encode() + ts.encode() + body
    expected = 'sha256=' + hmac.new(
        secret.encode(), payload, hashlib.sha256,
    ).hexdigest()
    return hmac.compare_digest(expected, sig)


def _meta_key(header: str) -> str:
    # Django flips - to _ and uppercases everything, prefixes HTTP_.
    return 'HTTP_' + header.upper().replace('-', '_')


def _already_seen(msg_id: str) -> bool:
    """Cheap dedupe: have we written an ExternalEvent for this exact
    msg_id in the recent past? Scan the last ~50 twitch events."""
    if not msg_id:
        return False
    recent = models.ExternalEvent.objects.filter(
        source=models.ExternalEvent.SOURCE_TWITCH,
    ).order_by('-occurred_at')[:50]
    for ev in recent:
        if ev.payload.get('_msg_id') == msg_id:
            return True
    return False


@csrf_exempt
@api_view(['POST'])
def eventsub_webhook(request: Request) -> Response:
    if not _verify_signature(request):
        return Response({'detail': 'Bad signature.'}, status=status.HTTP_403_FORBIDDEN)

    msg_type = request.META.get(_meta_key(HEADER_MSG_TYPE), '')
    body = request.data if isinstance(request.data, dict) else {}

    # 1. Verification challenge — echo the raw challenge string back. Must be a
    # plain HttpResponse, NOT a DRF Response: the only configured renderer is
    # JSONRenderer, which would wrap the string in quotes ("abc") and Twitch's
    # exact-match check on the challenge would then fail.
    if msg_type == MSG_VERIFICATION:
        return HttpResponse(
            body.get('challenge', ''),
            status=200,
            content_type='text/plain',
        )

    # 2. Revocation — Twitch dropped our subscription. Nothing to do
    # except log; we'll re-register on next setup pass.
    if msg_type == MSG_REVOCATION:
        return Response({'ok': True})

    # 3. Notification — translate to ExternalEvent.
    if msg_type != MSG_NOTIFICATION:
        return Response({'detail': 'Unknown message type.'}, status=status.HTTP_400_BAD_REQUEST)

    msg_id = request.META.get(_meta_key(HEADER_MSG_ID), '')
    if _already_seen(msg_id):
        return Response({'ok': True, 'duplicate': True})

    subscription = body.get('subscription') or {}
    event = body.get('event') or {}
    sub_type = str(subscription.get('type') or '').strip()
    if not sub_type:
        return Response({'detail': 'Missing subscription.type.'}, status=status.HTTP_400_BAD_REQUEST)

    occurred_at = _parse_iso(body.get('occurred_at')) or timezone.now()

    # Twitch Charity donations are funnelled into the normal donation pipeline
    # (totals / milestones / donation reel) rather than an omnibar takeover —
    # they become a Donation row, not an ExternalEvent.
    if sub_type == 'channel.charity_campaign.donate':
        _ingest_charity_donation(event, occurred_at)
        return Response({'ok': True}, status=status.HTTP_202_ACCEPTED)

    payload = dict(event)
    payload['_msg_id'] = msg_id
    payload['_subscription'] = {
        'id': subscription.get('id'),
        'type': sub_type,
        'version': subscription.get('version'),
    }

    models.ExternalEvent.objects.create(
        source=models.ExternalEvent.SOURCE_TWITCH,
        kind=_normalise_kind(sub_type),
        payload=payload,
        occurred_at=occurred_at,
    )
    return Response({'ok': True}, status=status.HTTP_202_ACCEPTED)


def _ingest_charity_donation(event: dict, occurred_at) -> bool:
    """Create a Donation from a channel.charity_campaign.donate event so Twitch
    Charity money counts toward the same total / milestones / donation reel as
    every other platform — no separate omnibar moment. Deduped by
    (platform, external_id) via the model's unique_together. Returns False when
    there's no active event to attach the donation to."""
    active = models.Event.objects.filter(is_active=True).first()
    if not active:
        return False
    amount_obj = event.get('amount') or {}
    try:
        value = int(amount_obj.get('value', 0))
        places = int(amount_obj.get('decimal_places', 2))
    except (TypeError, ValueError):
        return False
    if value <= 0:
        return False
    # Twitch sends the amount in minor units (value=1234, decimal_places=2 →
    # 12.34). Quantise to the Donation field's 2dp.
    amount = (Decimal(value) / (Decimal(10) ** places)).quantize(
        Decimal('0.01'), rounding=ROUND_HALF_UP,
    )
    currency = (amount_obj.get('currency') or 'GBP')[:3].upper()
    donor = (event.get('user_name') or '').strip() or 'Anonymous'
    # Prefer Twitch's stable donation id for dedupe; fall back to a composite so
    # retries of an id-less event don't pile up.
    ext_id = str(event.get('id') or '').strip() or (
        f"{event.get('campaign_id', '')}:{event.get('user_id', '')}:{value}"
    )
    models.Donation.objects.get_or_create(
        platform=models.DonationPlatform.TWITCH_CHARITY,
        external_id=ext_id,
        defaults={
            'event': active,
            'donor_name': donor,
            'amount': amount,
            'currency': currency,
            'donated_at': occurred_at,
        },
    )
    return True


def _normalise_kind(twitch_type: str) -> str:
    """Map Twitch's subscription.type strings to shorter, kebab-style
    kinds the omnibar's event handlers can register against."""
    return {
        'channel.follow': 'twitch-follow',
        'channel.subscribe': 'twitch-sub',
        'channel.subscription.gift': 'twitch-sub-gift',
        'channel.subscription.message': 'twitch-resub',
        'channel.raid': 'twitch-raid',
        'channel.cheer': 'twitch-bits',
    }.get(twitch_type, f'twitch:{twitch_type}')


def _parse_iso(value):
    if not value:
        return None
    try:
        # Twitch sends RFC3339 like "2026-05-27T12:34:56Z".
        if isinstance(value, str) and value.endswith('Z'):
            value = value[:-1] + '+00:00'
        return datetime.fromisoformat(value).astimezone(dt_timezone.utc)
    except (ValueError, TypeError):
        return None


def _unused_imports_marker():
    # Keep json import even if unused — handy for debugging.
    _ = json

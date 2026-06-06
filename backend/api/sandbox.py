"""Synthetic event triggers for operator rehearsal.

These endpoints fabricate ExternalEvent / Donation rows so operators
can rehearse the omnibar's visuals without depending on real donors,
Twitch traffic, or webhook delivery. Disabled in production via the
`DEBUG` flag — the endpoints return 404 when DEBUG is False so a
deployed instance can't accidentally surface them.
"""
from __future__ import annotations

import secrets
from decimal import Decimal

from django.conf import settings
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.request import Request
from rest_framework.response import Response

from . import models


def _disabled_in_prod() -> Response | None:
    if not settings.DEBUG:
        return Response(
            {'detail': 'Sandbox endpoints are disabled outside DEBUG.'},
            status=status.HTTP_404_NOT_FOUND,
        )
    return None


@api_view(['POST'])
def sandbox_twitch_event(request: Request) -> Response:
    """Fabricate an ExternalEvent of the requested kind.

    Body shape: ``{ "kind": "twitch-follow" | "twitch-sub" | "twitch-raid"
                  | "twitch-bits" | "twitch-sub-gift" | "twitch-resub"
                  | <any string>,
                   "user_name": "TestUser",
                   "extra": { ... arbitrary payload overrides ... } }``

    The handler picks sensible defaults for each known kind (tier,
    bits amount, raid viewer count) so a click can fire a believable
    event without filling in 12 form fields.
    """
    early = _disabled_in_prod()
    if early:
        return early
    kind = (request.data.get('kind') or 'twitch-follow').strip()
    user_name = (request.data.get('user_name') or _random_user()).strip()
    extra = request.data.get('extra') or {}
    if not isinstance(extra, dict):
        extra = {}

    payload = {'user_login': user_name.lower().replace(' ', '_'), 'user_name': user_name}
    if kind == 'twitch-follow':
        payload['followed_at'] = timezone.now().isoformat()
    elif kind in ('twitch-sub', 'twitch-sub-gift', 'twitch-resub'):
        payload['tier'] = '1000'
        payload['is_gift'] = (kind == 'twitch-sub-gift')
        if kind == 'twitch-resub':
            payload['cumulative_months'] = 6
    elif kind == 'twitch-raid':
        payload['from_broadcaster_user_name'] = user_name
        payload['from_broadcaster_user_login'] = user_name.lower()
        payload['viewers'] = 137
    elif kind == 'twitch-bits':
        payload['bits'] = 500
    payload.update(extra)
    payload['_msg_id'] = f'sandbox-{secrets.token_urlsafe(8)}'
    payload['_sandbox'] = True

    event = models.ExternalEvent.objects.create(
        source=models.ExternalEvent.SOURCE_TWITCH,
        kind=kind,
        payload=payload,
        occurred_at=timezone.now(),
    )
    return Response(
        {'id': event.id, 'kind': event.kind, 'payload': event.payload},
        status=status.HTTP_201_CREATED,
    )


@api_view(['POST'])
def sandbox_donation(request: Request) -> Response:
    """Create a synthetic Donation row against the active event.

    Body shape: ``{ "donor_name": "TestDonor", "amount": "5.00",
                   "message": "Thanks for streaming!", "muted": false,
                   "platform": "direct" }``

    ``platform`` is optional (defaults to ``direct``); pass ``twitch`` to
    rehearse a Twitch Charity donation through the same omnibar path.

    Triggers the live-donation panel on the omnibar via the existing
    donation poll — no special wiring needed.
    """
    early = _disabled_in_prod()
    if early:
        return early
    event = models.Event.objects.filter(is_active=True).first()
    if not event:
        return Response(
            {'detail': 'No active event.'}, status=status.HTTP_400_BAD_REQUEST,
        )
    donor_name = (request.data.get('donor_name') or _random_user()).strip()
    amount_str = str(request.data.get('amount') or '5.00')
    message = (request.data.get('message') or '').strip()
    muted = bool(request.data.get('muted', False))
    platform = (request.data.get('platform') or models.DonationPlatform.DIRECT).strip()
    if platform not in models.DonationPlatform.values:
        return Response(
            {'detail': f'Unknown platform: {platform}.'},
            status=status.HTTP_400_BAD_REQUEST,
        )
    try:
        amount = Decimal(amount_str)
    except Exception:
        return Response(
            {'detail': 'Invalid amount.'}, status=status.HTTP_400_BAD_REQUEST,
        )
    # `is_muted` is a derived @property on Donation (true when
    # `mute_reason` is non-empty). Sandbox requests passing
    # `muted: true` set the reason tag directly so the underlying
    # field is populated correctly.
    mute_reason = (
        models.MuteReason.NAUGHTY_NAME if muted else models.MuteReason.NONE
    )
    donation = models.Donation.objects.create(
        event=event,
        platform=platform,
        donor_name=donor_name,
        amount=amount,
        currency=event.currency_symbol == '£' and 'GBP' or 'USD',
        message=message,
        donated_at=timezone.now(),
        external_id=f'sandbox-{secrets.token_urlsafe(8)}',
        mute_reason=mute_reason,
    )
    return Response(
        {'id': donation.id, 'donor_name': donation.donor_name,
         'platform': donation.platform,
         'amount': str(donation.amount), 'message': donation.message},
        status=status.HTTP_201_CREATED,
    )


@api_view(['POST'])
def sandbox_charity_campaign(request: Request) -> Response:
    """Seed/advance a synthetic TwitchCharityCampaign for rehearsing the goal
    bar without a live Twitch campaign.

    Body shape: ``{ "charity_name": "SpecialEffect", "current_amount": "1234.50",
                   "target_amount": "10000.00", "currency": "GBP",
                   "active": true }``

    Upserts a single sandbox campaign row (stable campaign_id) so repeated POSTs
    advance the same goal rather than piling up rows.
    """
    early = _disabled_in_prod()
    if early:
        return early
    try:
        current = Decimal(str(request.data.get('current_amount') or '0'))
        target = Decimal(str(request.data.get('target_amount') or '10000'))
    except Exception:
        return Response(
            {'detail': 'Invalid amount.'}, status=status.HTTP_400_BAD_REQUEST,
        )
    active = bool(request.data.get('active', True))
    campaign, _ = models.TwitchCharityCampaign.objects.update_or_create(
        campaign_id='sandbox-charity-campaign',
        defaults={
            'charity_name': (request.data.get('charity_name') or 'Sandbox Charity').strip(),
            'current_amount': current,
            'target_amount': target,
            'currency': (request.data.get('currency') or 'GBP')[:3].upper(),
            'is_active': active,
            'stopped_at': None if active else timezone.now(),
        },
    )
    return Response(
        {'campaign_id': campaign.campaign_id, 'charity_name': campaign.charity_name,
         'current_amount': str(campaign.current_amount),
         'target_amount': str(campaign.target_amount),
         'is_active': campaign.is_active},
        status=status.HTTP_201_CREATED,
    )


def _random_user() -> str:
    fragments = [
        'Pixel', 'Hyrule', 'Triforce', 'Ocarina', 'Zora', 'Goron',
        'Sheikah', 'Kokiri', 'Gerudo', 'Rito', 'Lon', 'Skull',
    ]
    suffixes = ['Knight', 'Hero', 'Sage', 'Adept', 'Fan', 'Warrior']
    a = secrets.choice(fragments)
    b = secrets.choice(suffixes)
    n = secrets.randbelow(1000)
    return f'{a}{b}{n}'

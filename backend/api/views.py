"""API views — DRF viewsets for the control panel + read endpoints for OBS sources."""
import secrets
from decimal import Decimal

from django.conf import settings
from django.core.files.storage import default_storage
from django.db.models import Count, Sum
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action, api_view, parser_classes
from rest_framework.parsers import MultiPartParser
from rest_framework.request import Request
from rest_framework.response import Response

from . import models, serializers, twitch


ALLOWED_IMAGE_TYPES = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'image/svg+xml': 'svg',
}
MAX_UPLOAD_BYTES = 10 * 1024 * 1024  # 10 MB


@api_view(['GET'])
def healthz(_request: Request) -> Response:
    return Response({'status': 'ok'})


@api_view(['POST'])
@parser_classes([MultiPartParser])
def upload_image(request: Request) -> Response:
    """Accept a multipart 'file' upload, save to MEDIA_ROOT/uploads/, return its URL.

    Used by the control panel for event logos and banners — the caller stores the
    returned URL in the relevant *_url model field.
    """
    f = request.FILES.get('file')
    if not f:
        return Response({'detail': 'No file in request.'}, status=status.HTTP_400_BAD_REQUEST)
    if f.size > MAX_UPLOAD_BYTES:
        return Response(
            {'detail': f'File too large (>{MAX_UPLOAD_BYTES // (1024 * 1024)} MB).'},
            status=status.HTTP_400_BAD_REQUEST,
        )
    ext = ALLOWED_IMAGE_TYPES.get(f.content_type)
    if not ext:
        return Response(
            {'detail': f'Unsupported file type: {f.content_type}'},
            status=status.HTTP_400_BAD_REQUEST,
        )
    folder = (request.query_params.get('folder') or 'uploads').strip('/')
    if not folder.replace('-', '').replace('_', '').isalnum():
        folder = 'uploads'
    stem = secrets.token_urlsafe(8)
    relative = f'{folder}/{stem}.{ext}'
    saved_path = default_storage.save(relative, f)
    # Build an absolute URL so the client can store it in a URLField as-is.
    media_url = settings.MEDIA_URL.rstrip('/') + '/' + saved_path.lstrip('/')
    absolute = request.build_absolute_uri(media_url)
    return Response(
        {
            'url': absolute,
            'path': saved_path,
            'size': f.size,
            'content_type': f.content_type,
        },
        status=status.HTTP_201_CREATED,
    )


class GameViewSet(viewsets.ModelViewSet):
    queryset = models.Game.objects.all().prefetch_related('items')
    serializer_class = serializers.GameSerializer


class RunnerViewSet(viewsets.ModelViewSet):
    queryset = models.Runner.objects.all()
    serializer_class = serializers.RunnerSerializer

    def perform_create(self, serializer):
        runner = serializer.save()
        self._refresh_twitch_profile(runner)

    def perform_update(self, serializer):
        prev_url = serializer.instance.channel_url if serializer.instance else ''
        runner = serializer.save()
        if runner.channel_url != prev_url:
            self._refresh_twitch_profile(runner)

    @action(detail=True, methods=['post'])
    def refresh_profile(self, request: Request, pk=None) -> Response:
        runner = self.get_object()
        ok = self._refresh_twitch_profile(runner)
        return Response(
            {
                'profile_image_url': runner.profile_image_url,
                'fetched': ok,
            }
        )

    @staticmethod
    def _refresh_twitch_profile(runner: models.Runner) -> bool:
        login = twitch.extract_twitch_login(runner.channel_url)
        if not login:
            return False
        try:
            profile = twitch.fetch_user_profile(login)
        except twitch.TwitchAuthError:
            return False
        if not profile:
            return False
        image_url = profile.get('profile_image_url') or ''
        if image_url and image_url != runner.profile_image_url:
            runner.profile_image_url = image_url
            runner.save(update_fields=['profile_image_url'])
        return bool(image_url)


class EventViewSet(viewsets.ModelViewSet):
    queryset = models.Event.objects.all().order_by('-start_time')
    serializer_class = serializers.EventSerializer

    def perform_create(self, serializer):
        event = serializer.save()
        if event.is_active:
            models.Event.objects.exclude(pk=event.pk).filter(is_active=True).update(is_active=False)

    def perform_update(self, serializer):
        event = serializer.save()
        if event.is_active:
            models.Event.objects.exclude(pk=event.pk).filter(is_active=True).update(is_active=False)

    @action(detail=True, methods=['post'])
    def activate(self, request: Request, pk=None) -> Response:
        event = self.get_object()
        models.Event.objects.exclude(pk=event.pk).filter(is_active=True).update(is_active=False)
        if not event.is_active:
            event.is_active = True
            event.save(update_fields=['is_active'])
        return Response(self.get_serializer(event).data)

    @action(detail=True, methods=['get'])
    def donation_pages(self, request: Request, pk=None) -> Response:
        event = self.get_object()
        qs = event.donation_pages.all()
        return Response(serializers.DonationPageSerializer(qs, many=True).data)

    @action(detail=False, methods=['get'])
    def active(self, request: Request) -> Response:
        event = models.Event.objects.filter(is_active=True).first()
        if not event:
            return Response(None)
        return Response(self.get_serializer(event).data)


class ScheduleEntryViewSet(viewsets.ModelViewSet):
    queryset = (
        models.ScheduleEntry.objects.all()
        .select_related('event', 'game', 'timer')
        .prefetch_related('runners', 'game__items', 'collected_items')
    )
    serializer_class = serializers.ScheduleEntrySerializer

    def get_queryset(self):
        qs = super().get_queryset()
        event_id = self.request.query_params.get('event')
        if event_id:
            qs = qs.filter(event_id=event_id)
        return qs

    @action(detail=True, methods=['post'])
    def start_timer(self, request: Request, pk=None) -> Response:
        entry = self.get_object()
        timer, _ = models.TimerRun.objects.get_or_create(schedule_entry=entry)
        now = timezone.now()
        if timer.is_running:
            return Response(
                {'detail': 'Timer already running.'}, status=status.HTTP_400_BAD_REQUEST
            )
        # Resuming from pause — bank the previously running segment.
        if timer.started_at and timer.paused_at:
            timer.accumulated_seconds += int(
                (timer.paused_at - timer.started_at).total_seconds()
            )
            timer.paused_at = None
        timer.started_at = now
        timer.ended_at = None
        if not entry.started_at:
            entry.started_at = now
            entry.save(update_fields=['started_at'])
        timer.save()
        return Response(serializers.TimerSerializer(timer).data)

    @action(detail=True, methods=['post'])
    def pause_timer(self, request: Request, pk=None) -> Response:
        entry = self.get_object()
        timer = getattr(entry, 'timer', None)
        if not timer or not timer.is_running:
            return Response(
                {'detail': 'Timer is not running.'}, status=status.HTTP_400_BAD_REQUEST
            )
        timer.paused_at = timezone.now()
        timer.save()
        return Response(serializers.TimerSerializer(timer).data)

    @action(detail=True, methods=['post'])
    def reset_timer(self, request: Request, pk=None) -> Response:
        entry = self.get_object()
        timer, _ = models.TimerRun.objects.get_or_create(schedule_entry=entry)
        timer.started_at = None
        timer.paused_at = None
        timer.ended_at = None
        timer.accumulated_seconds = 0
        timer.save()
        return Response(serializers.TimerSerializer(timer).data)

    @action(detail=True, methods=['post'])
    def stop_timer(self, request: Request, pk=None) -> Response:
        entry = self.get_object()
        timer = getattr(entry, 'timer', None)
        if not timer:
            return Response({'detail': 'No timer.'}, status=status.HTTP_400_BAD_REQUEST)
        now = timezone.now()
        if timer.is_running and timer.started_at:
            timer.accumulated_seconds += int(
                (now - timer.started_at).total_seconds()
            )
        timer.started_at = None
        timer.paused_at = None
        timer.ended_at = now
        timer.save()
        entry.finished_at = now
        entry.is_completed = True
        entry.save(update_fields=['finished_at', 'is_completed'])
        return Response(serializers.TimerSerializer(timer).data)

    @action(detail=True, methods=['post'])
    def toggle_collected(self, request: Request, pk=None) -> Response:
        entry = self.get_object()
        item_id = request.data.get('item_id')
        if not item_id:
            return Response(
                {'detail': 'item_id required.'}, status=status.HTTP_400_BAD_REQUEST
            )
        existing = models.CollectedItem.objects.filter(
            schedule_entry=entry, item_id=item_id
        ).first()
        if existing:
            existing.delete()
            return Response({'collected': False})
        models.CollectedItem.objects.create(schedule_entry=entry, item_id=item_id)
        return Response({'collected': True})

    @action(detail=True, methods=['post'])
    def setpiece(self, request: Request, pk=None) -> Response:
        """Operator endpoint for managing the live setpiece sub-state.

        Body shapes:

          { "stage": "imminent" | "active",
            "kind": "boss",       (required when stage != cleared, optional
                                   to update mid-stream)
            "name": "Ganondorf" } (optional display name)

          { "stage": "cleared",
            "result_kind": "boss-defeated" } — clears setpiece fields and
          emits a PlaythroughEvent of result_kind so the omnibar fires
          its celebration animation. `result_kind` defaults to
          ``setpiece-cleared`` and the payload mirrors the cleared
          setpiece for handlers that want richer rendering.
        """
        entry = self.get_object()
        stage = request.data.get('stage')
        if stage == 'cleared':
            result_kind = (request.data.get('result_kind') or 'setpiece-cleared').strip()
            cleared = {
                'kind': entry.setpiece_kind,
                'name': entry.setpiece_name,
                'started_at': entry.setpiece_started_at.isoformat() if entry.setpiece_started_at else None,
            }
            entry.setpiece_kind = ''
            entry.setpiece_name = ''
            entry.setpiece_stage = ''
            entry.setpiece_started_at = None
            entry.save(update_fields=[
                'setpiece_kind', 'setpiece_name', 'setpiece_stage', 'setpiece_started_at',
            ])
            models.PlaythroughEvent.objects.create(
                schedule_entry=entry,
                kind=result_kind,
                payload=cleared,
            )
            return Response(serializers.ScheduleEntrySerializer(entry).data)
        if stage not in (
            models.ScheduleEntry.SETPIECE_IMMINENT,
            models.ScheduleEntry.SETPIECE_ACTIVE,
        ):
            return Response(
                {'detail': 'stage must be "imminent", "active", or "cleared".'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        kind = (request.data.get('kind') or entry.setpiece_kind or '').strip()
        if not kind:
            return Response(
                {'detail': 'kind required when starting a setpiece.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        name = request.data.get('name')
        entry.setpiece_kind = kind
        if name is not None:
            entry.setpiece_name = str(name)
        entry.setpiece_stage = stage
        if entry.setpiece_started_at is None:
            entry.setpiece_started_at = timezone.now()
        entry.save(update_fields=[
            'setpiece_kind', 'setpiece_name', 'setpiece_stage', 'setpiece_started_at',
        ])
        return Response(serializers.ScheduleEntrySerializer(entry).data)


class DonationViewSet(viewsets.ModelViewSet):
    queryset = models.Donation.objects.all()
    serializer_class = serializers.DonationSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        event_id = self.request.query_params.get('event')
        if event_id:
            qs = qs.filter(event_id=event_id)
        return qs

    @action(detail=False, methods=['get'])
    def totals(self, request: Request) -> Response:
        qs = self.get_queryset()
        rows = list(
            qs.values('platform', 'currency')
            .annotate(total=Sum('amount'), count=Count('id'))
            .order_by('-total')
        )
        # Attach the human-friendly display label from DonationPlatformProfile
        # (falls back to the choice's verbose name when no profile override
        # is set). Bulk-loaded so the response cost stays O(platforms).
        profile_labels = {
            p.platform: p.display_label
            for p in models.DonationPlatformProfile.objects.all()
            if p.display_label
        }
        choice_labels = dict(models.DonationPlatform.choices)
        for row in rows:
            key = row['platform']
            row['display_label'] = profile_labels.get(key) or choice_labels.get(key, key)
        grand_total = qs.aggregate(total=Sum('amount'))['total'] or Decimal('0')
        return Response(
            {
                'by_platform': rows,
                'grand_total': grand_total,
                'donation_count': qs.count(),
            }
        )


class DonationPageViewSet(viewsets.ModelViewSet):
    queryset = models.DonationPage.objects.all()
    serializer_class = serializers.DonationPageSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        event_id = self.request.query_params.get('event')
        if event_id:
            qs = qs.filter(event_id=event_id)
        return qs


class BrbTimerViewSet(viewsets.ModelViewSet):
    queryset = models.BrbTimer.objects.all()
    serializer_class = serializers.BrbTimerSerializer

    @action(detail=False, methods=['get'])
    def current(self, request: Request) -> Response:
        active = models.BrbTimer.objects.filter(is_active=True).first()
        if not active:
            return Response(None)
        return Response(self.get_serializer(active).data)


@api_view(['GET', 'PUT'])
def currently_playing(request: Request) -> Response:
    cp = models.CurrentlyPlaying.get()
    if request.method == 'GET':
        return Response(serializers.CurrentlyPlayingSerializer(cp).data)
    schedule_entry_id = request.data.get('schedule_entry')
    cp.schedule_entry_id = schedule_entry_id
    cp.save()
    return Response(serializers.CurrentlyPlayingSerializer(cp).data)


@api_view(['GET', 'POST'])
def tts_replay(request: Request) -> Response:
    """Singleton "play this donation next in TTS" pointer.

    GET — used by /obs/tts polling. Returns `{donation_id, requested_at}`.
    POST `{donation_id}` — used by /control/donations "Replay TTS"
    button. Bumps `requested_at` even if the same donation is replayed
    twice, so the TTS overlay's high-water-mark comparison fires every
    time.
    """
    obj = models.TtsReplay.get()
    if request.method == 'GET':
        return Response(serializers.TtsReplaySerializer(obj).data)
    donation_id = request.data.get('donation_id')
    donation = models.Donation.objects.filter(pk=donation_id).first() if donation_id else None
    if donation_id and not donation:
        return Response({'detail': 'Donation not found'}, status=404)
    obj.donation = donation
    obj.requested_at = timezone.now()
    obj.save()
    return Response(serializers.TtsReplaySerializer(obj).data)


@api_view(['GET'])
def donation_mute_reasons(_request: Request) -> Response:
    """Enum of MuteReason choices exposed as `[{value, label}, ...]`.

    /control/donations renders this as the mute-reason dropdown; pulling
    it from the server (vs hardcoding the labels in the React app) means
    adding or renaming a reason in models.MuteReason is a one-file
    change instead of touching both repos.
    """
    return Response([
        {'value': value, 'label': label}
        for value, label in models.MuteReason.choices
    ])


@api_view(['GET', 'POST'])
def tts_now_reading(request: Request) -> Response:
    """Singleton mirror of what /obs/tts is currently announcing.

    GET — polled by /control/donations to highlight the live row.
    POST `{donation_id|null}` — called by /obs/tts on every transition.
    Null clears the pointer (TTS overlay went idle).
    """
    obj = models.TtsNowReading.get()
    if request.method == 'GET':
        return Response(serializers.TtsNowReadingSerializer(obj).data)
    donation_id = request.data.get('donation_id')
    if donation_id is None:
        obj.donation = None
    else:
        donation = models.Donation.objects.filter(pk=donation_id).first()
        if not donation:
            return Response({'detail': 'Donation not found'}, status=404)
        obj.donation = donation
    obj.started_at = timezone.now()
    obj.save()
    return Response(serializers.TtsNowReadingSerializer(obj).data)


@api_view(['GET', 'POST'])
def chest_replay(request: Request) -> Response:
    """Singleton "re-fire this donation through /obs/chest-announcer".

    GET — used by the chest-announcer overlay polling loop.
    POST `{donation_id}` — used by /control/donations chest replay
    button. Bumps `requested_at` even on a same-donation retrigger,
    so the overlay's high-water-mark comparison fires every time.
    """
    obj = models.ChestReplay.get()
    if request.method == 'GET':
        return Response(serializers.ChestReplaySerializer(obj).data)
    donation_id = request.data.get('donation_id')
    donation = models.Donation.objects.filter(pk=donation_id).first() if donation_id else None
    if donation_id and not donation:
        return Response({'detail': 'Donation not found'}, status=404)
    obj.donation = donation
    obj.requested_at = timezone.now()
    obj.save()
    return Response(serializers.ChestReplaySerializer(obj).data)


@api_view(['GET', 'PATCH'])
def theme_settings(request: Request) -> Response:
    """Returns / updates the **currently active** theme.

    The frontend's <ThemeProvider> hits this endpoint to apply the live
    theme. PATCH updates the active row in-place — useful for
    quick-and-dirty colour tweaks. Use /api/themes/ for library
    management (create, activate a different theme, delete).
    """
    theme = models.ThemeSettings.get_active()
    if request.method == 'GET':
        return Response(serializers.ThemeSettingsSerializer(theme).data)
    ser = serializers.ThemeSettingsSerializer(theme, data=request.data, partial=True)
    ser.is_valid(raise_exception=True)
    ser.save()
    return Response(ser.data)


class ChestAnnouncerSoundTriggerViewSet(viewsets.ModelViewSet):
    """CRUD for the sound triggers consumed by /obs/chest-announcer.

    Listed in priority order (lowest number first) so the overlay can
    just iterate and pick the first match without a second sort.
    """

    queryset = models.ChestAnnouncerSoundTrigger.objects.all().select_related('game')
    serializer_class = serializers.ChestAnnouncerSoundTriggerSerializer

    @action(detail=True, methods=['post'])
    def duplicate(self, request: Request, pk=None) -> Response:
        """Clone an existing trigger so the operator can tweak a copy
        without rebuilding all the fields. Name gets a ``(copy)``
        suffix; priority is bumped by 1 so the clone sorts just below
        the original. The copy starts inactive so the operator can vet
        it before it can fire on a real donation."""
        src = self.get_object()
        clone = models.ChestAnnouncerSoundTrigger.objects.create(
            name=f'{src.name} (copy)',
            kind=src.kind,
            match=src.match,
            game=src.game,
            sound_url=src.sound_url,
            volume=src.volume,
            priority=src.priority + 1,
            is_active=False,
        )
        return Response(self.get_serializer(clone).data)


@api_view(['GET', 'PATCH'])
def chest_announcer_settings(request: Request) -> Response:
    """Returns / updates the singleton chest-announcer settings row.

    GET is polled by /obs/chest-announcer to decide whether to play
    the fanfare on each card reveal. PATCH is hit by the control
    page's toggle.
    """
    obj = models.ChestAnnouncerSettings.get()
    if request.method == 'GET':
        return Response(serializers.ChestAnnouncerSettingsSerializer(obj).data)
    ser = serializers.ChestAnnouncerSettingsSerializer(obj, data=request.data, partial=True)
    ser.is_valid(raise_exception=True)
    ser.save()
    return Response(ser.data)


class ThemeSettingsViewSet(viewsets.ModelViewSet):
    """Library of themes. CRUD + an `activate` action that mirrors the
    Event activation pattern (sets `is_active=True` here, demotes the
    rest)."""

    queryset = models.ThemeSettings.objects.all()
    serializer_class = serializers.ThemeSettingsSerializer

    @action(detail=True, methods=['post'])
    def activate(self, request: Request, pk=None) -> Response:
        theme = self.get_object()
        if not theme.is_active:
            theme.is_active = True
            theme.save()  # The model's save() demotes every other row.
        return Response(self.get_serializer(theme).data)

    @action(detail=True, methods=['post'])
    def duplicate(self, request: Request, pk=None) -> Response:
        """Clone the row into a new inactive theme. Lets the user fork an
        existing theme as a starting point for a new one."""
        source = self.get_object()
        clone = models.ThemeSettings.objects.create(
            name=f'{source.name} (copy)',
            is_active=False,
            primary=source.primary,
            primary_bright=source.primary_bright,
            secondary=source.secondary,
            background_from=source.background_from,
            background_to=source.background_to,
            text_color=source.text_color,
            text_muted=source.text_muted,
            line_color=source.line_color,
            logo_url=source.logo_url,
            logo_small_url=source.logo_small_url,
            favicon_url=source.favicon_url,
            background_video_url=source.background_video_url,
            background_image_url=source.background_image_url,
            button_gradient_from=source.button_gradient_from,
            button_gradient_to=source.button_gradient_to,
            button_text_color=source.button_text_color,
            button_border_color=source.button_border_color,
            divider_thickness=source.divider_thickness,
            heading_font=source.heading_font,
            body_font=source.body_font,
        )
        return Response(self.get_serializer(clone).data, status=status.HTTP_201_CREATED)


# ── Omnibar v2 ─────────────────────────────────────────────────────────────


class PlaythroughEventViewSet(viewsets.ModelViewSet):
    """CRUD on per-playthrough events.

    The omnibar polls ``GET /api/playthrough-events/?schedule_entry={id}&since={iso}``
    for new events; the control panel issues ``POST`` to fire a moment
    (boss-defeated, item-collected, …) and the OBS browser source picks
    it up on the next poll cycle.
    """
    queryset = models.PlaythroughEvent.objects.all()
    serializer_class = serializers.PlaythroughEventSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        entry_id = self.request.query_params.get('schedule_entry')
        if entry_id:
            qs = qs.filter(schedule_entry_id=entry_id)
        since = self.request.query_params.get('since')
        if since:
            qs = qs.filter(created_at__gt=since)
        return qs


class OmnibarOverrideViewSet(viewsets.ModelViewSet):
    """CRUD on operator-triggered omnibar overrides.

    Active overrides (is_active + within starts_at..expires_at) drive
    the OmnibarFSM into ``urgent`` mode. Custom actions:

      - ``POST /api/overrides/{id}/activate/``   — flip is_active=True
      - ``POST /api/overrides/{id}/deactivate/`` — flip is_active=False
      - ``GET  /api/overrides/active/``          — live ones only
    """
    queryset = models.OmnibarOverride.objects.all()
    serializer_class = serializers.OmnibarOverrideSerializer

    @action(detail=False, methods=['get'])
    def active(self, request: Request) -> Response:
        now = timezone.now()
        qs = self.get_queryset().filter(
            is_active=True, starts_at__lte=now, expires_at__gt=now,
        ).order_by('-priority', '-starts_at')
        return Response(self.get_serializer(qs, many=True).data)

    @action(detail=True, methods=['post'])
    def activate(self, request: Request, pk=None) -> Response:
        obj = self.get_object()
        obj.is_active = True
        obj.save(update_fields=['is_active'])
        return Response(self.get_serializer(obj).data)

    @action(detail=True, methods=['post'])
    def deactivate(self, request: Request, pk=None) -> Response:
        obj = self.get_object()
        obj.is_active = False
        obj.save(update_fields=['is_active'])
        return Response(self.get_serializer(obj).data)


class ExternalEventViewSet(viewsets.ModelViewSet):
    """CRUD on inbound webhook events (Twitch / Discord / …).

    Filterable via ``?source=twitch&since={iso}&unconsumed=true``.
    """
    queryset = models.ExternalEvent.objects.all()
    serializer_class = serializers.ExternalEventSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        source = self.request.query_params.get('source')
        if source:
            qs = qs.filter(source=source)
        since = self.request.query_params.get('since')
        if since:
            qs = qs.filter(occurred_at__gt=since)
        if self.request.query_params.get('unconsumed') == 'true':
            qs = qs.filter(consumed_at__isnull=True)
        return qs

    @action(detail=True, methods=['post'])
    def consume(self, request: Request, pk=None) -> Response:
        """Mark an event as consumed by the omnibar so it doesn't replay."""
        obj = self.get_object()
        if obj.consumed_at is None:
            obj.consumed_at = timezone.now()
            obj.save(update_fields=['consumed_at'])
        return Response(self.get_serializer(obj).data)


class IncentiveViewSet(viewsets.ModelViewSet):
    """CRUD on donation incentives.

    Filterable via ``?event={id}&active=true``. Custom action:

      - ``POST /api/incentives/{id}/contribute/`` body ``{ "amount": "5.00" }``
        bumps current_amount, sets reached_at if the goal is crossed, and
        returns ``{ "newly_reached": bool }`` so the caller knows whether
        to fire the ``incentive-unlocked`` event.
    """
    queryset = models.Incentive.objects.all()
    serializer_class = serializers.IncentiveSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        event_id = self.request.query_params.get('event')
        if event_id:
            qs = qs.filter(event_id=event_id)
        if self.request.query_params.get('active') == 'true':
            qs = qs.filter(is_active=True)
        return qs

    @action(detail=True, methods=['post'])
    def contribute(self, request: Request, pk=None) -> Response:
        try:
            amount = Decimal(str(request.data.get('amount', '0')))
        except Exception:
            return Response({'detail': 'Invalid amount.'}, status=status.HTTP_400_BAD_REQUEST)
        if amount <= 0:
            return Response({'detail': 'Amount must be positive.'},
                            status=status.HTTP_400_BAD_REQUEST)
        obj = self.get_object()
        was_reached = obj.is_reached
        # Bid-war path: when an `option` id is supplied AND payload has
        # an `options` array, route the contribution to that option's
        # `votes` total. Headline current_amount still tracks the sum
        # so the row's progress bar still moves.
        option_id = request.data.get('option')
        if option_id and isinstance(obj.payload, dict):
            options = obj.payload.get('options')
            if isinstance(options, list):
                hit = next(
                    (o for o in options if isinstance(o, dict) and o.get('id') == option_id),
                    None,
                )
                if hit is None:
                    return Response(
                        {'detail': f'Unknown option {option_id!r}.'},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                hit['votes'] = float(hit.get('votes', 0) or 0) + float(amount)
                obj.payload['options'] = options
                obj.save(update_fields=['payload'])
        obj.current_amount = obj.current_amount + amount
        newly_reached = False
        if not was_reached and obj.current_amount >= obj.goal_amount:
            obj.reached_at = timezone.now()
            newly_reached = True
        obj.save(update_fields=['current_amount', 'reached_at'])
        return Response({
            **self.get_serializer(obj).data,
            'newly_reached': newly_reached,
        })


class MilestoneViewSet(viewsets.ModelViewSet):
    """CRUD on event milestones.

    Filterable via ``?event={id}&reached=true|false``. Custom action:

      - ``POST /api/milestones/{id}/mark_reached/`` — sets reached_at to
        now if not already set. Idempotent; returns the milestone.
    """
    queryset = models.Milestone.objects.all()
    serializer_class = serializers.MilestoneSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        event_id = self.request.query_params.get('event')
        if event_id:
            qs = qs.filter(event_id=event_id)
        reached = self.request.query_params.get('reached')
        if reached == 'true':
            qs = qs.filter(reached_at__isnull=False)
        elif reached == 'false':
            qs = qs.filter(reached_at__isnull=True)
        return qs

    @action(detail=True, methods=['post'])
    def mark_reached(self, request: Request, pk=None) -> Response:
        obj = self.get_object()
        if obj.reached_at is None:
            obj.reached_at = timezone.now()
            obj.save(update_fields=['reached_at'])
        return Response(self.get_serializer(obj).data)


class CharitySlideViewSet(viewsets.ModelViewSet):
    """CRUD on omnibar charity-cluster slides.

    Filterable via ``?active=true``. No event scope — slides are
    global so the same rotation runs across every event.
    """
    queryset = models.CharitySlide.objects.all()
    serializer_class = serializers.CharitySlideSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        if self.request.query_params.get('active') == 'true':
            qs = qs.filter(is_active=True)
        return qs

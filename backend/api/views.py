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


class DonationViewSet(viewsets.ModelViewSet):
    queryset = models.Donation.objects.all()
    serializer_class = serializers.DonationSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        event_id = self.request.query_params.get('event')
        if event_id:
            qs = qs.filter(event_id=event_id)
        return qs


class DonationPageViewSet(viewsets.ModelViewSet):
    queryset = models.DonationPage.objects.all()
    serializer_class = serializers.DonationPageSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        event_id = self.request.query_params.get('event')
        if event_id:
            qs = qs.filter(event_id=event_id)
        return qs

    @action(detail=False, methods=['get'])
    def totals(self, request: Request) -> Response:
        qs = self.get_queryset()
        rows = (
            qs.values('platform', 'currency')
            .annotate(total=Sum('amount'), count=Count('id'))
            .order_by('-total')
        )
        grand_total = qs.aggregate(total=Sum('amount'))['total'] or Decimal('0')
        return Response(
            {
                'by_platform': list(rows),
                'grand_total': grand_total,
                'donation_count': qs.count(),
            }
        )


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

"""API views — DRF viewsets for the control panel + read endpoints for OBS sources."""
from decimal import Decimal

from django.db.models import Count, Sum
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action, api_view
from rest_framework.request import Request
from rest_framework.response import Response

from . import models, serializers


@api_view(['GET'])
def healthz(_request: Request) -> Response:
    return Response({'status': 'ok'})


class GameViewSet(viewsets.ModelViewSet):
    queryset = models.Game.objects.all().prefetch_related('items')
    serializer_class = serializers.GameSerializer


class RunnerViewSet(viewsets.ModelViewSet):
    queryset = models.Runner.objects.all()
    serializer_class = serializers.RunnerSerializer


class EventViewSet(viewsets.ModelViewSet):
    queryset = models.Event.objects.all()
    serializer_class = serializers.EventSerializer

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

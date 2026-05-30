"""API views — DRF viewsets for the control panel + read endpoints for OBS sources."""
import random
import secrets
from datetime import timedelta
from decimal import Decimal
from urllib.parse import quote

from django.conf import settings
from django.core.files.storage import default_storage
from django.db.models import Count, Max, Sum
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

# Image extensions surfaced by the GameItem asset picker.
IMAGE_SUFFIXES = {'.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'}

# How long the auto-generated "raffle entries closed" omnibar banner stays up.
RAFFLE_CLOSE_BANNER_SECONDS = 20


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
    queryset = models.Game.objects.all().prefetch_related(
        # `items__unlocks_with` is required: GameItemSerializer emits
        # unlocks_with_ids, so without it each item fires its own M2M query
        # (a 500-item catalog turned /api/games/ into a ~3.5s N+1).
        'items', 'items__sets', 'items__unlocks_with', 'objectives', 'item_sets',
    )
    serializer_class = serializers.GameSerializer

    @action(detail=True, methods=['get'])
    def item_assets(self, request: Request, pk=None) -> Response:
        """List the item sprite files bundled for this game's asset folder.

        Powers the image picker on /control/items so operators can attach a
        bundled sprite to a new GameItem without typing a URL by hand. Reads
        the frontend's static assets directory directly; returns site-relative
        URLs in the same shape the seed command stores.
        """
        return Response(_bundled_item_images(self.get_object()))

    @action(detail=True, methods=['get'])
    def objective_assets(self, request: Request, pk=None) -> Response:
        """Same bundled-sprite picker as `item_assets`, surfaced for the
        objectives library on /control/omnibar#objective. Objectives reuse the
        per-game item sprite folder."""
        return Response(_bundled_item_images(self.get_object()))


def _bundled_item_images(game) -> dict:
    """Return ``{slug, images:[{filename,url}]}`` for a game's bundled item
    sprite folder, or empty when the game has no asset slug / folder. Shared
    by the item + objective image pickers."""
    slug = game.asset_slug
    if not slug:
        return {'slug': '', 'images': []}
    # BASE_DIR is the backend/ dir; the frontend is its sibling.
    items_dir = (
        settings.BASE_DIR.parent
        / 'frontend' / 'public' / 'assets' / 'img'
        / 'game-franchise' / 'legend-of-zelda' / slug / 'items'
    )
    images = []
    if items_dir.is_dir():
        base_url = f'/assets/img/game-franchise/legend-of-zelda/{slug}/items'
        for path in sorted(items_dir.iterdir()):
            if path.is_file() and path.suffix.lower() in IMAGE_SUFFIXES:
                images.append(
                    {'filename': path.name, 'url': f'{base_url}/{quote(path.name)}'}
                )
    return {'slug': slug, 'images': images}


def _copy_name(model, game_id, source_name: str) -> str:
    """Return a "<name> (copy)" that doesn't collide with the (game, name)
    unique constraint, bumping to "(copy 2)", "(copy 3)"… as needed."""
    base = f'{source_name} (copy)'
    name = base
    n = 2
    while model.objects.filter(game_id=game_id, name=name).exists():
        name = f'{base} {n}'
        n += 1
    return name


class GameItemViewSet(viewsets.ModelViewSet):
    queryset = models.GameItem.objects.all()
    serializer_class = serializers.GameItemSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        game_id = self.request.query_params.get('game')
        if game_id:
            qs = qs.filter(game_id=game_id)
        return qs

    @action(detail=True, methods=['post'])
    def duplicate(self, request: Request, pk=None) -> Response:
        """Clone this item (all fields, including set membership) under a
        unique "(copy)" name, ordered last, so the operator can tweak the copy
        on /control/items rather than re-entering everything."""
        src = self.get_object()
        # Capture M2M before reassigning the pk (the in-memory manager rebinds
        # to the new, empty row after save).
        set_ids = list(src.sets.values_list('id', flat=True))
        max_order = models.GameItem.objects.filter(game=src.game).aggregate(
            m=Max('order'),
        )['m']
        src.pk = None
        src.name = _copy_name(models.GameItem, src.game_id, src.name)
        src.order = (max_order or 0) + 1
        src.save()
        src.sets.set(set_ids)
        return Response(self.get_serializer(src).data, status=status.HTTP_201_CREATED)


class GameItemSetViewSet(viewsets.ModelViewSet):
    queryset = models.GameItemSet.objects.all()
    serializer_class = serializers.GameItemSetSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        game_id = self.request.query_params.get('game')
        if game_id:
            qs = qs.filter(game_id=game_id)
        return qs


class GameObjectiveViewSet(viewsets.ModelViewSet):
    queryset = models.GameObjective.objects.all()
    serializer_class = serializers.GameObjectiveSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        game_id = self.request.query_params.get('game')
        if game_id:
            qs = qs.filter(game_id=game_id)
        return qs

    @action(detail=True, methods=['post'])
    def duplicate(self, request: Request, pk=None) -> Response:
        """Clone this objective (all fields) under a unique "(copy)" name,
        ordered last, so the operator can tweak the copy. Returns the new row."""
        src = self.get_object()
        max_order = models.GameObjective.objects.filter(game=src.game).aggregate(
            m=Max('order'),
        )['m']
        src.pk = None
        src.name = _copy_name(models.GameObjective, src.game_id, src.name)
        src.order = (max_order or 0) + 1
        src.save()
        return Response(self.get_serializer(src).data, status=status.HTTP_201_CREATED)


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
        .prefetch_related(
            # game__items__unlocks_with is required: GameItemSerializer emits
            # unlocks_with_ids, so without it every item fires its own M2M query
            # (same N+1 that made /api/schedule/ ~3.5s on a full schedule).
            'runners', 'game__items', 'game__items__sets',
            'game__items__unlocks_with', 'game__item_sets',
            'game__objectives', 'collected_items', 'objective_statuses',
        )
    )
    serializer_class = serializers.ScheduleEntrySerializer

    def _is_compact(self) -> bool:
        # Opt-in light list (public /schedule, up-next): drops the heavy nested
        # game items/objectives that only the currently-playing entry needs.
        return self.action == 'list' and bool(self.request.query_params.get('compact'))

    def get_serializer_class(self):
        if self._is_compact():
            return serializers.ScheduleEntryLightSerializer
        return serializers.ScheduleEntrySerializer

    def get_queryset(self):
        if self._is_compact():
            # Skip the collectible/objective prefetches entirely — the light
            # serializer doesn't touch them.
            qs = (
                models.ScheduleEntry.objects.all()
                .select_related('game')
                .prefetch_related('runners')
            )
        else:
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
        # Start or resume: just begin a fresh live segment. Pause already banked
        # any prior segment into accumulated_seconds, so there is nothing to bank
        # here — this is what keeps the clock from jumping on resume.
        timer.started_at = now
        timer.paused_at = None
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
        now = timezone.now()
        # Bank the live segment NOW (don't defer it to resume), then hold the
        # clock. total_seconds then reads accumulated_seconds while paused, so
        # the display stays put instead of dropping to the stale value.
        timer.accumulated_seconds += int(
            (now - timer.started_at).total_seconds()
        )
        timer.started_at = None
        timer.paused_at = now
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
        # Clean slate: also reopen the entry so a previously-finished run can be
        # restarted from 00:00:00.
        entry.started_at = None
        entry.finished_at = None
        entry.is_completed = False
        entry.save(update_fields=['started_at', 'finished_at', 'is_completed'])
        return Response(serializers.TimerSerializer(timer).data)

    @action(detail=True, methods=['post'])
    def reopen_timer(self, request: Request, pk=None) -> Response:
        """Undo a Finish: clear the completion flags but keep accumulated time
        so the run can be resumed (Start picks up where it left off)."""
        entry = self.get_object()
        timer = getattr(entry, 'timer', None)
        if not timer:
            return Response({'detail': 'No timer.'}, status=status.HTTP_400_BAD_REQUEST)
        timer.ended_at = None
        timer.save(update_fields=['ended_at'])
        entry.finished_at = None
        entry.is_completed = False
        entry.save(update_fields=['finished_at', 'is_completed'])
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

    @staticmethod
    def _unlock_closure(item) -> set:
        """All GameItem ids collected together with `item` — a BFS over the
        symmetric unlocks_with graph, including the item itself."""
        seen = {item.id}
        frontier = [item]
        while frontier:
            cur = frontier.pop()
            for nb in cur.unlocks_with.all():
                if nb.id not in seen:
                    seen.add(nb.id)
                    frontier.append(nb)
        return seen

    def _cascade_unlocks(self, entry, item_id, *, collected: bool) -> None:
        """Apply a collected state to the item's tied companions (the trigger
        item itself is handled by the caller)."""
        item = models.GameItem.objects.filter(pk=item_id).first()
        if not item:
            return
        tied = self._unlock_closure(item) - {item.id}
        if not tied:
            return
        if collected:
            for iid in tied:
                models.CollectedItem.objects.get_or_create(schedule_entry=entry, item_id=iid)
        else:
            models.CollectedItem.objects.filter(
                schedule_entry=entry, item_id__in=tied
            ).delete()

    def _collect_cascade_ids(self, item, *, collected: bool) -> set:
        """Item ids whose collected state changes together with `item`.

        Combines two relations and follows them *transitively* (a fixpoint),
        so a chain of implications resolves fully — e.g. collecting Enhanced
        Magic Power implies the base Magic Power Meter (upgrade tier), which in
        turn implies the Spin Attack tied to it (unlocks_with):

        - unlocks_with bundle: symmetric (e.g. Bow + Quiver), and
        - upgrade-chain tiers: collecting a tier implies every lower tier (you
          must have had them); clearing a tier clears every higher tier (you
          can't hold Lv3 without Lv2).

        Trade sequences are excluded — you swap the item away, so earlier
        entries aren't implied.
        """
        seen = {item.id}
        frontier = [item]
        while frontier:
            cur = frontier.pop()
            # Symmetric bundle.
            for nb in cur.unlocks_with.all():
                if nb.id not in seen:
                    seen.add(nb.id)
                    frontier.append(nb)
            # Upgrade tiers, relative to this node's own position in each chain.
            for s in cur.sets.filter(kind=models.ItemLinkKind.UPGRADE):
                for member in s.items.all():
                    implied = (
                        (collected and member.order <= cur.order)
                        or (not collected and member.order >= cur.order)
                    )
                    if implied and member.id not in seen:
                        seen.add(member.id)
                        frontier.append(member)
        return seen

    def _sync_linked_objectives(self, entry) -> None:
        """Mirror collected-item state into linked "item get" objectives:
        obtained when the linked item is collected, outstanding when not.
        Manually SKIPPED rows are left untouched. Called after any change to
        this entry's collected items."""
        if not entry.game_id:
            return
        collected_ids = set(
            models.CollectedItem.objects.filter(
                schedule_entry=entry
            ).values_list('item_id', flat=True)
        )
        linked = models.GameObjective.objects.filter(
            game_id=entry.game_id, linked_item__isnull=False
        )
        for obj in linked:
            existing = models.ScheduleEntryObjective.objects.filter(
                schedule_entry=entry, objective=obj
            ).first()
            if existing and existing.status == models.ObjectiveStatus.SKIPPED:
                continue
            if obj.linked_item_id in collected_ids:
                if not existing or existing.status != models.ObjectiveStatus.OBTAINED:
                    models.ScheduleEntryObjective.objects.update_or_create(
                        schedule_entry=entry,
                        objective=obj,
                        defaults={
                            'status': models.ObjectiveStatus.OBTAINED,
                            'obtained_at': timezone.now(),
                        },
                    )
            elif existing and existing.status == models.ObjectiveStatus.OBTAINED:
                existing.delete()

    @action(detail=True, methods=['post'])
    def toggle_collected(self, request: Request, pk=None) -> Response:
        entry = self.get_object()
        item_id = request.data.get('item_id')
        if not item_id:
            return Response(
                {'detail': 'item_id required.'}, status=status.HTTP_400_BAD_REQUEST
            )
        item = models.GameItem.objects.filter(pk=item_id).first()
        if not item:
            return Response({'detail': 'item not found.'}, status=status.HTTP_404_NOT_FOUND)
        already = models.CollectedItem.objects.filter(
            schedule_entry=entry, item_id=item_id
        ).exists()
        target = not already
        # Cascade to tied items (unlocks_with) and upgrade-chain tiers.
        ids = self._collect_cascade_ids(item, collected=target)
        if target:
            for iid in ids:
                models.CollectedItem.objects.get_or_create(schedule_entry=entry, item_id=iid)
        else:
            models.CollectedItem.objects.filter(
                schedule_entry=entry, item_id__in=ids
            ).delete()
        self._sync_linked_objectives(entry)
        return Response({'collected': target, 'item_ids': sorted(ids)})

    @action(detail=True, methods=['post'])
    def adjust_collected(self, request: Request, pk=None) -> Response:
        """Increment/decrement a countable item's tally (keys, maps...).

        Body: {item_id, delta} where delta is usually +1 or -1. The row is
        created on first increment and deleted when the tally hits 0, so
        collected_item_ids stays in sync (qty is always >= 1 while present).
        Crossing the 0 boundary cascades the collected state to tied items.
        """
        entry = self.get_object()
        item_id = request.data.get('item_id')
        if not item_id:
            return Response(
                {'detail': 'item_id required.'}, status=status.HTTP_400_BAD_REQUEST
            )
        try:
            delta = int(request.data.get('delta', 1))
        except (TypeError, ValueError):
            return Response(
                {'detail': 'delta must be an integer.'}, status=status.HTTP_400_BAD_REQUEST
            )
        existing = models.CollectedItem.objects.filter(
            schedule_entry=entry, item_id=item_id
        ).first()
        current = existing.quantity if existing else 0
        new_qty = current + delta
        if new_qty <= 0:
            if existing:
                existing.delete()
            self._cascade_unlocks(entry, item_id, collected=False)
            self._sync_linked_objectives(entry)
            return Response({'collected': False, 'quantity': 0})
        if existing:
            existing.quantity = new_qty
            existing.save(update_fields=['quantity'])
        else:
            models.CollectedItem.objects.create(
                schedule_entry=entry, item_id=item_id, quantity=new_qty
            )
        if current == 0:
            self._cascade_unlocks(entry, item_id, collected=True)
        self._sync_linked_objectives(entry)
        return Response({'collected': True, 'quantity': new_qty})

    @action(detail=True, methods=['post'])
    def reset_collected(self, request: Request, pk=None) -> Response:
        """Clear every collected item for this run, then re-collect the game's
        starting items (and anything tied to them). Powers the "Reset to start"
        button on /control/items."""
        entry = self.get_object()
        models.CollectedItem.objects.filter(schedule_entry=entry).delete()
        ids: set = set()
        if entry.game_id:
            for starter in models.GameItem.objects.filter(
                game_id=entry.game_id, starts_collected=True
            ):
                ids |= self._unlock_closure(starter)
        for iid in ids:
            models.CollectedItem.objects.create(schedule_entry=entry, item_id=iid)
        self._sync_linked_objectives(entry)
        return Response({'collected_item_ids': sorted(ids)})

    @action(detail=True, methods=['post'])
    def set_objective_status(self, request: Request, pk=None) -> Response:
        """Set a GameObjective's per-run status for this entry.

        Body ``{objective_id, status}`` where status is one of
        ``outstanding`` / ``obtained`` / ``skipped``. ``outstanding`` clears
        any row (the default state); the others upsert a ScheduleEntryObjective.
        Marking ``obtained`` stamps ``obtained_at`` so the omnibar can fire its
        pickup celebration on the false→true transition (it polls the entry).
        """
        entry = self.get_object()
        objective_id = request.data.get('objective_id')
        new_status = request.data.get('status')
        if not objective_id:
            return Response(
                {'detail': 'objective_id required.'}, status=status.HTTP_400_BAD_REQUEST
            )
        valid = {'outstanding', models.ObjectiveStatus.OBTAINED, models.ObjectiveStatus.SKIPPED}
        if new_status not in valid:
            return Response(
                {'detail': f'status must be one of {sorted(valid)}.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if new_status == 'outstanding':
            models.ScheduleEntryObjective.objects.filter(
                schedule_entry=entry, objective_id=objective_id
            ).delete()
        else:
            models.ScheduleEntryObjective.objects.update_or_create(
                schedule_entry=entry,
                objective_id=objective_id,
                defaults={'status': new_status, 'obtained_at': timezone.now()},
            )
        # Reverse link for "item get" objectives: keep the linked item's
        # collected state in lockstep (skipped leaves the item alone). Writes
        # CollectedItem rows directly — no recursion with the collect actions.
        objective = (
            models.GameObjective.objects.filter(pk=objective_id)
            .select_related('linked_item')
            .first()
        )
        if (
            objective
            and objective.linked_item_id
            and new_status != models.ObjectiveStatus.SKIPPED
        ):
            collected = new_status == models.ObjectiveStatus.OBTAINED
            ids = self._collect_cascade_ids(objective.linked_item, collected=collected)
            if collected:
                for iid in ids:
                    models.CollectedItem.objects.get_or_create(
                        schedule_entry=entry, item_id=iid
                    )
            else:
                models.CollectedItem.objects.filter(
                    schedule_entry=entry, item_id__in=ids
                ).delete()
            self._sync_linked_objectives(entry)
        return Response({'objective_id': int(objective_id), 'status': new_status})

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

    @action(detail=False, methods=['post'])
    def delete_all(self, request: Request) -> Response:
        """Bulk delete every donation for the given event.

        Destructive — caller must supply `event_id` explicitly (no
        fallback to "all events" by design). Returns the number of
        rows deleted so the UI can confirm with the operator.
        """
        event_id = request.data.get('event_id')
        if not event_id:
            return Response(
                {'detail': 'event_id is required (delete_all is event-scoped).'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        qs = models.Donation.objects.filter(event_id=event_id)
        deleted, _ = qs.delete()
        return Response({'deleted': deleted})

    @action(detail=False, methods=['post'])
    def mute_all(self, request: Request) -> Response:
        """Bulk-set `mute_reason` on every donation for the given event.

        Default reason is `already_announced` — the most common
        operator intent for a "mute everything" sweep (e.g. clearing
        the list at the end of a stream so a re-import doesn't re-
        announce the entire history). Accepts any
        `models.MuteReason` value; empty string acts as an unmute-all
        sweep. Returns the number of rows touched.
        """
        event_id = request.data.get('event_id')
        if not event_id:
            return Response(
                {'detail': 'event_id is required (mute_all is event-scoped).'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        reason = request.data.get('mute_reason', models.MuteReason.ALREADY_ANNOUNCED)
        valid = {value for value, _ in models.MuteReason.choices}
        if reason not in valid:
            return Response(
                {'detail': f'Invalid mute_reason: {reason!r}. Valid: {sorted(valid)}'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        updated = models.Donation.objects.filter(event_id=event_id).update(
            mute_reason=reason,
        )
        return Response({'updated': updated, 'mute_reason': reason})


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
    if request.method == 'GET':
        # Polled every 2-3s by the control grid + OBS sources. Prefetch the
        # whole nested tree (game items + their sets/unlocks_with M2M,
        # objectives, item-sets, plus the entry's collected/objective rows) so
        # serializing ~70 items stays a handful of queries instead of N+1.
        models.CurrentlyPlaying.get()  # ensure the singleton row exists
        cp = (
            models.CurrentlyPlaying.objects
            .select_related('schedule_entry__game', 'schedule_entry__timer')
            .prefetch_related(
                'schedule_entry__runners',
                'schedule_entry__collected_items',
                'schedule_entry__objective_statuses',
                'schedule_entry__sound_triggers',
                'schedule_entry__game__items',
                'schedule_entry__game__items__sets',
                'schedule_entry__game__items__unlocks_with',
                'schedule_entry__game__objectives',
                'schedule_entry__game__item_sets',
            )
            .get(pk=1)
        )
        return Response(serializers.CurrentlyPlayingSerializer(cp).data)
    cp = models.CurrentlyPlaying.get()
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


class SoundAssetViewSet(viewsets.ModelViewSet):
    """CRUD on reusable audio assets. Referenced by
    ScheduleEntrySoundTrigger rows so the same file can wire to many
    entries / offsets without duplicate URLs."""
    queryset = models.SoundAsset.objects.all()
    serializer_class = serializers.SoundAssetSerializer


class ScheduleEntrySoundTriggerViewSet(viewsets.ModelViewSet):
    """CRUD on per-entry sound triggers + a `reset` bulk action that
    clears `last_fired_at` on every trigger of the active event so a
    show can be re-run without manual per-row resets."""
    queryset = models.ScheduleEntrySoundTrigger.objects.all().select_related(
        'sound', 'schedule_entry',
    )
    serializer_class = serializers.ScheduleEntrySoundTriggerSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        entry = self.request.query_params.get('schedule_entry')
        if entry:
            qs = qs.filter(schedule_entry_id=entry)
        return qs

    @action(detail=False, methods=['post'])
    def reset(self, request: Request) -> Response:
        """Clear `last_fired_at` on every trigger attached to the
        active event so they all become eligible to fire again."""
        event = models.Event.objects.filter(is_active=True).first()
        if not event:
            return Response(
                {'detail': 'No active event.'}, status=status.HTTP_400_BAD_REQUEST,
            )
        updated = models.ScheduleEntrySoundTrigger.objects.filter(
            schedule_entry__event=event, last_fired_at__isnull=False,
        ).update(last_fired_at=None)
        return Response({'reset': updated})

    @action(detail=True, methods=['post'])
    def reset_fire(self, request: Request, pk=None) -> Response:
        """Clear `last_fired_at` on a single trigger row."""
        obj = self.get_object()
        obj.last_fired_at = None
        obj.save(update_fields=['last_fired_at'])
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

    @action(detail=True, methods=['post'])
    def reset(self, request: Request, pk=None) -> Response:
        """Zero an incentive's progress so it can be re-run.

        Sets `current_amount = 0`, clears `reached_at` (so the next
        time the goal is reached the omnibar fires the celebration
        again), and — for bid-war payloads — zeros every option's
        `votes`. `is_active` is left alone so the operator's
        active/paused state isn't unexpectedly flipped.
        """
        obj = self.get_object()
        update_fields = ['current_amount', 'reached_at']
        obj.current_amount = Decimal('0')
        obj.reached_at = None
        # Bid-war reset — zero each option's votes so the bars in
        # the omnibar BidWarPanel reset alongside the headline total.
        if isinstance(obj.payload, dict):
            options = obj.payload.get('options')
            if isinstance(options, list):
                for o in options:
                    if isinstance(o, dict):
                        o['votes'] = 0
                obj.payload['options'] = options
                update_fields.append('payload')
        obj.save(update_fields=update_fields)
        return Response(self.get_serializer(obj).data)


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

    @action(detail=True, methods=['post'])
    def reset(self, request: Request, pk=None) -> Response:
        """Clear `reached_at` so the milestone is pending again.

        Mirrors `IncentiveViewSet.reset` — combined with the omnibar's
        self-cleaning `reachedIdsRef` set, this means the milestone's
        celebration banner will fire again the next time the running
        donation total crosses the threshold.
        """
        obj = self.get_object()
        if obj.reached_at is not None:
            obj.reached_at = None
            obj.save(update_fields=['reached_at'])
        return Response(self.get_serializer(obj).data)


class RaffleViewSet(viewsets.ModelViewSet):
    """CRUD on raffles (winnable prizes + their entry window).

    Filterable via ``?event={id}&active=true``. Custom actions:

      - ``POST /api/raffles/{id}/open/`` — manually open the entry window.
      - ``POST /api/raffles/{id}/close/`` — close it (freezes entries).
      - ``POST /api/raffles/{id}/draw/`` — draw ``quantity`` winners weighted
        by donation amount and create RaffleWinner rows. Idempotently skips
        donations that already won this raffle.
      - ``POST /api/raffles/{id}/reset/`` — delete winners + reopen.
    """
    queryset = models.Raffle.objects.all()
    serializer_class = serializers.RaffleSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        event_id = self.request.query_params.get('event')
        if event_id:
            qs = qs.filter(event_id=event_id)
        if self.request.query_params.get('active') == 'true':
            qs = qs.filter(is_active=True)
        return qs

    @action(detail=True, methods=['post'])
    def open(self, request: Request, pk=None) -> Response:
        obj = self.get_object()
        obj.status = models.RaffleStatus.OPEN
        if obj.opened_at is None:
            obj.opened_at = timezone.now()
        obj.closed_at = None
        obj.save(update_fields=['status', 'opened_at', 'closed_at'])
        return Response(self.get_serializer(obj).data)

    @action(detail=True, methods=['post'])
    def close(self, request: Request, pk=None) -> Response:
        obj = self.get_object()
        was_closed = obj.status == models.RaffleStatus.CLOSED
        now = timezone.now()
        obj.status = models.RaffleStatus.CLOSED
        obj.closed_at = now
        obj.save(update_fields=['status', 'closed_at'])
        # Confirm the closure on the omnibar with a short urgent banner so
        # viewers know entries have stopped (winners are drawn shortly
        # after). Skip if it was already closed — re-closing shouldn't spam
        # a second banner.
        if not was_closed:
            models.OmnibarOverride.objects.create(
                kind='raffle',
                payload={'message': f'Entries closed — {obj.name}. Winners drawn soon!'},
                target_lane=models.OmnibarOverride.LANE_BOTTOM,
                starts_at=now,
                expires_at=now + timedelta(seconds=RAFFLE_CLOSE_BANNER_SECONDS),
                priority=5,
                is_active=True,
            )
        return Response(self.get_serializer(obj).data)

    @action(detail=True, methods=['post'])
    def draw(self, request: Request, pk=None) -> Response:
        """Draw winners weighted by donation amount. Freezes the window
        (status=drawn, opened_at/closed_at stamped) so the result is
        reproducible and the public page stops accruing entrants."""
        obj = self.get_object()
        now = timezone.now()
        start, end = obj.effective_window(now)
        # Freeze the window onto the row before drawing so entrant_count and
        # the draw agree from here on.
        obj.opened_at = start
        obj.closed_at = (now if end is None else min(end, now))

        pool = list(obj.qualifying_donations(now))
        # Exclude donations that already won this raffle (so a re-draw to top
        # up forfeited prizes doesn't pick an existing winner again).
        already = set(
            obj.winners.exclude(donation__isnull=True).values_list('donation_id', flat=True)
        )
        pool = [d for d in pool if d.id not in already]

        remaining = max(0, obj.quantity - obj.winners.count())
        drawn = []
        while pool and remaining > 0:
            weights = [float(d.amount) for d in pool]
            if sum(weights) <= 0:
                pick = random.choice(pool)
            else:
                pick = random.choices(pool, weights=weights, k=1)[0]
            winner = models.RaffleWinner.objects.create(
                raffle=obj,
                donation=pick,
                donor_name=pick.donor_name or 'Anonymous',
            )
            drawn.append(winner)
            pool.remove(pick)
            remaining -= 1

        obj.status = models.RaffleStatus.DRAWN
        obj.save(update_fields=['status', 'opened_at', 'closed_at'])
        return Response({
            **self.get_serializer(obj).data,
            'drawn': serializers.RaffleWinnerSerializer(drawn, many=True).data,
        })

    @action(detail=True, methods=['post'])
    def reset(self, request: Request, pk=None) -> Response:
        """Delete drawn winners and reopen the raffle so it can be re-run."""
        obj = self.get_object()
        obj.winners.all().delete()
        obj.status = models.RaffleStatus.OPEN
        obj.closed_at = None
        obj.save(update_fields=['status', 'closed_at'])
        return Response(self.get_serializer(obj).data)


class RaffleWinnerViewSet(viewsets.ModelViewSet):
    """CRUD on raffle winners + their fulfillment trail (contact info, code,
    status). Filterable via ``?raffle={id}``.

    NOTE: serves PII (winner contact details). Must stay behind the same
    reverse-proxy gate as the rest of /control."""
    queryset = models.RaffleWinner.objects.all()
    serializer_class = serializers.RaffleWinnerSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        raffle_id = self.request.query_params.get('raffle')
        if raffle_id:
            qs = qs.filter(raffle_id=raffle_id)
        return qs


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


# ── Charities ──────────────────────────────────────────────────────────


class CharityViewSet(viewsets.ModelViewSet):
    """CRUD for the charity catalogue.

    Listing supports ``?active=true`` to hide soft-deleted entries and
    ``?event=<id>`` to scope to a specific event's beneficiaries
    (uses the EventCharity through-table and preserves its `order`).
    Lookup by `slug` is also supported so the public /charity/<slug>
    page can fetch by handle without leaking the numeric id.
    """
    queryset = (
        models.Charity.objects
        .prefetch_related(
            'websites', 'social_links', 'videos', 'images', 'impact_tiers',
        )
        .all()
    )
    serializer_class = serializers.CharitySerializer
    lookup_value_regex = r'[^/]+'

    def get_object(self):
        # Accept either pk or slug at /charities/<value>/. DRF's
        # default `get_object` is pk-only; we extend it so the public
        # page can reference charities by their stable slug.
        lookup = self.kwargs.get(self.lookup_field, '')
        if lookup.isdigit():
            return super().get_object()
        queryset = self.filter_queryset(self.get_queryset())
        obj = queryset.filter(slug=lookup).first()
        if obj is None:
            from django.http import Http404
            raise Http404(f'No Charity matches slug={lookup!r}.')
        self.check_object_permissions(self.request, obj)
        return obj

    def get_queryset(self):
        qs = super().get_queryset()
        if self.request.query_params.get('active') == 'true':
            qs = qs.filter(is_active=True)
        event_id = self.request.query_params.get('event')
        if event_id:
            # Preserve the EventCharity ordering when scoping to one
            # event so the response matches what the operator picked.
            qs = qs.filter(event_charities__event_id=event_id).order_by(
                'event_charities__order', 'event_charities__id',
            )
        return qs


class CharityWebsiteViewSet(viewsets.ModelViewSet):
    queryset = models.CharityWebsite.objects.all()
    serializer_class = serializers.CharityWebsiteSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        charity_id = self.request.query_params.get('charity')
        if charity_id:
            qs = qs.filter(charity_id=charity_id)
        return qs


class CharitySocialLinkViewSet(viewsets.ModelViewSet):
    queryset = models.CharitySocialLink.objects.all()
    serializer_class = serializers.CharitySocialLinkSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        charity_id = self.request.query_params.get('charity')
        if charity_id:
            qs = qs.filter(charity_id=charity_id)
        return qs


class CharityVideoViewSet(viewsets.ModelViewSet):
    queryset = models.CharityVideo.objects.all()
    serializer_class = serializers.CharityVideoSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        charity_id = self.request.query_params.get('charity')
        if charity_id:
            qs = qs.filter(charity_id=charity_id)
        return qs


class CharityImageViewSet(viewsets.ModelViewSet):
    queryset = models.CharityImage.objects.all()
    serializer_class = serializers.CharityImageSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        charity_id = self.request.query_params.get('charity')
        if charity_id:
            qs = qs.filter(charity_id=charity_id)
        return qs


class CharityImpactTierViewSet(viewsets.ModelViewSet):
    queryset = models.CharityImpactTier.objects.all()
    serializer_class = serializers.CharityImpactTierSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        charity_id = self.request.query_params.get('charity')
        if charity_id:
            qs = qs.filter(charity_id=charity_id)
        return qs


class EventCharityViewSet(viewsets.ModelViewSet):
    """Through-table CRUD. Filter by ``?event=<id>`` or
    ``?charity=<id>``. Setting is_primary=True demotes any other
    primary row for the same event (handled in the model's save)."""
    queryset = models.EventCharity.objects.select_related('event', 'charity').all()
    serializer_class = serializers.EventCharitySerializer

    def get_queryset(self):
        qs = super().get_queryset()
        event_id = self.request.query_params.get('event')
        if event_id:
            qs = qs.filter(event_id=event_id)
        charity_id = self.request.query_params.get('charity')
        if charity_id:
            qs = qs.filter(charity_id=charity_id)
        return qs

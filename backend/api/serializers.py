"""DRF serializers for the API."""
import uuid
from decimal import Decimal

from django.db.models import Max, Sum
from django.utils import timezone
from rest_framework import serializers
from rest_framework.validators import UniqueTogetherValidator

from . import models


class RunnerSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Runner
        fields = ['id', 'name', 'channel_url', 'is_streamer', 'profile_image_url']
        read_only_fields = ['profile_image_url']


class GameItemSetSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.GameItemSet
        fields = ['id', 'game', 'name', 'kind', 'order', 'show_in_overlay']


class GameItemSerializer(serializers.ModelSerializer):
    # Writable M2M: the control form posts the set ids an item belongs to.
    set_ids = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=models.GameItemSet.objects.all(),
        source='sets',
        required=False,
    )
    # Writable symmetric M2M: items collected together (e.g. Bow + Quiver).
    unlocks_with_ids = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=models.GameItem.objects.all(),
        source='unlocks_with',
        required=False,
    )

    class Meta:
        model = models.GameItem
        fields = ['id', 'game', 'name', 'image_url', 'category', 'group',
                  'set_ids', 'unlocks_with_ids', 'countable', 'starts_collected',
                  'order']


class GameObjectiveSerializer(serializers.ModelSerializer):
    # The linked GameItem's sprite, so an "item get" objective can fall back to
    # the item's image when it has no own `image_url`. Read-only; consumers use
    # `image_url || linked_item_image_url`. Relies on callers prefetching
    # `…objectives__linked_item` to stay query-cheap.
    linked_item_image_url = serializers.SerializerMethodField()

    class Meta:
        model = models.GameObjective
        fields = ['id', 'game', 'name', 'image_url', 'linked_item_image_url',
                  'category', 'group',
                  'linked_item', 'order', 'link_mode',
                  'setpiece_role', 'setpiece_name', 'clears_setpiece']

    def get_linked_item_image_url(self, obj) -> str:
        return obj.linked_item.image_url if obj.linked_item else ''


class GameSerializer(serializers.ModelSerializer):
    items = GameItemSerializer(many=True, read_only=True)
    objectives = GameObjectiveSerializer(many=True, read_only=True)
    item_sets = GameItemSetSerializer(many=True, read_only=True)

    class Meta:
        model = models.Game
        fields = [
            'id',
            'title',
            'platform',
            'layout_type',
            'default_play_minutes',
            'box_art_url',
            'igdb_id',
            'twitch_game_id',
            'hltb_id',
            'release_year',
            'asset_slug',
            'omnibar_layout',
            'item_group_order',
            'items',
            'objectives',
            'item_sets',
        ]


class GameLightSerializer(serializers.ModelSerializer):
    """Game without the heavy nested items / objectives / item-sets — for list
    views (schedule, up-next) that only need title + box art + metadata. Keeps
    the schedule list payload small and avoids serialising hundreds of
    collectibles no list consumer reads."""

    class Meta:
        model = models.Game
        fields = [
            'id', 'title', 'platform', 'layout_type', 'default_play_minutes',
            'box_art_url', 'release_year', 'asset_slug',
        ]


class DonationPlatformProfileSerializer(serializers.ModelSerializer):
    platform_label = serializers.CharField(source='get_platform_display', read_only=True)

    class Meta:
        model = models.DonationPlatformProfile
        fields = [
            'platform',
            'platform_label',
            'display_label',
            'logo_url',
            'fees_url',
            'gift_aid_url',
            'fee_warning',
            'minimum_donation_amount',
        ]


class DonationPageSerializer(serializers.ModelSerializer):
    """Donation page denormalised with its platform profile.

    The profile lives in its own model (one row per platform) but the picker
    UI consumes a flat per-page shape, so we copy `fees_url`, `gift_aid_url`,
    `fee_warning`, and `minimum_donation_amount` onto every page in the API
    response.
    """

    display_label = serializers.SerializerMethodField()
    logo_url = serializers.SerializerMethodField()
    fees_url = serializers.SerializerMethodField()
    gift_aid_url = serializers.SerializerMethodField()
    fee_warning = serializers.SerializerMethodField()
    minimum_donation_amount = serializers.SerializerMethodField()

    class Meta:
        model = models.DonationPage
        fields = [
            'id',
            'event',
            'platform',
            'display_label',
            'logo_url',
            'label',
            'url',
            'external_id',
            'is_primary',
            'order',
            'total_raised',
            'total_donation_count',
            'total_currency',
            'total_status',
            'total_synced_at',
            'fees_url',
            'gift_aid_url',
            'fee_warning',
            'minimum_donation_amount',
        ]
        read_only_fields = [
            'total_raised', 'total_donation_count', 'total_currency',
            'total_status', 'total_synced_at',
        ]

    def _profile(self, obj):
        # Bulk-load every platform profile on the first lookup and stash the
        # dict in the serializer context so a list of N donation pages costs
        # exactly one query regardless of how many distinct platforms appear.
        cache = self.context.setdefault('_platform_profiles', None)
        if cache is None:
            cache = {
                p.platform: p
                for p in models.DonationPlatformProfile.objects.all()
            }
            self.context['_platform_profiles'] = cache
        return cache.get(obj.platform)

    def get_display_label(self, obj) -> str:
        # The profile's display_label override, falling back to the platform
        # choice's verbose name (e.g. "Twitch Charity") if not set.
        p = self._profile(obj)
        if p and p.display_label:
            return p.display_label
        return obj.get_platform_display()

    def get_logo_url(self, obj) -> str:
        p = self._profile(obj)
        return p.logo_url if p else ''

    def get_fees_url(self, obj) -> str:
        p = self._profile(obj)
        return p.fees_url if p else ''

    def get_gift_aid_url(self, obj) -> str:
        p = self._profile(obj)
        return p.gift_aid_url if p else ''

    def get_fee_warning(self, obj) -> str:
        p = self._profile(obj)
        return p.fee_warning if p else ''

    def get_minimum_donation_amount(self, obj) -> str:
        p = self._profile(obj)
        return str(p.minimum_donation_amount) if p else '0.00'


class EventTwitchChannelSerializer(serializers.ModelSerializer):
    """A Twitch channel attached to an event. Read nested on the event tree and
    written via the dedicated /api/event-twitch-channels/ endpoint. Exposes
    whether the channel is OAuth-connected + its granted scopes, but never the
    tokens themselves."""

    is_connected = serializers.SerializerMethodField()
    connection_scopes = serializers.SerializerMethodField()

    class Meta:
        model = models.EventTwitchChannel
        fields = [
            'id', 'event', 'login', 'display_name', 'is_primary',
            'track_charity', 'charity_slug', 'order', 'is_active',
            'is_connected', 'connection_scopes',
        ]

    def get_is_connected(self, obj) -> bool:
        c = obj.connection
        return bool(c and c.is_active and (c.access_token or c.refresh_token))

    def get_connection_scopes(self, obj) -> list:
        c = obj.connection
        return (c.scopes or '').split() if c else []


class ChatAnnouncementSerializer(serializers.ModelSerializer):
    """Per-event, per-trigger Twitch chat announcement config. ``placeholders``
    lists the template fields the trigger supports (for the editor's hints)."""

    trigger_display = serializers.CharField(source='get_trigger_display', read_only=True)
    placeholders = serializers.SerializerMethodField()

    class Meta:
        model = models.ChatAnnouncement
        fields = [
            'id', 'event', 'trigger', 'trigger_display', 'enabled', 'template',
            'as_announcement', 'announcement_color', 'placeholders',
        ]

    def get_placeholders(self, obj) -> list:
        from . import chat
        return chat.TEMPLATE_PLACEHOLDERS.get(obj.trigger, [])


class RewardActionSerializer(serializers.ModelSerializer):
    action_type_display = serializers.CharField(
        source='get_action_type_display', read_only=True,
    )

    class Meta:
        model = models.RewardAction
        fields = [
            'id', 'mapping', 'action_type', 'action_type_display', 'params',
            'enabled', 'order',
        ]


class RewardMappingSerializer(serializers.ModelSerializer):
    """A channel-point reward mapped to one-or-more actions (read nested)."""

    actions = RewardActionSerializer(many=True, read_only=True)

    class Meta:
        model = models.RewardMapping
        fields = [
            'id', 'event', 'reward_id', 'reward_title', 'enabled', 'order',
            'actions',
        ]


class ScheduledJobSerializer(serializers.ModelSerializer):
    is_due = serializers.BooleanField(read_only=True)

    class Meta:
        model = models.ScheduledJob
        fields = [
            'id', 'key', 'label', 'command', 'description', 'enabled',
            'interval_seconds', 'last_run_at', 'last_status', 'last_output',
            'is_due', 'updated_at',
        ]
        read_only_fields = [
            'key', 'command', 'last_run_at', 'last_status', 'last_output',
            'is_due', 'updated_at',
        ]


class ShoutoutConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.ShoutoutConfig
        fields = [
            'id', 'event', 'enabled', 'shout_donations', 'shout_raids',
            'min_donation_amount', 'only_when_live', 'global_cooldown_seconds',
            'target_cooldown_seconds', 'max_age_minutes',
        ]
        read_only_fields = ['id', 'event']


class ShoutoutRequestSerializer(serializers.ModelSerializer):
    reason_display = serializers.CharField(source='get_reason_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = models.ShoutoutRequest
        fields = [
            'id', 'event', 'target_login', 'target_display', 'reason',
            'reason_display', 'note', 'status', 'status_display', 'requested_at',
            'sent_at', 'detail',
        ]
        read_only_fields = [
            'event', 'target_display', 'reason_display', 'status', 'status_display',
            'requested_at', 'sent_at', 'detail',
        ]


class TwitchPredictionSerializer(serializers.ModelSerializer):
    """Read-only mirror of a Twitch Prediction. Created/resolved via the
    viewset's custom actions, not direct writes."""

    class Meta:
        model = models.TwitchPrediction
        fields = [
            'id', 'event', 'prediction_id', 'title', 'status', 'outcomes',
            'winning_outcome_id', 'window_seconds', 'created_at', 'updated_at',
        ]
        read_only_fields = fields


class RecurringChatMessageSerializer(serializers.ModelSerializer):
    """A recurring chat message (e.g. a periodic donation CTA)."""

    is_due = serializers.BooleanField(read_only=True)
    placeholders = serializers.SerializerMethodField()

    class Meta:
        model = models.RecurringChatMessage
        fields = [
            'id', 'event', 'label', 'template', 'interval_minutes',
            'only_when_live', 'enabled', 'last_posted_at', 'order',
            'is_due', 'placeholders',
        ]
        read_only_fields = ['last_posted_at', 'is_due', 'placeholders']

    def get_placeholders(self, obj) -> list:
        from . import chat
        return chat.RECURRING_PLACEHOLDERS


class EventSerializer(serializers.ModelSerializer):
    donation_pages = DonationPageSerializer(many=True, read_only=True)
    donation_platform_profiles = serializers.SerializerMethodField()
    twitch_channels = EventTwitchChannelSerializer(many=True, read_only=True)
    chat_announcements = ChatAnnouncementSerializer(many=True, read_only=True)
    recurring_chat_messages = RecurringChatMessageSerializer(many=True, read_only=True)
    # Primary channel login for single-channel consumers (Follow link, embed).
    primary_twitch_channel = serializers.SerializerMethodField()
    # Charities are read here via the through-table so consumers get the
    # per-event ordering + is_primary flag, with the full Charity nested
    # so the public /event landing can render branding without a second
    # fetch. Writes go through the dedicated /api/event-charities/
    # endpoint.
    event_charities = serializers.SerializerMethodField()

    class Meta:
        model = models.Event
        fields = [
            'id',
            'name',
            'start_time',
            'currency_symbol',
            'is_active',
            'twitch_channels',
            'primary_twitch_channel',
            'update_twitch_category',
            'twitch_title_template',
            'logo_url',
            'banner_url',
            'gameblast_logo_url',
            'omnibar_layout',
            'omnibar_transitions',
            'donation_pages',
            'donation_platform_profiles',
            'event_charities',
            'chat_announcements',
            'recurring_chat_messages',
        ]

    def _platform_profiles(self):
        cache = self.context.setdefault('_event_platform_profiles', None)
        if cache is None:
            cache = {
                p.platform: p
                for p in models.DonationPlatformProfile.objects.all()
            }
            self.context['_event_platform_profiles'] = cache
        return cache

    def get_donation_platform_profiles(self, obj) -> dict:
        choice_labels = dict(models.DonationPlatform.choices)
        return {
            key: {
                'platform': key,
                'platform_label': choice_labels.get(key, key),
                'display_label': profile.display_label or choice_labels.get(key, key),
                'logo_url': profile.logo_url,
                'fees_url': profile.fees_url,
                'gift_aid_url': profile.gift_aid_url,
                'fee_warning': profile.fee_warning,
                'minimum_donation_amount': str(profile.minimum_donation_amount),
            }
            for key, profile in self._platform_profiles().items()
        }

    def get_primary_twitch_channel(self, obj) -> str:
        # Iterate the (prefetched) list rather than a filtered query so this
        # stays cheap across the events list.
        chans = list(obj.twitch_channels.all())
        primary = next((c for c in chans if c.is_primary), None) or (
            chans[0] if chans else None
        )
        return primary.login if primary else ''

    def get_event_charities(self, obj):
        # Forward-declared serializer — `EventCharitySerializer` is
        # defined further down the module, so we resolve it at call
        # time rather than at class-body parse time.
        return EventCharitySerializer(
            obj.event_charities.select_related('charity').all(),
            many=True,
        ).data


class TimerSerializer(serializers.ModelSerializer):
    is_running = serializers.BooleanField(read_only=True)
    is_paused = serializers.BooleanField(read_only=True)
    total_seconds = serializers.IntegerField(read_only=True)
    total_ms = serializers.IntegerField(read_only=True)

    class Meta:
        model = models.TimerRun
        fields = [
            'id',
            'schedule_entry',
            'started_at',
            'paused_at',
            'accumulated_seconds',
            'accumulated_ms',
            'ended_at',
            'is_running',
            'is_paused',
            'total_seconds',
            'total_ms',
        ]


class SoundAssetSerializer(serializers.ModelSerializer):
    """Reusable audio asset row. Read/write — the operator manages the
    library from /control/omnibar Sound library section."""

    class Meta:
        model = models.SoundAsset
        fields = ['id', 'name', 'url', 'volume', 'created_at']
        read_only_fields = ['created_at']


class ScheduleEntrySoundTriggerSerializer(serializers.ModelSerializer):
    """One trigger row. Writes accept `sound` as a primary-key ref;
    reads expose the full `sound_detail` so the omnibar feed has the
    url + volume + name without an extra fetch."""

    sound_detail = SoundAssetSerializer(source='sound', read_only=True)

    class Meta:
        model = models.ScheduleEntrySoundTrigger
        fields = [
            'id',
            'schedule_entry',
            'sound',
            'sound_detail',
            'anchor',
            'offset_seconds',
            'tag',
            'message',
            'subhead',
            'priority',
            'duration_seconds',
            'show_banner',
            'is_active',
            'last_fired_at',
        ]
        read_only_fields = ['last_fired_at']


class ScheduleEntrySerializer(serializers.ModelSerializer):
    game = GameSerializer(read_only=True)
    game_id = serializers.PrimaryKeyRelatedField(
        queryset=models.Game.objects.all(),
        source='game',
        write_only=True,
        required=False,
        allow_null=True,
    )
    runners = RunnerSerializer(many=True, read_only=True)
    sound_triggers = ScheduleEntrySoundTriggerSerializer(many=True, read_only=True)
    runner_ids = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=models.Runner.objects.all(),
        source='runners',
        write_only=True,
        required=False,
    )
    effective_minutes = serializers.IntegerField(read_only=True)
    display_title = serializers.CharField(read_only=True)
    timer = TimerSerializer(read_only=True)
    collected_item_ids = serializers.SerializerMethodField()
    collected_item_counts = serializers.SerializerMethodField()
    obtained_objective_ids = serializers.SerializerMethodField()
    skipped_objective_ids = serializers.SerializerMethodField()
    objective_split_ms = serializers.SerializerMethodField()
    objective_counts = serializers.SerializerMethodField()
    setpieces = serializers.SerializerMethodField()
    order = serializers.IntegerField(required=False)

    def get_collected_item_ids(self, obj) -> list:
        # Return the GameItem ids that have been collected (NOT the
        # CollectedItem row pks) so the control grid / OBS panel can match
        # them against game.items[].id. Iterates the prefetched rows.
        return [ci.item_id for ci in obj.collected_items.all()]

    def get_collected_item_counts(self, obj) -> dict:
        # {game_item_id: quantity} for collected items — lets the control grid
        # render the tally on countable items (keys, maps...). Keys are strings
        # because JSON object keys are always strings.
        return {str(ci.item_id): ci.quantity for ci in obj.collected_items.all()}

    def get_obtained_objective_ids(self, obj) -> list:
        # Iterate the prefetched statuses (no extra queries) and pull the
        # objective ids that are obtained. Absence of a row = outstanding.
        return [
            s.objective_id
            for s in obj.objective_statuses.all()
            if s.status == models.ObjectiveStatus.OBTAINED
        ]

    def get_skipped_objective_ids(self, obj) -> list:
        return [
            s.objective_id
            for s in obj.objective_statuses.all()
            if s.status == models.ObjectiveStatus.SKIPPED
        ]

    def get_objective_split_ms(self, obj) -> dict:
        # {objective_id: split_ms} for obtained objectives that have a stamped
        # split time — the timer page renders these as the frozen split values.
        return {
            str(s.objective_id): s.split_ms
            for s in obj.objective_statuses.all()
            if s.status == models.ObjectiveStatus.OBTAINED and s.split_ms is not None
        }

    def get_objective_counts(self, obj) -> dict:
        # {objective_id: count} for link_mode=tally objectives with a per-dungeon
        # tally (e.g. small keys). Timer / OBS render the number; omitted when 0.
        return {
            str(s.objective_id): s.count
            for s in obj.objective_statuses.all()
            if s.count
        }

    def get_setpieces(self, obj) -> list:
        # Live setpieces, highest priority first (model Meta ordering). The
        # omnibar surfaces only the top one; the control panel lists them all.
        return [
            {
                'id': sp.id,
                'kind': sp.kind,
                'name': sp.name,
                'stage': sp.stage,
                'priority': sp.priority,
                'is_auto': sp.is_auto,
                'started_at': sp.started_at.isoformat() if sp.started_at else None,
            }
            for sp in obj.setpieces.all()
        ]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # DRF auto-generates a UniqueTogetherValidator from Meta.unique_together
        # which forces `order` to be supplied even when we want to auto-assign.
        # The DB constraint still protects integrity; drop the serializer-level
        # check so omitting `order` falls through to create() below.
        self.validators = [
            v for v in self.validators if not isinstance(v, UniqueTogetherValidator)
        ]

    def create(self, validated_data):
        if validated_data.get('order') is None:
            event = validated_data['event']
            current_max = models.ScheduleEntry.objects.filter(event=event).aggregate(
                m=Max('order')
            )['m']
            validated_data['order'] = (current_max or 0) + 1
        return super().create(validated_data)

    def validate(self, attrs):
        # Game slots must reference a Game (either via existing instance on
        # update or via game_id on create). Break slots must not.
        slot_type = attrs.get('slot_type') or (
            self.instance.slot_type if self.instance else models.ScheduleEntry.SLOT_GAME
        )
        # `game` may come through under the 'game' key after source='game'.
        if 'game' in attrs:
            game = attrs['game']
        elif self.instance:
            game = self.instance.game
        else:
            game = None
        if slot_type == models.ScheduleEntry.SLOT_GAME and game is None:
            raise serializers.ValidationError({'game_id': 'Required for game slots.'})
        if slot_type != models.ScheduleEntry.SLOT_GAME and game is not None:
            # Don't silently drop the game; tell the caller.
            raise serializers.ValidationError(
                {'game_id': 'Break slots must not reference a game.'}
            )
        parent = attrs.get('parent_entry') if 'parent_entry' in attrs else (
            self.instance.parent_entry if self.instance else None
        )
        if parent is not None:
            if slot_type == models.ScheduleEntry.SLOT_GAME:
                raise serializers.ValidationError(
                    {'parent_entry': 'Only break slots can attach to another entry.'}
                )
            if parent.slot_type != models.ScheduleEntry.SLOT_GAME:
                raise serializers.ValidationError(
                    {'parent_entry': 'Breaks can only attach to game slots.'}
                )
            if self.instance and parent.pk == self.instance.pk:
                raise serializers.ValidationError(
                    {'parent_entry': 'A slot cannot be its own parent.'}
                )
        return attrs

    class Meta:
        model = models.ScheduleEntry
        fields = [
            'id',
            'event',
            'slot_type',
            'title',
            'display_title',
            'game',
            'game_id',
            'parent_entry',
            'start_offset_minutes',
            'runners',
            'runner_ids',
            'order',
            'planned_minutes',
            'effective_minutes',
            'started_at',
            'finished_at',
            'is_completed',
            'was_skipped',
            'current_objective',
            'death_count',
            'setpieces',
            'notes',
            'timer_segment_ids',
            'timer',
            'collected_item_ids',
            'collected_item_counts',
            'obtained_objective_ids',
            'skipped_objective_ids',
            'objective_split_ms',
            'objective_counts',
            'sound_triggers',
        ]


class ScheduleEntryLightSerializer(serializers.ModelSerializer):
    """Compact schedule entry for list views (public /schedule, up-next). Uses
    GameLightSerializer and drops the per-run collectible/objective/timer/sound
    payloads that only the single currently-playing entry needs — so a 60-slot
    schedule is a few KB instead of hundreds."""

    game = GameLightSerializer(read_only=True)
    runners = RunnerSerializer(many=True, read_only=True)
    effective_minutes = serializers.IntegerField(read_only=True)
    display_title = serializers.CharField(read_only=True)

    class Meta:
        model = models.ScheduleEntry
        fields = [
            'id', 'event', 'slot_type', 'title', 'display_title', 'game',
            'parent_entry', 'start_offset_minutes', 'runners', 'order',
            'planned_minutes', 'effective_minutes', 'started_at', 'finished_at',
            'is_completed', 'was_skipped', 'current_objective', 'death_count',
        ]


class CollectedItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.CollectedItem
        fields = ['id', 'schedule_entry', 'item', 'collected_at']


class DonationSerializer(serializers.ModelSerializer):
    # `is_muted` is a derived @property on the model — surface it as a
    # read-only boolean so existing TTS / omnibar consumers keep
    # working unchanged while writes go through `mute_reason`.
    is_muted = serializers.BooleanField(read_only=True)

    class Meta:
        model = models.Donation
        fields = [
            'id',
            'event',
            'platform',
            'donor_name',
            'amount',
            'currency',
            'message',
            'donated_at',
            'external_id',
            'gift_aid_amount',
            'image_url',
            'source_channel',
            'mute_reason',
            'is_muted',
        ]
        # `Donation.Meta.unique_together = [('platform', 'external_id')]`
        # makes DRF do TWO unhelpful things for the /control/donations
        # "Add donation" form:
        #   1. Auto-inject a UniqueTogetherValidator (stripped in
        #      `__init__` below).
        #   2. Force every field in the constraint to `required=True`
        #      on the generated serializer field — overriding the
        #      model's `blank=True`. Override it back here so blank
        #      input is accepted; `create()` then synthesises a unique
        #      placeholder so manual rows don't collide at the DB
        #      level either.
        extra_kwargs = {
            'external_id': {
                'required': False,
                'allow_blank': True,
                'default': '',
            },
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Strip the UniqueTogetherValidator (see note in Meta above).
        # The DB unique constraint still protects against duplicate
        # platform IDs from the polling jobs.
        self.validators = [
            v for v in self.validators if not isinstance(v, UniqueTogetherValidator)
        ]

    def create(self, validated_data):
        # Blank `external_id` would collide with any other blank-id
        # donation on the same platform (DB unique_together). Synthesise
        # a unique placeholder for manually-entered donations so the
        # user never has to fill in an ID that's only meaningful when
        # polling an external platform.
        if not validated_data.get('external_id'):
            validated_data['external_id'] = f'manual-{uuid.uuid4().hex}'
        return super().create(validated_data)


class BrbTimerSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.BrbTimer
        fields = ['id', 'target_time', 'message', 'is_active', 'created_at']


class TtsNowReadingSerializer(serializers.ModelSerializer):
    """Flat view of the TTS-now-reading singleton. Exposes `donation_id`
    so the polling control panel doesn't have to navigate a nested
    Donation object — it already has the donation in its main list."""

    donation_id = serializers.PrimaryKeyRelatedField(
        source='donation', queryset=models.Donation.objects.all(),
        allow_null=True, required=False,
    )

    class Meta:
        model = models.TtsNowReading
        fields = ['donation_id', 'started_at']
        read_only_fields = ['started_at']


class ChestReplaySerializer(serializers.ModelSerializer):
    """Flat view of the chest-announcer-replay singleton. Same shape
    as TtsReplaySerializer so the chest-announcer overlay can reuse
    the same high-water-mark polling pattern."""

    donation_id = serializers.PrimaryKeyRelatedField(
        source='donation', queryset=models.Donation.objects.all(),
        allow_null=True, required=False,
    )

    class Meta:
        model = models.ChestReplay
        fields = ['donation_id', 'requested_at']
        read_only_fields = ['requested_at']


class TtsReplaySerializer(serializers.ModelSerializer):
    """Serialises the TtsReplay singleton. Exposes `donation_id` (flat)
    so the /obs/tts polling loop doesn't need to deal with a nested
    Donation object — it already has the donation in its main poll."""

    donation_id = serializers.PrimaryKeyRelatedField(
        source='donation', queryset=models.Donation.objects.all(),
        allow_null=True, required=False,
    )

    class Meta:
        model = models.TtsReplay
        fields = ['donation_id', 'requested_at']
        read_only_fields = ['requested_at']


class CurrentlyPlayingSerializer(serializers.ModelSerializer):
    schedule_entry_detail = ScheduleEntrySerializer(
        source='schedule_entry', read_only=True
    )

    class Meta:
        model = models.CurrentlyPlaying
        fields = ['schedule_entry', 'schedule_entry_detail', 'updated_at']


class TwitchCharityCampaignSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.TwitchCharityCampaign
        fields = [
            'campaign_id', 'charity_name', 'charity_logo_url', 'charity_website',
            'charity_description', 'target_amount', 'current_amount', 'currency',
            'is_active', 'started_at', 'stopped_at', 'updated_at',
        ]


class ThemeSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.ThemeSettings
        fields = [
            'id', 'name', 'is_active',
            'primary', 'primary_bright', 'secondary',
            'background_from', 'background_to', 'background_gradient_angle',
            'navbar_tint_color',
            'text_color', 'text_muted', 'line_color',
            'logo_url', 'logo_small_url', 'omnibar_logo_url', 'favicon_url',
            'background_video_url', 'background_image_url',
            'button_gradient_from', 'button_gradient_to', 'button_gradient_angle',
            'button_text_color', 'button_border_color',
            'divider_thickness', 'image_hue_rotate',
            'link_color', 'link_hover_color',
            'accent_1', 'accent_2', 'accent_3',
            'surface_color', 'surface_text_color', 'surface_border_color',
            'omnibar_lane_bg', 'omnibar_tag_color', 'omnibar_ticker_accent',
            'omnibar_brand_from', 'omnibar_brand_to', 'omnibar_brand_text',
            'omnibar_top_tag_from', 'omnibar_top_tag_to',
            'omnibar_top_tag_text', 'omnibar_top_lane_text',
            'omnibar_bottom_tag_from', 'omnibar_bottom_tag_to',
            'omnibar_bottom_tag_text', 'omnibar_bottom_lane_text',
            'omnibar_total_from', 'omnibar_total_to', 'omnibar_total_text',
            'omnibar_celebration_tag',
            'omnibar_celebration_tag_from', 'omnibar_celebration_tag_to',
            'omnibar_celebration_heading',
            'omnibar_celebration_sub', 'omnibar_celebration_flash',
            'heading_font', 'body_font',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class LayoutPresetSerializer(serializers.ModelSerializer):
    # Human-readable aspect-ratio label for the control-panel selector.
    layout_type_display = serializers.CharField(
        source='get_layout_type_display', read_only=True,
    )

    class Meta:
        model = models.LayoutPreset
        fields = [
            'id', 'name', 'layout_type', 'layout_type_display',
            'is_active', 'config', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


# ── Omnibar v2 ─────────────────────────────────────────────────────────────

class PlaythroughEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.PlaythroughEvent
        fields = ['id', 'schedule_entry', 'kind', 'payload',
                  'created_at', 'expires_at']
        read_only_fields = ['id', 'created_at']


class OmnibarOverrideSerializer(serializers.ModelSerializer):
    is_live = serializers.BooleanField(read_only=True)

    class Meta:
        model = models.OmnibarOverride
        fields = ['id', 'kind', 'payload', 'target_lane', 'starts_at',
                  'expires_at', 'priority', 'is_active', 'is_live',
                  'created_at']
        read_only_fields = ['id', 'created_at', 'is_live']


class ExternalEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.ExternalEvent
        fields = ['id', 'source', 'kind', 'payload',
                  'occurred_at', 'consumed_at']
        read_only_fields = ['id']


class IncentiveSerializer(serializers.ModelSerializer):
    progress_pct = serializers.FloatField(read_only=True)
    is_reached = serializers.BooleanField(read_only=True)

    class Meta:
        model = models.Incentive
        fields = ['id', 'event', 'name', 'description', 'image_url',
                  'goal_amount', 'current_amount', 'is_active',
                  'reached_at', 'schedule_entry', 'order', 'payload',
                  'progress_pct', 'is_reached',
                  'created_at', 'updated_at']
        read_only_fields = ['id', 'reached_at', 'progress_pct', 'is_reached',
                            'created_at', 'updated_at']


class MilestoneSerializer(serializers.ModelSerializer):
    is_reached = serializers.BooleanField(read_only=True)

    class Meta:
        model = models.Milestone
        fields = ['id', 'event', 'name', 'threshold_amount',
                  'celebration_message', 'reached_at', 'announced', 'audio_url',
                  'tag_color_from', 'tag_color_to',
                  'heading_color', 'sub_color', 'flash_color',
                  'order', 'is_reached', 'created_at']
        read_only_fields = ['id', 'reached_at', 'is_reached', 'created_at']


class RaffleSerializer(serializers.ModelSerializer):
    """Public-safe raffle view. Exposes derived entry stats + winner display
    names but NEVER winner contact details — those live on RaffleWinner and
    are served only via /api/raffle-winners/ (see the privacy note in the
    raffle plan)."""

    entrant_count = serializers.SerializerMethodField()
    total_weight = serializers.SerializerMethodField()
    is_open = serializers.SerializerMethodField()
    winner_names = serializers.SerializerMethodField()

    class Meta:
        model = models.Raffle
        fields = ['id', 'event', 'name', 'description', 'image_url',
                  'delivery_method', 'quantity', 'min_amount',
                  'condition_type', 'schedule_entry',
                  'window_start', 'window_end',
                  'status', 'opened_at', 'closed_at',
                  'is_active', 'order', 'payload',
                  'entrant_count', 'total_weight', 'is_open', 'winner_names',
                  'created_at', 'updated_at']
        read_only_fields = ['id', 'opened_at', 'closed_at',
                            'entrant_count', 'total_weight', 'is_open',
                            'winner_names', 'created_at', 'updated_at']

    def _now(self):
        # Cache a single "now" in the serializer context so a list of N
        # raffles shares one timestamp (and the window maths stays consistent).
        if 'now' not in self.context:
            self.context['now'] = timezone.now()
        return self.context['now']

    def get_entrant_count(self, obj) -> int:
        return obj.qualifying_donations(self._now()).count()

    def get_total_weight(self, obj) -> str:
        agg = obj.qualifying_donations(self._now()).aggregate(s=Sum('amount'))
        return str(agg['s'] or Decimal('0'))

    def get_is_open(self, obj) -> bool:
        return obj.is_open(self._now())

    def get_winner_names(self, obj) -> list:
        return [w.donor_name for w in obj.winners.all()]


class RaffleWinnerSerializer(serializers.ModelSerializer):
    """Winner + fulfillment record. Includes contact PII — keep this endpoint
    behind the control-panel reverse-proxy gate."""

    class Meta:
        model = models.RaffleWinner
        fields = ['id', 'raffle', 'donation', 'donor_name', 'drawn_at',
                  'contact_info', 'delivery_code', 'fulfillment_status', 'notes']
        read_only_fields = ['id', 'drawn_at']


class CharitySlideSerializer(serializers.ModelSerializer):
    """Charity-cluster slide — kind='logo' uses image_url + alt_text,
    kind='blurb' uses title + body."""

    class Meta:
        model = models.CharitySlide
        fields = ['id', 'kind', 'title', 'body', 'image_url', 'alt_text',
                  'order', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class ChestAnnouncerSettingsSerializer(serializers.ModelSerializer):
    """Singleton settings for the /obs/chest-announcer overlay."""

    class Meta:
        model = models.ChestAnnouncerSettings
        fields = [
            'audio_enabled',
            'tts_enabled',
            'between_cards_ms',
            'card_min_hold_ms',
            'card_max_hold_ms',
            'scale',
            'updated_at',
        ]
        read_only_fields = ['updated_at']


class LayoutGuideSettingsSerializer(serializers.ModelSerializer):
    """Singleton: OBS layout capture-alignment guide + /obs/full layout-type
    override."""

    class Meta:
        model = models.LayoutGuideSettings
        fields = ['show_guide', 'forced_layout_type', 'updated_at']
        read_only_fields = ['updated_at']


class ChestAnnouncerSoundTriggerSerializer(serializers.ModelSerializer):
    """Per-rule sound mapping for the chest announcer."""

    game_title = serializers.CharField(source='game.title', read_only=True)

    class Meta:
        model = models.ChestAnnouncerSoundTrigger
        fields = [
            'id',
            'name',
            'kind',
            'match',
            'game',
            'game_title',
            'sound_url',
            'volume',
            'priority',
            'is_active',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'game_title', 'created_at', 'updated_at']


# ── Charities ────────────────────────────────────────────────────────────
#
# The charity surface is a parent (Charity) plus four child tables
# (websites, videos, images, impact tiers). All four children are
# embedded inside the Charity payload as read-only nested serializers
# so a single GET /charities/<id>/ returns everything the public
# /charity page needs. Writes flow through the dedicated child endpoints
# so the operator UI can PATCH a single row without round-tripping the
# whole nested tree (mirrors how DonationPage operates relative to
# Event).


class CharityWebsiteSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.CharityWebsite
        fields = ['id', 'charity', 'label', 'url', 'order']


class CharitySocialLinkSerializer(serializers.ModelSerializer):
    """One social-media profile row. `platform_label` exposes the
    enum's display name so the frontend doesn't need to duplicate the
    label catalogue."""

    platform_label = serializers.CharField(
        source='get_platform_display', read_only=True,
    )

    class Meta:
        model = models.CharitySocialLink
        fields = [
            'id',
            'charity',
            'platform',
            'platform_label',
            'url',
            'handle',
            'order',
        ]
        read_only_fields = ['platform_label']


class CharityVideoSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.CharityVideo
        fields = ['id', 'charity', 'title', 'url', 'thumbnail_url',
                  'description', 'order']


class CharityImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.CharityImage
        fields = ['id', 'charity', 'image_url', 'alt_text', 'caption', 'order']


class CharityImpactTierSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.CharityImpactTier
        fields = [
            'id',
            'charity',
            'amount',
            'currency',
            'image_url',
            'alt_text',
            'description',
            'description_html',
            'order',
        ]


class CharitySerializer(serializers.ModelSerializer):
    """Read-heavy charity payload — embeds the four child tables so the
    public /charity page can render everything from a single fetch."""

    websites = CharityWebsiteSerializer(many=True, read_only=True)
    social_links = CharitySocialLinkSerializer(many=True, read_only=True)
    videos = CharityVideoSerializer(many=True, read_only=True)
    images = CharityImageSerializer(many=True, read_only=True)
    impact_tiers = CharityImpactTierSerializer(many=True, read_only=True)

    class Meta:
        model = models.Charity
        fields = [
            'id',
            'slug',
            'name',
            'short_name',
            'charity_number',
            'mission_statement',
            'mission_tagline',
            'logo_url',
            'logo_thumbnail_url',
            'banner_url',
            'primary_website_url',
            'help_cta_headline',
            'help_cta_body',
            'help_cta_url',
            'donate_cta_headline',
            'donate_cta_body',
            'donate_cta_url',
            'supported_platforms',
            'is_active',
            'order',
            'created_at',
            'updated_at',
            'websites',
            'social_links',
            'videos',
            'images',
            'impact_tiers',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate_supported_platforms(self, value):
        # Keep `supported_platforms` honest — every key must be a known
        # DonationPlatform choice. Stops typos at write time instead of
        # silently breaking the picker UI later.
        if not isinstance(value, list):
            raise serializers.ValidationError('Must be a list of platform keys.')
        valid = {choice for choice, _ in models.DonationPlatform.choices}
        bad = [v for v in value if v not in valid]
        if bad:
            raise serializers.ValidationError(
                f'Unknown DonationPlatform key(s): {bad}. Valid choices: {sorted(valid)}.'
            )
        return value


class EventCharitySerializer(serializers.ModelSerializer):
    """Through-table link. Reads include the nested charity payload so
    a viewer landing on /events/<id>/ can render charity branding
    without a second fetch; writes only need event + charity ids."""

    charity_detail = CharitySerializer(source='charity', read_only=True)

    class Meta:
        model = models.EventCharity
        fields = [
            'id',
            'event',
            'charity',
            'charity_detail',
            'is_primary',
            'order',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at']


class ActivityLogSerializer(serializers.ModelSerializer):
    """Read-only view of the audit trail for the control panel."""

    class Meta:
        model = models.ActivityLog
        fields = [
            'id',
            'created_at',
            'category',
            'action',
            'level',
            'summary',
            'source',
            'target_type',
            'target_id',
            'detail',
            'request_method',
            'request_path',
            'status_code',
            'acknowledged_at',
        ]
        read_only_fields = fields

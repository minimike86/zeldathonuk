"""DRF serializers for the API."""
import uuid

from django.db.models import Max
from rest_framework import serializers
from rest_framework.validators import UniqueTogetherValidator

from . import models


class RunnerSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Runner
        fields = ['id', 'name', 'channel_url', 'is_streamer', 'profile_image_url']
        read_only_fields = ['profile_image_url']


class GameItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.GameItem
        fields = ['id', 'game', 'name', 'image_url', 'category', 'order']


class GameSerializer(serializers.ModelSerializer):
    items = GameItemSerializer(many=True, read_only=True)

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
            'omnibar_layout',
            'items',
        ]


class DonationPlatformProfileSerializer(serializers.ModelSerializer):
    platform_label = serializers.CharField(source='get_platform_display', read_only=True)

    class Meta:
        model = models.DonationPlatformProfile
        fields = [
            'platform',
            'platform_label',
            'display_label',
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
            'label',
            'url',
            'external_id',
            'is_primary',
            'order',
            'fees_url',
            'gift_aid_url',
            'fee_warning',
            'minimum_donation_amount',
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


class EventSerializer(serializers.ModelSerializer):
    donation_pages = DonationPageSerializer(many=True, read_only=True)

    class Meta:
        model = models.Event
        fields = [
            'id',
            'name',
            'start_time',
            'currency_symbol',
            'is_active',
            'logo_url',
            'banner_url',
            'gameblast_logo_url',
            'omnibar_layout',
            'omnibar_transitions',
            'donation_pages',
        ]


class TimerSerializer(serializers.ModelSerializer):
    is_running = serializers.BooleanField(read_only=True)
    total_seconds = serializers.IntegerField(read_only=True)

    class Meta:
        model = models.TimerRun
        fields = [
            'id',
            'schedule_entry',
            'started_at',
            'paused_at',
            'accumulated_seconds',
            'ended_at',
            'is_running',
            'total_seconds',
        ]


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
    collected_item_ids = serializers.PrimaryKeyRelatedField(
        many=True, read_only=True, source='collected_items'
    )
    order = serializers.IntegerField(required=False)

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
            'setpiece_kind',
            'setpiece_name',
            'setpiece_stage',
            'setpiece_started_at',
            'notes',
            'timer',
            'collected_item_ids',
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


class ThemeSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.ThemeSettings
        fields = [
            'id', 'name', 'is_active',
            'primary', 'primary_bright', 'secondary',
            'background_from', 'background_to',
            'text_color', 'text_muted', 'line_color',
            'logo_url', 'logo_small_url', 'favicon_url',
            'background_video_url', 'background_image_url',
            'button_gradient_from', 'button_gradient_to',
            'button_text_color', 'button_border_color',
            'divider_thickness', 'image_hue_rotate',
            'link_color', 'link_hover_color',
            'heading_font', 'body_font',
            'created_at', 'updated_at',
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
                  'celebration_message', 'reached_at', 'audio_url',
                  'order', 'is_reached', 'created_at']
        read_only_fields = ['id', 'reached_at', 'is_reached', 'created_at']


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
            'between_cards_ms',
            'card_min_hold_ms',
            'card_max_hold_ms',
            'updated_at',
        ]
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

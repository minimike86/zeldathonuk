"""DRF serializers for the API."""
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
            'items',
        ]


class DonationPageSerializer(serializers.ModelSerializer):
    platform_label = serializers.CharField(source='get_platform_display', read_only=True)

    class Meta:
        model = models.DonationPage
        fields = [
            'id',
            'event',
            'platform',
            'platform_label',
            'label',
            'url',
            'external_id',
            'is_primary',
            'order',
        ]


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
            'notes',
            'timer',
            'collected_item_ids',
        ]


class CollectedItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.CollectedItem
        fields = ['id', 'schedule_entry', 'item', 'collected_at']


class DonationSerializer(serializers.ModelSerializer):
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
        ]


class BrbTimerSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.BrbTimer
        fields = ['id', 'target_time', 'message', 'is_active', 'created_at']


class CurrentlyPlayingSerializer(serializers.ModelSerializer):
    schedule_entry_detail = ScheduleEntrySerializer(
        source='schedule_entry', read_only=True
    )

    class Meta:
        model = models.CurrentlyPlaying
        fields = ['schedule_entry', 'schedule_entry_detail', 'updated_at']

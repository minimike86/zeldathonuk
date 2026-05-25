"""DRF serializers for the API."""
from rest_framework import serializers

from . import models


class RunnerSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Runner
        fields = ['id', 'name', 'channel_url', 'is_streamer']


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


class EventSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Event
        fields = ['id', 'name', 'start_time', 'currency_symbol', 'is_active']


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
        queryset=models.Game.objects.all(), source='game', write_only=True
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
    timer = TimerSerializer(read_only=True)
    collected_item_ids = serializers.PrimaryKeyRelatedField(
        many=True, read_only=True, source='collected_items'
    )

    class Meta:
        model = models.ScheduleEntry
        fields = [
            'id',
            'event',
            'game',
            'game_id',
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

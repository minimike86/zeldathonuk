"""Domain models for the ZeldathonUK control panel + OBS browser sources."""
from __future__ import annotations

from django.db import models
from django.utils import timezone


class LayoutType(models.TextChoices):
    WIDESCREEN_16_9 = '16x9', '16:9 widescreen'
    STANDARD_4_3 = '4x3', '4:3 standard'
    THREE_DS = '3ds', 'Nintendo 3DS'
    DS_TOP = 'ds-top', 'Nintendo DS — top screen only'
    DS_BOTH = 'ds-both', 'Nintendo DS — both screens'
    FSA_SPLIT = 'fsa-split', 'Four Swords Adventures — 4-player split'


class Platform(models.TextChoices):
    NES = 'NES', 'NES'
    SNES = 'SNES', 'SNES'
    N64 = 'N64', 'N64'
    GAMECUBE = 'GC', 'GameCube'
    WII = 'Wii', 'Wii'
    WII_U = 'WiiU', 'Wii U'
    SWITCH = 'Switch', 'Switch'
    SWITCH_2 = 'Switch2', 'Switch 2'
    GAMEBOY = 'GB', 'Game Boy'
    GBC = 'GBC', 'Game Boy Color'
    GBA = 'GBA', 'Game Boy Advance'
    DS = 'DS', 'Nintendo DS'
    THREE_DS = '3DS', 'Nintendo 3DS'
    OTHER = 'Other', 'Other'


class Game(models.Model):
    """A Zelda title that can be scheduled. One Game can appear in many events."""

    title = models.CharField(max_length=200, unique=True)
    platform = models.CharField(max_length=20, choices=Platform.choices)
    layout_type = models.CharField(max_length=20, choices=LayoutType.choices)
    default_play_minutes = models.PositiveIntegerField(
        help_text='Estimated time for a rushed main-story run, in minutes.',
    )
    box_art_url = models.URLField(blank=True)
    hltb_id = models.CharField(max_length=32, blank=True)
    igdb_id = models.CharField(
        max_length=32, blank=True,
        help_text='IGDB game id — lets us refresh covers/metadata without re-running the fuzzy name search.',
    )
    twitch_game_id = models.CharField(
        max_length=32, blank=True,
        help_text='Twitch Helix game id — used to PATCH the channel category when this game starts.',
    )
    release_year = models.PositiveSmallIntegerField(null=True, blank=True)

    class Meta:
        ordering = ['title']

    def __str__(self) -> str:
        return self.title


class Runner(models.Model):
    """A person running a game on stream."""

    name = models.CharField(max_length=120, unique=True)
    channel_url = models.URLField(blank=True)
    is_streamer = models.BooleanField(default=False)
    profile_image_url = models.URLField(blank=True)

    class Meta:
        ordering = ['name']

    def __str__(self) -> str:
        return self.name


class Event(models.Model):
    """A single Zeldathon — has a start time and a list of scheduled games."""

    name = models.CharField(max_length=200, unique=True)
    start_time = models.DateTimeField()
    currency_symbol = models.CharField(max_length=4, default='£')
    is_active = models.BooleanField(default=False, help_text='Only one event can be active at a time.')
    logo_url = models.URLField(blank=True, help_text='Square-ish event logo (used in headers, overlays).')
    banner_url = models.URLField(blank=True, help_text='Wide event poster/banner (used on landing, social cards).')

    class Meta:
        ordering = ['-start_time']

    def __str__(self) -> str:
        return self.name


class ScheduleEntry(models.Model):
    """One slot in an event's schedule.

    Most slots are `slot_type='game'` and point at a Game. Non-game slots
    (stream intro/outro, meal break, sleep, custom break) have `game=null`
    and rely on `planned_minutes` and `title` instead.

    `order` drives playback order. `planned_minutes` overrides
    Game.default_play_minutes for game slots and IS the duration for break
    slots. `started_at` / `finished_at` capture the actual run time.
    """

    SLOT_GAME = 'game'
    SLOT_START = 'start'
    SLOT_MEAL = 'meal'
    SLOT_SLEEP = 'sleep'
    SLOT_BREAK = 'break'
    SLOT_END = 'end'
    SLOT_TYPE_CHOICES = [
        (SLOT_GAME, 'Game'),
        (SLOT_START, 'Stream start'),
        (SLOT_MEAL, 'Meal break'),
        (SLOT_SLEEP, 'Sleep break'),
        (SLOT_BREAK, 'Break'),
        (SLOT_END, 'Stream end'),
    ]
    # Default minutes per break type when the user doesn't override.
    BREAK_DEFAULT_MINUTES = {
        SLOT_START: 15,
        SLOT_MEAL: 30,
        SLOT_SLEEP: 480,
        SLOT_BREAK: 15,
        SLOT_END: 15,
    }

    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='schedule')
    slot_type = models.CharField(
        max_length=16, choices=SLOT_TYPE_CHOICES, default=SLOT_GAME
    )
    title = models.CharField(
        max_length=120,
        blank=True,
        help_text='Optional label override (e.g. "Lunch with the chat"). '
                  'Game slots fall back to Game.title when blank.',
    )
    game = models.ForeignKey(
        Game,
        on_delete=models.PROTECT,
        related_name='schedule_entries',
        null=True,
        blank=True,
    )
    parent_entry = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='child_breaks',
        help_text='If set, this slot overlaps the runtime of the parent entry. '
                  'Used to place meal/sleep breaks during a game without '
                  'displacing subsequent entries in the schedule.',
    )
    start_offset_minutes = models.PositiveIntegerField(
        default=0,
        help_text='Only meaningful when parent_entry is set: minutes into the '
                  'parent game when this break begins.',
    )
    runners = models.ManyToManyField(Runner, related_name='schedule_entries', blank=True)
    order = models.PositiveIntegerField()
    planned_minutes = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text='Game slots: overrides Game.default_play_minutes. '
                  'Break slots: the duration of the break.',
    )
    started_at = models.DateTimeField(null=True, blank=True)
    finished_at = models.DateTimeField(null=True, blank=True)
    is_completed = models.BooleanField(default=False)
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ['event', 'order']
        unique_together = [('event', 'order')]
        verbose_name_plural = 'schedule entries'

    def __str__(self) -> str:
        label = self.title or (self.game.title if self.game else self.get_slot_type_display())
        return f'{self.event} #{self.order} — {label}'

    @property
    def effective_minutes(self) -> int:
        if self.planned_minutes:
            return self.planned_minutes
        if self.game:
            return self.game.default_play_minutes
        return self.BREAK_DEFAULT_MINUTES.get(self.slot_type, 15)

    @property
    def display_title(self) -> str:
        if self.title:
            return self.title
        if self.game:
            return self.game.title
        return self.get_slot_type_display()


class TimerRun(models.Model):
    """Tracks elapsed time on a single ScheduleEntry, supporting pause/resume."""

    schedule_entry = models.OneToOneField(
        ScheduleEntry, on_delete=models.CASCADE, related_name='timer'
    )
    started_at = models.DateTimeField(null=True, blank=True)
    paused_at = models.DateTimeField(null=True, blank=True)
    accumulated_seconds = models.PositiveIntegerField(
        default=0, help_text='Total seconds spent running excluding the current segment.'
    )
    ended_at = models.DateTimeField(null=True, blank=True)

    def __str__(self) -> str:
        return f'Timer for {self.schedule_entry}'

    @property
    def is_running(self) -> bool:
        return self.started_at is not None and self.paused_at is None and self.ended_at is None

    @property
    def total_seconds(self) -> int:
        total = self.accumulated_seconds
        if self.is_running and self.started_at:
            total += int((timezone.now() - self.started_at).total_seconds())
        return total


class GameItem(models.Model):
    """A collectible / progress milestone in a specific game (sword, song, heart piece...)."""

    game = models.ForeignKey(Game, on_delete=models.CASCADE, related_name='items')
    name = models.CharField(max_length=120)
    image_url = models.URLField(blank=True)
    category = models.CharField(
        max_length=40,
        blank=True,
        help_text='e.g. "weapon", "song", "heart-piece", "key-item"',
    )
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['game', 'order', 'name']
        unique_together = [('game', 'name')]

    def __str__(self) -> str:
        return f'{self.game.title} — {self.name}'


class CollectedItem(models.Model):
    """Marks a GameItem as collected during a specific ScheduleEntry run."""

    schedule_entry = models.ForeignKey(
        ScheduleEntry, on_delete=models.CASCADE, related_name='collected_items'
    )
    item = models.ForeignKey(GameItem, on_delete=models.CASCADE, related_name='collected_in')
    collected_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ['-collected_at']
        unique_together = [('schedule_entry', 'item')]

    def __str__(self) -> str:
        return f'{self.schedule_entry} → {self.item.name}'


class DonationPlatform(models.TextChoices):
    JUSTGIVING = 'justgiving', 'JustGiving'
    TILTIFY = 'tiltify', 'Tiltify'
    FACEBOOK = 'facebook', 'Facebook'
    TWITCH_CHARITY = 'twitch', 'Twitch Charity'
    PAYPAL = 'paypal', 'PayPal'
    DIRECT = 'direct', 'Direct / cash'
    OTHER = 'other', 'Other'


class DonationPage(models.Model):
    """A hosted fundraising page attached to an Event.

    One Event can list many pages — typically one per platform (a JustGiving
    campaign, a Tiltify campaign, a Twitch Charity link). The control panel
    surfaces these as CTAs and the polling jobs use `external_id` to know
    which campaign to fetch donations from.
    """

    event = models.ForeignKey(
        Event, on_delete=models.CASCADE, related_name='donation_pages'
    )
    platform = models.CharField(max_length=20, choices=DonationPlatform.choices)
    label = models.CharField(
        max_length=120,
        blank=True,
        help_text='Display label (e.g. "JustGiving — main page"). '
                  'Falls back to the platform name when blank.',
    )
    url = models.URLField()
    external_id = models.CharField(
        max_length=200,
        blank=True,
        help_text='Platform campaign/page id used by donation polling.',
    )
    is_primary = models.BooleanField(
        default=False,
        help_text='Promotes this page above others on landing CTAs.',
    )
    order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['event', 'order', 'id']
        indexes = [models.Index(fields=['event'])]

    def __str__(self) -> str:
        return f'{self.event} → {self.label or self.get_platform_display()}'


class Donation(models.Model):
    """A single donation from any platform. Aggregations are computed in views."""

    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='donations')
    platform = models.CharField(max_length=20, choices=DonationPlatform.choices)
    donor_name = models.CharField(max_length=200, blank=True, default='Anonymous')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default='GBP')
    message = models.TextField(blank=True)
    donated_at = models.DateTimeField(default=timezone.now)
    external_id = models.CharField(
        max_length=200,
        blank=True,
        help_text='Platform-side ID — used to dedupe when pulling via API.',
    )
    gift_aid_amount = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True
    )
    image_url = models.URLField(blank=True)

    class Meta:
        ordering = ['-donated_at']
        unique_together = [('platform', 'external_id')]
        indexes = [models.Index(fields=['event', 'platform'])]

    def __str__(self) -> str:
        return f'{self.platform}: {self.donor_name} {self.currency} {self.amount}'


class BrbTimer(models.Model):
    """A "be right back" countdown shown on the BRB overlay.

    Singleton in practice — managed via the control panel as "the current break".
    """

    target_time = models.DateTimeField()
    message = models.CharField(max_length=200, blank=True, default='Back soon!')
    is_active = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self) -> str:
        return f'BRB → {self.target_time} ({"active" if self.is_active else "inactive"})'


class CurrentlyPlaying(models.Model):
    """Singleton pointer to the ScheduleEntry currently being played. The OBS
    browser sources poll this to decide what game to render around."""

    schedule_entry = models.OneToOneField(
        ScheduleEntry,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='currently_playing',
    )
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = 'currently playing'

    def __str__(self) -> str:
        return f'Currently playing: {self.schedule_entry or "(nothing)"}'

    @classmethod
    def get(cls) -> 'CurrentlyPlaying':
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj


class AudioTrack(models.Model):
    """A track for the pre-stream visualiser playlist (OCRemix Zelda music).

    Populate via `python manage.py scrape_ocremix --game-id <id>` or by hand
    via the admin.
    """

    title = models.CharField(max_length=300)
    artist = models.CharField(max_length=200, blank=True)
    game = models.CharField(max_length=200, blank=True)
    source_url = models.URLField(
        max_length=600,
        help_text='Direct MP3 URL on an OCRemix mirror. Served via /api/audio/proxy/ for CORS.',
    )
    ocr_id = models.CharField(max_length=12, blank=True, db_index=True)
    enabled = models.BooleanField(default=True)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order', 'title']

    def __str__(self) -> str:
        return f'{self.title} — {self.artist}' if self.artist else self.title


class NowPlayingAudio(models.Model):
    """Singleton pointer for the /obs/audio-countdown overlay.

    `track` is whatever's currently playing (or null when nothing has loaded yet).
    `is_pinned` distinguishes a user-selected track (clicking ▶ Play in /control)
    from an auto-advance during random rotation. The "Next" button uses this to
    decide between sequential-next-in-list (pinned) and pick-random (random mode).
    """

    track = models.OneToOneField(
        AudioTrack,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='now_playing',
    )
    is_pinned = models.BooleanField(default=False)
    is_paused = models.BooleanField(default=False)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = 'now playing audio'

    def __str__(self) -> str:
        mode = 'pinned' if self.is_pinned else 'random'
        return f'Now playing ({mode}): {self.track or "(none)"}'

    @classmethod
    def get(cls) -> 'NowPlayingAudio':
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj


class TwitchOAuthToken(models.Model):
    """Singleton store for the user OAuth token used by the Helix integration.

    Bootstrapped from settings.TWITCH_ACCESS_TOKEN / TWITCH_REFRESH_TOKEN on first
    use; thereafter the server self-refreshes via the refresh_token grant and the
    DB row is the source of truth (env values are only consulted when the row is
    blank, so a redeploy doesn't clobber freshly-rotated tokens).
    """

    access_token = models.CharField(max_length=200, blank=True)
    refresh_token = models.CharField(max_length=200, blank=True)
    expires_at = models.DateTimeField(
        null=True, blank=True,
        help_text='UTC instant the access_token stops working. Null = unknown (env-seeded).',
    )
    scopes = models.CharField(max_length=400, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Twitch OAuth token'
        verbose_name_plural = 'Twitch OAuth token'

    def save(self, *args, **kwargs):
        self.pk = 1
        super().save(*args, **kwargs)

    def __str__(self) -> str:
        if self.expires_at:
            return f'Twitch token (expires {self.expires_at:%Y-%m-%d %H:%M} UTC)'
        return 'Twitch token (no expiry known)'

    @classmethod
    def get(cls) -> 'TwitchOAuthToken':
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj

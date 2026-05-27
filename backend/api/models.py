"""Domain models for the ZeldathonUK control panel + OBS browser sources."""
from __future__ import annotations

from decimal import Decimal

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
    omnibar_layout = models.JSONField(
        default=dict,
        blank=True,
        help_text='Per-game omnibar layout override. Same shape as '
                  'Event.omnibar_layout. When this game is the active '
                  'playthrough, its lane configs win over the event-level '
                  'layout. Blank dict → fall back to the event layout.',
    )

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
    # CharField (not URLField) on every operator-set media URL so the
    # /control/events form accepts site-relative paths
    # (/assets/img/foo.svg) alongside absolute URLs. URLField's
    # validator rejects anything without an http(s):// scheme.
    logo_url = models.CharField(
        max_length=500,
        blank=True,
        help_text='Square-ish event logo (used in headers, overlays). '
                  'Absolute URL or site-relative path.',
    )
    banner_url = models.CharField(
        max_length=500,
        blank=True,
        help_text='Wide event poster/banner (used on landing, social cards). '
                  'Absolute URL or site-relative path.',
    )
    gameblast_logo_url = models.CharField(
        max_length=500,
        blank=True,
        help_text="SpecialEffect's current GameBlast campaign logo (e.g. GB22, "
                  'GB23…). Surfaced in the OBS omnibar and ad-panel carousel. '
                  'Refresh this each year when the campaign rebrands. '
                  'Absolute URL or site-relative path.',
    )
    omnibar_layout = models.JSONField(
        default=dict,
        blank=True,
        help_text='Per-event omnibar lane composition. Shape: '
                  '{ "lanes": [{ "id": "top", "mode": "rotating|pinned", '
                  '"intervalMs": 12000, "panels": ["current-game", ...] }] }. '
                  'Empty dict falls back to the default layout in '
                  'frontend/src/routes/obs/omnibar/hooks/useLayoutConfig.ts.',
    )

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
    was_skipped = models.BooleanField(
        default=False,
        help_text='Operator marked the entry as abandoned without completing. '
                  'Distinct from is_completed — both are terminal states but '
                  'the omnibar treats them differently (skipped: muted, '
                  'completed: celebration).',
    )
    current_objective = models.CharField(
        max_length=240,
        blank=True,
        help_text='Operator-set free text describing what the runner is trying '
                  'to do RIGHT NOW (e.g. "Find the Master Sword", "Beat '
                  'Ganondorf, second phase"). Surfaced in the omnibar '
                  'ObjectivePanel when set; hidden when blank.',
    )
    SETPIECE_IMMINENT = 'imminent'
    SETPIECE_ACTIVE = 'active'
    SETPIECE_STAGE_CHOICES = [
        ('', 'Inactive'),
        (SETPIECE_IMMINENT, 'Imminent — build-up'),
        (SETPIECE_ACTIVE, 'Active — in progress'),
    ]
    setpiece_kind = models.CharField(
        max_length=32,
        blank=True,
        help_text='Open string for the type of set-piece in progress: "boss", '
                  '"shrine", "dungeon", "cutscene", anything the operator '
                  'declares. Blank = no set-piece active.',
    )
    setpiece_name = models.CharField(
        max_length=120,
        blank=True,
        help_text='Display name for the set-piece (e.g. "Ganondorf"). '
                  'Surfaced by the omnibar SetpiecePanel.',
    )
    setpiece_stage = models.CharField(
        max_length=16,
        blank=True,
        default='',
        choices=SETPIECE_STAGE_CHOICES,
        help_text='Operator-controlled lifecycle of the current set-piece. '
                  'Blank = none. Defeated is signalled via a PlaythroughEvent '
                  '(boss-defeated etc.) which clears these fields too.',
    )
    setpiece_started_at = models.DateTimeField(null=True, blank=True)
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
    image_url = models.CharField(
        max_length=500,
        blank=True,
        help_text='Absolute URL or site-relative path (e.g. /assets/img/game-items/oot/Master.png).',
    )
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


class DonationPlatformProfile(models.Model):
    """Singleton settings for a donation platform.

    The catalogue of platforms is closed (DonationPlatform.choices) and the
    fees/Gift Aid links + boilerplate fee warning are the same for every
    `DonationPage` of a given platform — so they live here, not on each page.
    DonationPage references the platform by its string key and the serializer
    denormalises these fields onto each page when serving the API.
    """

    platform = models.CharField(
        max_length=20,
        choices=DonationPlatform.choices,
        unique=True,
        primary_key=True,
    )
    display_label = models.CharField(
        max_length=120,
        blank=True,
        help_text='Optional override for the platform display name shown in '
                  'the donation picker. Falls back to the choice label.',
    )
    fees_url = models.URLField(
        blank=True,
        help_text='Link to the platform\'s fundraising-fee page.',
    )
    gift_aid_url = models.URLField(
        blank=True,
        help_text='Link to the platform\'s Gift Aid documentation.',
    )
    fee_warning = models.TextField(
        blank=True,
        help_text='Inline warning banner shown on the picker row when set.',
    )
    minimum_donation_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal('1.00'),
        help_text='Smallest donation the platform accepts. Shown in the '
                  'picker so donors know the floor before they click through.',
    )

    class Meta:
        ordering = ['platform']

    def __str__(self) -> str:
        return self.display_label or self.get_platform_display()


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

    def save(self, *args, **kwargs):
        # Only one DonationPage per event should be primary at a time. When
        # this row is being saved as primary, demote any other primary rows
        # for the same event in the same transaction.
        super().save(*args, **kwargs)
        if self.is_primary:
            DonationPage.objects.filter(
                event_id=self.event_id, is_primary=True,
            ).exclude(pk=self.pk).update(is_primary=False)


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
    is_muted = models.BooleanField(
        default=False,
        help_text='When true the /obs/tts and /obs/omnibar live-donation '
                  'overlays skip this donation entirely (no card, no '
                  'speech). Lets the operator suppress profanity or '
                  'already-announced repeats. Donation still counts '
                  'toward totals — only the announcement is muted.',
    )

    class Meta:
        ordering = ['-donated_at']
        unique_together = [('platform', 'external_id')]
        indexes = [models.Index(fields=['event', 'platform'])]

    def __str__(self) -> str:
        return f'{self.platform}: {self.donor_name} {self.currency} {self.amount}'


class TtsNowReading(models.Model):
    """Singleton mirror of what /obs/tts is currently announcing.

    The TTS overlay POSTs `{donation_id}` when an utterance starts and
    POSTs `{donation_id: null}` when it ends (or is cancelled).
    /control/donations polls this so the operator can see which row
    is being read in real time — useful for deciding whether to mute.
    Singleton (pk=1) because only one card is on screen at a time.
    """

    donation = models.ForeignKey(
        Donation,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='+',
        help_text='Donation currently being narrated, or NULL when the '
                  'TTS overlay is idle.',
    )
    started_at = models.DateTimeField(
        default=timezone.now,
        help_text='When the current utterance started. Updated on every '
                  'transition so a stale row (e.g. a crashed overlay) can '
                  'be detected by comparing against wall-clock.',
    )

    class Meta:
        verbose_name_plural = 'tts now reading'

    def __str__(self) -> str:
        return f'TTS reading: {self.donation or "(idle)"} since {self.started_at:%H:%M:%S}'

    def save(self, *args, **kwargs):
        self.pk = 1
        super().save(*args, **kwargs)

    @classmethod
    def get(cls) -> 'TtsNowReading':
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj


class TtsReplay(models.Model):
    """Singleton signal that the /obs/tts overlay should re-announce a
    donation, even if it's already been spoken.

    The TTS overlay polls this row; when ``requested_at`` advances past
    the value it last saw, the referenced donation is enqueued
    regardless of the per-browser seen-id guard. Singleton (pk=1) so
    a fresh POST always overwrites the prior request — there's only
    ever one "play this next" slot, and the operator can't accidentally
    queue ten of the same thing by spamming the button.
    """

    donation = models.ForeignKey(
        Donation,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='+',
        help_text='The donation to re-announce. Cleared (without dropping '
                  'the singleton row) when the donation is deleted.',
    )
    requested_at = models.DateTimeField(
        default=timezone.now,
        help_text='Bumped on every replay request. The /obs/tts page uses '
                  'this as a high-water mark — when it moves forward, '
                  'enqueue the linked donation.',
    )

    class Meta:
        verbose_name_plural = 'tts replays'

    def __str__(self) -> str:
        return f'TTS replay: {self.donation or "(cleared)"} @ {self.requested_at:%H:%M:%S}'

    def save(self, *args, **kwargs):
        self.pk = 1
        super().save(*args, **kwargs)

    @classmethod
    def get(cls) -> 'TtsReplay':
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj


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


class ThemeSettings(models.Model):
    """A row in the theme library.

    The frontend's <ThemeProvider> reads the active row via /api/theme/ and
    writes each field onto :root as a CSS custom property so theme-aware
    styles can reference --theme-primary etc. instead of hard-coding the
    bloodmoon palette. /control/theme manages the library — only one row
    can be `is_active` at a time, mirroring the Event activation pattern.
    """

    name = models.CharField(
        max_length=80, default='Bloodmoon',
        help_text='Label shown in the control panel — purely cosmetic.',
    )
    is_active = models.BooleanField(
        default=False,
        help_text='Only one theme can be active at a time. The active row is '
                  'what /api/theme/ returns to the frontend.',
    )
    created_at = models.DateTimeField(auto_now_add=True, null=True)

    # ── Palette ──────────────────────────────────────────────────────────
    primary = models.CharField(
        max_length=20, default='#e71347',
        help_text='Main brand accent (--theme-primary).',
    )
    primary_bright = models.CharField(
        max_length=20, default='#da4471',
        help_text='Bright variant for hover/glow (--theme-primary-bright).',
    )
    secondary = models.CharField(
        max_length=20, default='#731c37',
        help_text='Secondary / darker brand colour (--theme-secondary).',
    )
    background_from = models.CharField(
        max_length=20, default='#4c1324',
        help_text='Top stop of the page background gradient (--theme-bg-from).',
    )
    background_to = models.CharField(
        max_length=20, default='#1a0a10',
        help_text='Bottom stop of the page background gradient (--theme-bg-to).',
    )
    text_color = models.CharField(
        max_length=20, default='#ffffff',
        help_text='Default text colour (--theme-text).',
    )
    text_muted = models.CharField(
        max_length=40, default='rgba(255, 255, 255, 0.6)',
        help_text='Muted/subdued text colour (--theme-text-muted).',
    )
    line_color = models.CharField(
        max_length=40, default='rgba(185, 39, 83, 0.5)',
        help_text='Borders / dividers / lines (--theme-line).',
    )

    # ── Branding ─────────────────────────────────────────────────────────
    # All five media fields are CharField (not URLField) so they accept
    # site-relative paths like "/assets/img/Zeldathon-2026-White.svg"
    # alongside absolute "https://…" URLs. URLField's validator demands
    # a scheme and rejects relative paths, which broke the theme form
    # whenever an operator pasted a path from /public/assets.
    logo_url = models.CharField(
        max_length=500,
        blank=True,
        help_text='Hero / navbar wordmark. Falls back to bundled SVG when blank. '
                  'Absolute URL or site-relative path (e.g. /assets/img/foo.svg).',
    )
    logo_small_url = models.CharField(
        max_length=500,
        blank=True,
        help_text='Compact mark used in tight spaces (omnibar pill). '
                  'Absolute URL or site-relative path.',
    )
    favicon_url = models.CharField(
        max_length=500,
        blank=True,
        help_text='Browser tab icon. Blank = use the default favicon. '
                  'Absolute URL or site-relative path.',
    )

    # ── Background media ────────────────────────────────────────────────
    background_video_url = models.CharField(
        max_length=500,
        blank=True,
        help_text='Optional looping background video for the page shell. '
                  'When blank the gradient alone is shown. Absolute URL or '
                  'site-relative path.',
    )
    background_image_url = models.CharField(
        max_length=500,
        blank=True,
        help_text='Optional static background image used when no video is set. '
                  'Absolute URL or site-relative path.',
    )

    # ── Buttons + lines ─────────────────────────────────────────────────
    button_gradient_from = models.CharField(
        max_length=20, default='#4c1324',
        help_text='First stop of the primary button gradient.',
    )
    button_gradient_to = models.CharField(
        max_length=20, default='#b92753',
        help_text='Last stop of the primary button gradient.',
    )
    button_text_color = models.CharField(
        max_length=20, default='#ffffff',
        help_text='Button label colour.',
    )
    button_border_color = models.CharField(
        max_length=40, default='rgba(255, 255, 255, 0.4)',
        help_text='Default border colour around buttons.',
    )
    divider_thickness = models.PositiveSmallIntegerField(
        default=2,
        help_text='Decorative divider/line thickness in pixels.',
    )
    image_hue_rotate = models.IntegerField(
        default=-50,
        help_text='Degrees to rotate hue of decorative images (carousel '
                  'photos, etc.) so they tint to the theme. e.g. -50 = '
                  'bloodmoon red, +180 = teal/blue, 0 = sepia neutral.',
    )
    link_color = models.CharField(
        max_length=40, default='#ffc2e0',
        help_text='Inline anchor colour (--theme-link).',
    )
    link_hover_color = models.CharField(
        max_length=40, default='#ffffff',
        help_text='Inline anchor hover colour (--theme-link-hover).',
    )

    # ── Fonts (optional overrides) ──────────────────────────────────────
    heading_font = models.CharField(
        max_length=80, default="'Bungee', sans-serif",
        help_text='Heading font-family stack (--theme-font-heading).',
    )
    body_font = models.CharField(
        max_length=80, default="'Open Sans', sans-serif",
        help_text='Body font-family stack (--theme-font-body).',
    )

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Theme'
        verbose_name_plural = 'Themes'
        ordering = ['-is_active', 'name']

    def save(self, *args, **kwargs):
        # Mirror Event.activate: when this row becomes active, demote every
        # other row in the same transaction so only one is active at a time.
        super().save(*args, **kwargs)
        if self.is_active:
            ThemeSettings.objects.filter(is_active=True).exclude(pk=self.pk).update(
                is_active=False,
            )

    def __str__(self) -> str:
        return self.name or 'Theme'

    @classmethod
    def get_active(cls) -> 'ThemeSettings':
        """Return the currently-active theme — or create a default Bloodmoon
        row if none exists. Used by the /api/theme/ endpoint."""
        active = cls.objects.filter(is_active=True).first()
        if active:
            return active
        # Bootstrap path — first time the endpoint is hit.
        return cls.objects.create(name='Bloodmoon', is_active=True)


# ── Omnibar v2 ─────────────────────────────────────────────────────────────
#
# Three generic kind+payload tables back the new omnibar's three streams:
#
#   PlaythroughEvent — operator/system signals attached to one playthrough
#                      (boss-defeated, item-collected, player-death, …).
#                      The omnibar polls for events since its last tick and
#                      routes each to a registered handler by `kind`.
#
#   OmnibarOverride  — operator-triggered urgent/spotlight content. Pushes
#                      the omnibar into urgent mode for the duration of
#                      starts_at..expires_at. Priority breaks ties when
#                      multiple are active simultaneously.
#
#   ExternalEvent    — inbound webhook payloads from Twitch/Discord/etc.
#                      `source` identifies the origin, `kind` the event
#                      type within that source. Same routing pattern as
#                      PlaythroughEvent.
#
# Two typed-shape models cover the most-used broadcast features:
#
#   Incentive  — donation target with progress + reached flag.
#   Milestone  — fixed donation threshold with optional fanfare audio.
#
# Adding a new event kind, override kind, or external source is a row
# insert with a new `kind` string — no migration needed. The frontend
# registers a handler for the new kind and shows it. Unknown kinds fall
# through to a generic toast handler so unrecognised payloads don't break
# the bar.


class PlaythroughEvent(models.Model):
    """Discrete operator/system signal attached to a single playthrough.

    Events are append-only and read by the omnibar via polling
    ``/api/playthrough/{entry_id}/events/?since={iso}``. They drive
    transient animations (flashes, fanfares) without changing the
    parent ScheduleEntry's state — that's what TimerRun + is_completed
    are for.
    """

    schedule_entry = models.ForeignKey(
        ScheduleEntry,
        on_delete=models.CASCADE,
        related_name='events',
    )
    kind = models.CharField(
        max_length=64,
        db_index=True,
        help_text='Open string. Conventional values: boss-defeated, '
                  'shrine-cleared, item-collected, player-death, '
                  'segment-complete, runner-swap. New kinds can be '
                  'introduced by inserting a row — the frontend will '
                  'fall through to a generic handler until a specific '
                  'one is registered.',
    )
    payload = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    expires_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text='When non-null, the omnibar will not replay this event '
                  'after this timestamp. Used to bound the replay window '
                  'so a freshly-mounted browser source doesn\'t fire ten '
                  'minutes of stale animations.',
    )

    class Meta:
        ordering = ['-created_at']
        indexes = [models.Index(fields=['schedule_entry', '-created_at'])]

    def __str__(self) -> str:
        return f'{self.kind} @ {self.schedule_entry_id}'


class OmnibarOverride(models.Model):
    """Operator-triggered spotlight that preempts the normal rotation.

    Active overrides drive the OmnibarFSM into ``urgent`` mode and dim
    the regular lanes. ``priority`` breaks ties when multiple overlap;
    higher priority wins. ``is_active`` is a soft delete — operators
    can deactivate without losing the audit trail.
    """

    kind = models.CharField(
        max_length=64,
        db_index=True,
        help_text='Open string. Conventional values: urgent, '
                  'announcement, sponsor-shout, raid-alert, raffle.',
    )
    payload = models.JSONField(default=dict, blank=True)
    target_lane = models.CharField(
        max_length=8,
        choices=[
            ('top', 'Top lane'),
            ('bottom', 'Bottom lane'),
            ('both', 'Both lanes'),
        ],
        default='bottom',
        help_text='Which omnibar lane takes the override banner. Top is '
                  'the status zone (current game / playtime); bottom is '
                  'the rotating ticker zone. Both mirrors the banner '
                  'across both lanes for a full-bar takeover.',
    )
    starts_at = models.DateTimeField(default=timezone.now)
    expires_at = models.DateTimeField()
    priority = models.SmallIntegerField(
        default=0,
        help_text='Higher wins when multiple overrides overlap.',
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    LANE_TOP = 'top'
    LANE_BOTTOM = 'bottom'
    LANE_BOTH = 'both'

    class Meta:
        ordering = ['-priority', '-starts_at']
        indexes = [models.Index(fields=['is_active', 'expires_at'])]

    def __str__(self) -> str:
        return f'{self.kind} ({self.starts_at:%H:%M}–{self.expires_at:%H:%M})'

    @property
    def is_live(self) -> bool:
        now = timezone.now()
        return self.is_active and self.starts_at <= now <= self.expires_at


class ExternalEvent(models.Model):
    """Inbound from Twitch / Discord / etc. webhooks.

    One table per upstream source would mean a migration per integration;
    instead we keep them all here with ``source`` discriminating. ``kind``
    is the event type within the source (e.g. source='twitch',
    kind='channel.subscribe'). ``consumed_at`` lets the omnibar pull
    only-not-yet-shown rows on each poll.
    """

    SOURCE_TWITCH = 'twitch'
    SOURCE_DISCORD = 'discord'
    SOURCE_WEBHOOK = 'webhook'

    source = models.CharField(max_length=32, db_index=True)
    kind = models.CharField(max_length=64, db_index=True)
    payload = models.JSONField(default=dict)
    occurred_at = models.DateTimeField(db_index=True)
    consumed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-occurred_at']
        indexes = [models.Index(fields=['source', 'kind', '-occurred_at'])]

    def __str__(self) -> str:
        return f'{self.source}/{self.kind} @ {self.occurred_at:%H:%M:%S}'


class Incentive(models.Model):
    """Donation target — viewers donate toward a goal, omnibar shows progress.

    ``current_amount`` is bumped by ``contribute`` action on the viewset
    (or manually via admin). When ``current_amount >= goal_amount`` for
    the first time, ``reached_at`` is set and the omnibar fires an
    ``incentive-unlocked`` event so the corresponding fanfare runs.

    Optionally bound to a ScheduleEntry — incentives tied to a specific
    game (e.g. "buy the runner a coffee during BOTW") only surface
    while that entry is the active playthrough. Null = event-wide.
    """

    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='incentives')
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    image_url = models.CharField(
        max_length=500,
        blank=True,
        help_text='Reward / incentive artwork. Absolute URL or '
                  'site-relative path (e.g. /assets/img/foo.svg).',
    )
    goal_amount = models.DecimalField(max_digits=10, decimal_places=2)
    current_amount = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0'))
    is_active = models.BooleanField(default=True)
    reached_at = models.DateTimeField(null=True, blank=True)
    schedule_entry = models.ForeignKey(
        ScheduleEntry,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='incentives',
        help_text='When set, this incentive is only shown while this '
                  'schedule entry is the active playthrough.',
    )
    order = models.PositiveIntegerField(default=0)
    payload = models.JSONField(
        default=dict,
        blank=True,
        help_text='Reserved for future extensions (bid-war options, '
                  'tiered rewards). Frontend reads kind-specific keys '
                  'where defined.',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['order', 'created_at']

    def __str__(self) -> str:
        return f'{self.name} ({self.current_amount}/{self.goal_amount})'

    @property
    def progress_pct(self) -> float:
        if self.goal_amount <= 0:
            return 0.0
        return min(100.0, float(self.current_amount / self.goal_amount * 100))

    @property
    def is_reached(self) -> bool:
        return self.reached_at is not None


class Milestone(models.Model):
    """Fixed donation threshold (£5k, £10k, …) celebrated when crossed.

    Independent of Incentive — milestones track the cumulative event
    total, not a goal the audience opts into. The omnibar polls
    milestones + totals together and fires ``milestone-reached`` when
    a threshold is crossed for the first time.
    """

    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='milestones')
    name = models.CharField(max_length=120)
    threshold_amount = models.DecimalField(max_digits=10, decimal_places=2)
    celebration_message = models.TextField(
        blank=True,
        help_text='Surfaced on the omnibar when the milestone is hit. '
                  'Markdown not supported — plain text only.',
    )
    reached_at = models.DateTimeField(null=True, blank=True)
    audio_url = models.CharField(
        max_length=500,
        blank=True,
        help_text='Optional fanfare audio. The OBS browser source plays '
                  'this once when the milestone is crossed. Absolute URL '
                  'or site-relative path.',
    )
    order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['threshold_amount']

    def __str__(self) -> str:
        return f'{self.name} (£{self.threshold_amount})'

    @property
    def is_reached(self) -> bool:
        return self.reached_at is not None


class ChestAnnouncerSettings(models.Model):
    """Singleton settings row for the /obs/chest-announcer overlay.

    Configures runtime behaviour (currently just whether the overlay
    plays its own fanfare on each card reveal) without requiring the
    streamer to manage URL query strings. The frontend polls
    /api/chest-announcer/settings/ and re-reads any time the operator
    flips the toggle at /control/chest-announcer.

    Pinned to pk=1 — same singleton pattern as TwitchOAuthToken.
    """

    audio_enabled = models.BooleanField(
        default=False,
        help_text=(
            'When true, the chest announcer plays a short procedural '
            'fanfare on each donation card reveal. Default false '
            'because the omnibar already announces donations via TTS '
            '— leave off when both overlays are in the scene to avoid '
            'overlapping audio.'
        ),
    )
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Chest announcer settings'
        verbose_name_plural = 'Chest announcer settings'

    def __str__(self) -> str:
        return 'Chest announcer settings'

    @classmethod
    def get(cls) -> 'ChestAnnouncerSettings':
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj

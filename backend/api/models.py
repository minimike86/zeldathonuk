"""Domain models for the ZeldathonUK control panel + OBS browser sources."""
from __future__ import annotations

from decimal import Decimal

from django.core.validators import MaxValueValidator, MinValueValidator
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
    asset_slug = models.SlugField(
        max_length=40,
        blank=True,
        help_text="Short asset-folder key under "
                  "/assets/img/game-franchise/legend-of-zelda/<slug>/ (e.g. 'lttp'). "
                  "Used to resolve the per-game item sprite folder.",
    )
    omnibar_layout = models.JSONField(
        default=dict,
        blank=True,
        help_text='Per-game omnibar layout override. Same shape as '
                  'Event.omnibar_layout. When this game is the active '
                  'playthrough, its lane configs win over the event-level '
                  'layout. Blank dict → fall back to the event layout.',
    )
    item_group_order = models.JSONField(
        default=list,
        blank=True,
        help_text='Ordered list of item GROUP labels (the section headers on '
                  '/control/items). Drives section order on the control grid and '
                  'the /obs items overlay. Labels not present fall back to '
                  'first-appearance order after the listed ones.',
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
    # Twitch channels for this event live in the related EventTwitchChannel
    # model (each drives live status; some are charity sources). The primary
    # channel's login is exposed as `primary_twitch_channel` on the serializer
    # for single-channel consumers.
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
    update_twitch_category = models.BooleanField(
        default=False,
        help_text='On a game/run change, set the primary channel\'s Twitch '
                  'category to the new game (uses Game.twitch_game_id). Needs '
                  'the primary connection to have channel:manage:broadcast.',
    )
    twitch_title_template = models.CharField(
        max_length=200, blank=True,
        help_text='Optional: also set the stream title on game change. '
                  'Supports {game} and {event}. Blank → leave the title alone.',
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
    omnibar_transitions = models.JSONField(
        default=dict,
        blank=True,
        help_text='Per-panel omnibar transition config — enter direction, '
                  'exit direction, durations, delay-before-enter. Shape: '
                  '{ "default": { "enter": "left", "exit": "left", '
                  '"enterMs": 520, "exitMs": 480, "delayMs": 0 }, '
                  '"panels": { "<panel-id>": { ...overrides } } }. '
                  'Empty dict falls back to the defaults in '
                  'frontend/src/routes/obs/omnibar/hooks/useTransitionsConfig.ts.',
    )
    # M2M to Charity via the EventCharity through-table (defined
    # further down). The through-table carries the per-event metadata
    # (is_primary, order). Use `event.event_charities.all()` when you
    # need the ordering / primary flag; this field is just the bare
    # relationship for the M2M conveniences (`event.charities.all()`).
    charities = models.ManyToManyField(
        'Charity',
        through='EventCharity',
        related_name='events',
        blank=True,
        help_text='Charities benefitting from this event. Use the '
                  'EventCharity rows directly to set is_primary / order.',
    )

    class Meta:
        ordering = ['-start_time']

    def __str__(self) -> str:
        return self.name

    @property
    def currency_code(self) -> str:
        """ISO 4217 code for this event's currency, mapped from the display
        symbol. Used to denominate Twitch Charity donations, since Twitch's
        Helix charity API reports the wrong currency (always 'USD')."""
        return {
            '£': 'GBP', '$': 'USD', '€': 'EUR', '¥': 'JPY',
        }.get((self.currency_symbol or '£').strip(), 'GBP')


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
    SLOT_OTHER = 'other'
    SLOT_TYPE_CHOICES = [
        (SLOT_GAME, 'Game'),
        (SLOT_START, 'Stream start'),
        (SLOT_MEAL, 'Meal break'),
        (SLOT_SLEEP, 'Sleep break'),
        (SLOT_BREAK, 'Break'),
        (SLOT_END, 'Stream end'),
        (SLOT_OTHER, 'Other'),
    ]
    # Default minutes per break type when the user doesn't override.
    BREAK_DEFAULT_MINUTES = {
        SLOT_START: 15,
        SLOT_MEAL: 30,
        SLOT_SLEEP: 480,
        SLOT_BREAK: 15,
        SLOT_END: 15,
        SLOT_OTHER: 0,
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
    death_count = models.PositiveIntegerField(
        default=0,
        help_text='Player deaths during this game, bumped from the Stream Deck '
                  'via the timer-hotkey death-inc/death-dec actions. The omnibar '
                  'death-count panel shows this per-game and sums it across the '
                  "event's entries for a running total.",
    )
    # Setpieces (boss / dungeon / shrine build-up tags) live in their own
    # `Setpiece` model now — many can be live at once (see related_name
    # 'setpieces'). They are driven automatically off objective completion
    # plus bespoke operator entries.
    notes = models.TextField(blank=True)
    timer_segment_ids = models.JSONField(
        default=list,
        blank=True,
        help_text="Ordered GameObjective ids forming this run's LiveSplit "
                  'route (the timer splits). Empty = fall back to all of the '
                  "game's objectives in their library order.",
    )

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
    accumulated_ms = models.PositiveBigIntegerField(
        default=0,
        help_text='Total MILLISECONDS spent running excluding the current '
                  'segment. Source of truth for the centisecond display; '
                  'accumulated_seconds is kept in sync (= accumulated_ms // 1000) '
                  'for the omnibar, which only needs whole seconds.',
    )
    ended_at = models.DateTimeField(null=True, blank=True)

    def __str__(self) -> str:
        return f'Timer for {self.schedule_entry}'

    @property
    def is_running(self) -> bool:
        # A live segment is ticking. `pause_timer` banks the segment and clears
        # `started_at`, so a paused run is NOT running.
        return self.started_at is not None and self.ended_at is None

    @property
    def is_paused(self) -> bool:
        # Started at least once and paused (segment banked, clock held), not
        # yet finished. Distinct from idle (never started) and ended.
        return (
            self.paused_at is not None
            and self.started_at is None
            and self.ended_at is None
        )

    @property
    def total_ms(self) -> int:
        total = self.accumulated_ms
        if self.is_running and self.started_at:
            total += int((timezone.now() - self.started_at).total_seconds() * 1000)
        return total

    @property
    def total_seconds(self) -> int:
        # Derived from total_ms so the whole-second value the omnibar reads
        # stays consistent with the centisecond display.
        return self.total_ms // 1000


class ItemLinkKind(models.TextChoices):
    UPGRADE = 'upgrade', 'Upgrade chain'   # ordered: Master Sword → Lv2 → Lv3
    TRADE = 'trade', 'Trade sequence'      # ordered: you swap one item for the next
    SET = 'set', 'Related set'             # unordered family, e.g. the masks


class GameItemSet(models.Model):
    """A named family/cluster of items within a game (e.g. "Medallions",
    "Magic Items", "Masks"). Items belong to zero or more sets via the
    GameItem.sets M2M, so e.g. the LttP medallions can sit in both the
    "Medallions" and "Magic Items" sets. The control grid renders one cluster
    per set; `kind` controls whether members sequence (upgrade/trade) or form
    an unordered related set."""

    game = models.ForeignKey(Game, on_delete=models.CASCADE, related_name='item_sets')
    name = models.CharField(max_length=60)
    kind = models.CharField(
        max_length=10,
        default=ItemLinkKind.SET,
        choices=ItemLinkKind.choices,
        help_text='How members relate: an ordered upgrade chain, an ordered '
                  'trade sequence, or an unordered related set.',
    )
    order = models.PositiveIntegerField(default=0)
    show_in_overlay = models.BooleanField(
        default=True,
        help_text='When false, this set (and items whose only sets are hidden) '
                  'is omitted from the /obs/full items element — e.g. bottle '
                  'contents that the broadcast doesn\'t need to surface.',
    )

    class Meta:
        ordering = ['game', 'order', 'name']
        unique_together = [('game', 'name')]

    def __str__(self) -> str:
        return f'{self.game.title} — {self.name}'


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
    group = models.CharField(
        max_length=60,
        blank=True,
        help_text='Optional section label used to cluster items on the control '
                  'grid (e.g. "Equipment", "Dungeon Items", "Songs"). Imported '
                  'from the wiki gallery caption; falls back to category when blank.',
    )
    sets = models.ManyToManyField(
        GameItemSet,
        related_name='items',
        blank=True,
        help_text='Families this item belongs to (e.g. a medallion is in both '
                  '"Medallions" and "Magic Items"). Rendered as a cluster per set.',
    )
    countable = models.BooleanField(
        default=False,
        help_text='If set, this item is tracked as a tally that can go up/down '
                  '(e.g. Small Key, Map, Compass collected once per dungeon) '
                  'instead of a single collected/not-collected toggle.',
    )
    unlocks_with = models.ManyToManyField(
        'self',
        blank=True,
        symmetrical=True,
        help_text='Items collected at the same time as this one (e.g. Bow + '
                  'Quiver). Collecting or clearing any member cascades to the '
                  'rest of the connected group.',
    )
    starts_collected = models.BooleanField(
        default=False,
        help_text='Player begins the game already holding this item. Applied by '
                  'the "Reset to start" action on /control/items.',
    )
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['game', 'order', 'name']
        # Name need only be unique within a (game, group). Dungeon staples
        # (Map, Compass, Big Key, Small Key) repeat across dungeons, separated
        # by the group (e.g. "Eastern Palace" vs "Desert Palace").
        unique_together = [('game', 'name', 'group')]

    def __str__(self) -> str:
        return f'{self.game.title} — {self.name}'


class CollectedItem(models.Model):
    """Marks a GameItem as collected during a specific ScheduleEntry run."""

    schedule_entry = models.ForeignKey(
        ScheduleEntry, on_delete=models.CASCADE, related_name='collected_items'
    )
    item = models.ForeignKey(GameItem, on_delete=models.CASCADE, related_name='collected_in')
    collected_at = models.DateTimeField(default=timezone.now)
    quantity = models.PositiveIntegerField(
        default=1,
        help_text='How many collected. Always 1 for normal toggle items; '
                  'for countable items (keys, maps...) this is the tally. '
                  'A row is deleted when the tally drops to 0.',
    )

    class Meta:
        ordering = ['-collected_at']
        unique_together = [('schedule_entry', 'item')]

    def __str__(self) -> str:
        return f'{self.schedule_entry} → {self.item.name}'


class GameObjective(models.Model):
    """A run objective in a specific game (e.g. "Collect all heart pieces",
    "Beat the game"). Per-game library curated by operators; marked
    obtained / skipped per ScheduleEntry via ScheduleEntryObjective.

    Distinct from GameItem/CollectedItem (collectibles) — objectives are
    goal-oriented, surface in their own omnibar checklist, and fire a pickup
    celebration when obtained."""

    game = models.ForeignKey(Game, on_delete=models.CASCADE, related_name='objectives')
    name = models.CharField(max_length=160)
    image_url = models.CharField(
        max_length=500,
        blank=True,
        help_text='Absolute URL or site-relative path to an objective sprite '
                  '(e.g. /assets/img/game-franchise/legend-of-zelda/oot/items/Triforce.png).',
    )
    category = models.CharField(
        max_length=40,
        blank=True,
        help_text='e.g. "story", "side-quest", "100%", "boss".',
    )
    group = models.CharField(
        max_length=60,
        blank=True,
        help_text='Optional run-section label used to cluster objectives in the '
                  'library editor and the timer splits (e.g. "Prologue", "The '
                  'Dark World", "Endgame"). Falls back to category when blank.',
    )
    linked_item = models.ForeignKey(
        GameItem,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='linked_objectives',
        help_text='For "item get" objectives: the GameItem whose collection '
                  'completes this objective. Collecting the item marks the '
                  'objective obtained for the run, and marking the objective '
                  'obtained collects the item (kept in lockstep per run).',
    )
    LINK_MODE_SINGLE = 'single'
    LINK_MODE_TALLY = 'tally'
    LINK_MODE_CHOICES = [
        (LINK_MODE_SINGLE, 'Single (one per dungeon)'),
        (LINK_MODE_TALLY, 'Tally (count per dungeon, e.g. small keys)'),
    ]
    link_mode = models.CharField(
        max_length=8,
        default=LINK_MODE_SINGLE,
        choices=LINK_MODE_CHOICES,
        help_text='How a linked dungeon item resolves when collected while a '
                  'dungeon setpiece is active: "single" = obtained once; '
                  '"tally" = a per-dungeon count (e.g. small keys). Only '
                  'meaningful for items linked by more than one objective.',
    )
    order = models.PositiveIntegerField(default=0)

    # ── Setpiece automation ───────────────────────────────────────────────
    # These let an objective drive an omnibar Setpiece as the run progresses
    # (timer splits mark objectives obtained → setpieces advance). See
    # views.recompute_setpieces. `category`/`group` above stay purely for the
    # checklist display; setpiece automation is opt-in via these fields.
    SETPIECE_ROLE_NONE = ''
    SETPIECE_ROLE_DUNGEON_ENTER = 'dungeon-enter'
    SETPIECE_ROLE_BOSS_ENTER = 'boss-enter'
    SETPIECE_ROLE_BOSS_DEFEAT = 'boss-defeat'
    SETPIECE_ROLE_CHOICES = [
        (SETPIECE_ROLE_NONE, '— none —'),
        (SETPIECE_ROLE_DUNGEON_ENTER, 'Enter dungeon (→ dungeon active)'),
        (SETPIECE_ROLE_BOSS_ENTER, 'Enter boss arena (→ boss active, no alert)'),
        (SETPIECE_ROLE_BOSS_DEFEAT, 'Defeat boss (→ clears boss, fires alert)'),
    ]
    setpiece_role = models.CharField(
        max_length=40,
        blank=True,
        choices=SETPIECE_ROLE_CHOICES,
        help_text='Role this objective plays in setpiece automation. '
                  '"Enter dungeon"/"Enter boss arena" flip the named setpiece to '
                  'active when obtained; the objective BEFORE one of these flips '
                  'it to imminent. "Defeat boss" clears the named boss setpiece '
                  'and fires a celebration.',
    )
    setpiece_name = models.CharField(
        max_length=120,
        blank=True,
        help_text='Display name + linkage key of the setpiece this objective '
                  'drives via setpiece_role (e.g. "Forest Temple", "Phantom '
                  'Ganon"). Objectives sharing a name drive the same setpiece.',
    )
    clears_setpiece = models.CharField(
        max_length=120,
        blank=True,
        help_text='Name of a setpiece this objective marks CLEARED when '
                  'obtained — e.g. a dungeon\'s key item or boss-defeat closing '
                  'the dungeon. A dungeon clears once ALL objectives targeting '
                  'its name are obtained (handles "item and/or boss, or both").',
    )

    class Meta:
        ordering = ['game', 'order', 'name']
        # Name need only be unique within a (game, group) — the same objective
        # name can appear in different run-sections (e.g. "Enter dungeon" in
        # both "The Dark World" and "Endgame").
        unique_together = [('game', 'name', 'group')]

    def __str__(self) -> str:
        return f'{self.game.title} — {self.name}'


class ObjectiveStatus(models.TextChoices):
    """Per-playthrough state of a GameObjective. Absence of a
    ScheduleEntryObjective row means OUTSTANDING (the default)."""

    OBTAINED = 'obtained', 'Obtained'
    SKIPPED = 'skipped', 'Skipped (not needed this run)'


class ScheduleEntryObjective(models.Model):
    """Records the per-run status of a GameObjective during a ScheduleEntry.

    No row = outstanding (mirrors CollectedItem's absence-is-default idea).
    A row marks the objective either OBTAINED (fires the omnibar pickup
    celebration) or SKIPPED (dropped from the live checklist count)."""

    schedule_entry = models.ForeignKey(
        ScheduleEntry, on_delete=models.CASCADE, related_name='objective_statuses'
    )
    objective = models.ForeignKey(
        GameObjective, on_delete=models.CASCADE, related_name='entry_statuses'
    )
    status = models.CharField(max_length=12, choices=ObjectiveStatus.choices)
    obtained_at = models.DateTimeField(default=timezone.now)
    split_ms = models.PositiveBigIntegerField(
        null=True, blank=True,
        help_text='Cumulative run time (milliseconds) at the moment this '
                  'objective was split/obtained — the LiveSplit "split time". '
                  'Null for skipped/outstanding objectives.',
    )
    count = models.PositiveIntegerField(
        default=0,
        help_text='Per-dungeon tally for link_mode=tally objectives (e.g. small '
                  'keys collected in this dungeon). 0 for single/normal '
                  'objectives.',
    )

    class Meta:
        ordering = ['-obtained_at']
        unique_together = [('schedule_entry', 'objective')]

    def __str__(self) -> str:
        return f'{self.schedule_entry} → {self.objective.name} ({self.status})'


class Setpiece(models.Model):
    """A live omnibar setpiece (boss fight / dungeon / shrine build-up tag).

    Many can be live at once for a single ScheduleEntry — e.g. a dungeon is
    `active` the whole time the runner is inside it while bosses within come
    and go. The omnibar surfaces only the highest-priority one (boss outranks
    dungeon; active outranks imminent; operators can pin a bespoke setpiece to
    the very top). "Cleared" is not a stored stage: clearing deletes the row
    (and may fire a celebration PlaythroughEvent).

    `is_auto` rows are reconciled from objective statuses by
    views.recompute_setpieces and must not be hand-edited (bar clear/pin);
    `is_auto=False` rows are bespoke operator entries left untouched by the
    reconcile pass.
    """

    STAGE_IMMINENT = 'imminent'
    STAGE_ACTIVE = 'active'
    STAGE_CHOICES = [
        (STAGE_IMMINENT, 'Imminent — build-up'),
        (STAGE_ACTIVE, 'Active — in progress'),
    ]

    # Default priority by kind (higher shown first); pin-to-top uses 1000.
    PRIORITY_BY_KIND = {
        'boss': 100,
        'shrine': 60,
        'dungeon': 40,
        'cutscene': 30,
    }
    DEFAULT_PRIORITY = 50
    PIN_TOP_PRIORITY = 1000

    schedule_entry = models.ForeignKey(
        ScheduleEntry, on_delete=models.CASCADE, related_name='setpieces'
    )
    kind = models.CharField(
        max_length=32,
        help_text='Type of setpiece: "boss", "dungeon", "shrine", "cutscene", '
                  'or anything the operator declares.',
    )
    name = models.CharField(
        max_length=120,
        help_text='Display name (e.g. "Phantom Ganon"). Shown on the omnibar.',
    )
    source_key = models.CharField(
        max_length=200,
        blank=True,
        default='',
        help_text='Internal identity for auto rows = setpiece name + driving '
                  'run-section group, so the same display name can recur across '
                  'dungeons (e.g. "Armos Knights" in two dungeons) as '
                  'independent setpieces. Blank for bespoke operator rows.',
    )
    stage = models.CharField(max_length=16, choices=STAGE_CHOICES)
    priority = models.IntegerField(
        default=DEFAULT_PRIORITY,
        help_text='Higher = surfaced first on the omnibar. Defaults by kind; '
                  'operator "pin to top" sets 1000.',
    )
    is_auto = models.BooleanField(
        default=False,
        help_text='True = derived from objective statuses and reconciled '
                  'automatically; False = bespoke operator entry.',
    )
    started_at = models.DateTimeField(default=timezone.now)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-priority', '-started_at']
        constraints = [
            # Auto rows are keyed by (entry, source_key) so reconcile can upsert
            # — source_key = name + run-section group, letting the same display
            # name recur across dungeons as independent setpieces.
            models.UniqueConstraint(
                fields=['schedule_entry', 'source_key'],
                condition=models.Q(is_auto=True),
                name='uniq_auto_setpiece_per_entry',
            ),
        ]

    @classmethod
    def default_priority_for(cls, kind: str) -> int:
        return cls.PRIORITY_BY_KIND.get((kind or '').strip().lower(), cls.DEFAULT_PRIORITY)

    def __str__(self) -> str:
        return f'{self.schedule_entry} → {self.kind}:{self.name} ({self.stage})'


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
    logo_url = models.CharField(
        max_length=500,
        blank=True,
        help_text='Platform logo shown in the donation picker (e.g. '
                  '/assets/img/fundraising-platforms/tiltify/Tiltify_Logo.png). '
                  'Absolute URL or site-relative path. Blank → the picker '
                  'falls back to the built-in FontAwesome glyph.',
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
    # ── Aggregate page total (synced from the platform) ────────────────────
    # JustGiving stops exposing the itemized donation feed once a page is
    # "Completed", but the page-details endpoint still reports the running
    # total + donation count. These cache that aggregate so past events'
    # totals stay visible. Written only by the totals sync; null = never
    # synced. Kept separate from the itemized Donation rows (never summed
    # into the event grand total) to avoid double-counting live pages.
    total_raised = models.DecimalField(
        max_digits=12, decimal_places=2, null=True, blank=True,
    )
    total_donation_count = models.PositiveIntegerField(null=True, blank=True)
    total_currency = models.CharField(max_length=8, blank=True)
    total_status = models.CharField(
        max_length=40, blank=True,
        help_text='Platform page status, e.g. JustGiving "Active" / "Completed".',
    )
    total_synced_at = models.DateTimeField(null=True, blank=True)
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


class MuteReason(models.TextChoices):
    """Why a donation is hidden from /obs/tts and /obs/omnibar live
    cards. Empty string = not muted; everything else is a reason tag
    the operator picked from a dropdown in /control/donations.

    Adding a new reason: extend this enum, regenerate the donations
    migration (auto-detected by Django), and the dropdown in
    /control/donations picks it up via /api/donation-mute-reasons/."""

    NONE = '', '— not muted —'
    NAUGHTY_NAME = 'naughty_name', 'Inappropriate donor name'
    NAUGHTY_MESSAGE = 'naughty_message', 'Inappropriate message text'
    NAUGHTY_IMAGE = 'naughty_image', 'Inappropriate donor image'
    ALREADY_ANNOUNCED = 'already_announced', 'Already announced on stream'
    OTHER = 'other', 'Other / manual'


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
    source_channel = models.CharField(
        max_length=50,
        blank=True,
        db_index=True,
        help_text='For multi-channel platforms (Twitch Charity), the broadcaster '
                  'login the donation came through (e.g. "zeldathonuk", "msec"). '
                  'Blank for single-source platforms. Donations still merge into '
                  'the same event total; this tags which channel raised them.',
    )
    mute_reason = models.CharField(
        max_length=32,
        choices=MuteReason.choices,
        default=MuteReason.NONE,
        blank=True,
        db_index=True,
        help_text='Why this donation is muted from /obs/tts and /obs/omnibar '
                  'live-donation overlays. Empty string = not muted. '
                  'Lets the operator record WHY a row was suppressed (naughty '
                  'content in name/message/image, repeat announcement, etc.) '
                  'rather than a yes/no flag with no audit trail. The '
                  'donation still counts toward totals — only the announcement '
                  'is suppressed.',
    )

    class Meta:
        ordering = ['-donated_at']
        unique_together = [('platform', 'external_id')]
        indexes = [models.Index(fields=['event', 'platform'])]

    def __str__(self) -> str:
        return f'{self.platform}: {self.donor_name} {self.currency} {self.amount}'

    @property
    def is_muted(self) -> bool:
        """Derived convenience flag. Existing TTS / omnibar consumers
        ask `donation.is_muted`; keeping the same shape on the JSON
        avoids touching them when the underlying field gained a reason
        tag. New code wanting the reason itself reads `mute_reason`."""
        return bool(self.mute_reason)


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


class ChestReplay(models.Model):
    """Singleton "re-fire this donation through /obs/chest-announcer".

    Mirrors `TtsReplay` exactly — the chest-announcer overlay polls
    this row and re-enqueues the donation when ``requested_at``
    advances past the value it last saw. Separate from `TtsReplay`
    because the operator can want one without the other (replay TTS
    without the chest fanfare, or re-show the chest card without
    re-narrating). Singleton (pk=1) so a fresh POST always overwrites
    the prior request.
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
        help_text='Bumped on every replay request. The chest-announcer '
                  'uses this as a high-water mark — when it moves '
                  'forward, enqueue the linked donation.',
    )

    class Meta:
        verbose_name_plural = 'chest replays'

    def __str__(self) -> str:
        return f'Chest replay: {self.donation or "(cleared)"} @ {self.requested_at:%H:%M:%S}'

    def save(self, *args, **kwargs):
        self.pk = 1
        super().save(*args, **kwargs)

    @classmethod
    def get(cls) -> 'ChestReplay':
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
    # Visualiser style for the /obs/audio-countdown canvas: one of
    # bars | mirror | waveform | radial | wave | auto (auto rotates per track).
    visualiser_style = models.CharField(max_length=20, default='bars')
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
    # TextField (not a capped CharField): the granted-scope list can be long —
    # the full feature set is 600+ chars — and it's purely informational.
    scopes = models.TextField(blank=True)
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


class TwitchCharityCampaign(models.Model):
    """The state of a Twitch Charity campaign, mirrored from EventSub
    (``channel.charity_campaign.start`` / ``.progress`` / ``.stop``) and the
    Helix ``/charity/campaigns`` poll.

    Keyed by Twitch's ``campaign_id`` (not a singleton) so past campaigns
    persist for history; ``active()`` returns the live one. This row tracks
    Twitch's *own* running total (``current_amount``) and target — used only as
    a goal/progress display. It is NOT summed into our donation totals: every
    individual Twitch Charity donation is also ingested as a ``Donation`` row,
    which remains the source of truth for the money we report.
    """

    campaign_id = models.CharField(max_length=200, unique=True)
    broadcaster_id = models.CharField(max_length=64, blank=True)
    charity_name = models.CharField(max_length=200, blank=True)
    charity_logo_url = models.URLField(blank=True)
    charity_website = models.URLField(blank=True)
    charity_description = models.TextField(blank=True)
    # Twitch's own figures. Stored at 2dp after converting from the minor-unit
    # integer Twitch sends (value=1234, decimal_places=2 → 12.34).
    target_amount = models.DecimalField(
        max_digits=12, decimal_places=2, null=True, blank=True,
    )
    current_amount = models.DecimalField(
        max_digits=12, decimal_places=2, default=Decimal('0.00'),
    )
    currency = models.CharField(max_length=3, default='GBP')
    is_active = models.BooleanField(default=True, db_index=True)
    started_at = models.DateTimeField(default=timezone.now)
    stopped_at = models.DateTimeField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-started_at']
        verbose_name = 'Twitch charity campaign'

    def __str__(self) -> str:
        state = 'active' if self.is_active else 'ended'
        return f'{self.charity_name or self.campaign_id} ({state})'

    @classmethod
    def active(cls) -> 'TwitchCharityCampaign | None':
        return cls.objects.filter(is_active=True).order_by('-started_at').first()


class TwitchChannelConnection(models.Model):
    """A durable OAuth connection to one Twitch channel, keyed by ``login`` and
    reused across events.

    Twitch's per-broadcaster APIs (charity campaign/donations, chat-as-bot,
    redemptions, predictions) are token-gated: each requires THAT channel's own
    user OAuth token (the broadcaster_id in the request must match the token's
    user id). So we store one connection per channel here, acquired in-app via
    the device-code flow (``/api/twitch/connect/start`` + ``…/poll``) or
    ``manage.py twitch_login --channel <login>``. Same field shape as
    TwitchOAuthToken so the refresh helper in twitch.py works on either.

    ``EventTwitchChannel`` rows reference a connection to mark which of an
    event's channels are charity sources (and, later, chat/redemption sources).
    The granted ``scopes`` determine what the connection can do.
    """

    login = models.CharField(
        max_length=50, unique=True,
        help_text='Twitch channel login (lowercase, the bit after twitch.tv/).',
    )
    broadcaster_id = models.CharField(
        max_length=64, blank=True,
        help_text='Numeric Twitch user id, resolved from the token at connect.',
    )
    display_name = models.CharField(max_length=100, blank=True)
    access_token = models.CharField(max_length=200, blank=True)
    refresh_token = models.CharField(max_length=200, blank=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    scopes = models.TextField(blank=True)
    is_active = models.BooleanField(
        default=True,
        help_text='Uncheck to stop polling / registering EventSub for this '
                  'channel without deleting its token.',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['login']
        verbose_name = 'Twitch channel connection'

    def __str__(self) -> str:
        return f'{self.display_name or self.login} ({"active" if self.is_active else "off"})'

    def has_scope(self, scope: str) -> bool:
        return scope in (self.scopes or '').split()


class EventTwitchChannel(models.Model):
    """One Twitch channel attached to an Event.

    Every channel on an event is checked for **live status**. A channel is also
    a **charity source** when ``track_charity`` is set and a ``connection`` is
    linked — its donations are polled / pushed (EventSub) and merge into the
    event total, tagged with ``Donation.source_channel = login``. This supports
    both "one live channel, several broadcasters fundraising for it" and "several
    channels live together sharing donations".
    """

    event = models.ForeignKey(
        Event, on_delete=models.CASCADE, related_name='twitch_channels',
    )
    login = models.CharField(
        max_length=50,
        help_text='Twitch channel login (the bit after twitch.tv/).',
    )
    display_name = models.CharField(max_length=100, blank=True)
    is_primary = models.BooleanField(
        default=False,
        help_text='The main stream channel — leads the homepage embed and is '
                  'the fallback for single-channel consumers. One per event.',
    )
    track_charity = models.BooleanField(
        default=False,
        help_text='Poll / EventSub this channel for Twitch Charity donations. '
                  'Requires a linked connection with channel:read:charity.',
    )
    charity_slug = models.CharField(
        max_length=200, blank=True,
        help_text='Optional Twitch Charity campaign slug (e.g. '
                  '"msec-gameblast26") used as the donate-link external id.',
    )
    connection = models.ForeignKey(
        TwitchChannelConnection,
        on_delete=models.SET_NULL, null=True, blank=True,
        related_name='event_channels',
        help_text='The OAuth connection (token) for this channel, set once the '
                  'broadcaster has connected. Null = live-status-only.',
    )
    order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['event', 'order', 'id']
        unique_together = [('event', 'login')]

    def __str__(self) -> str:
        return f'{self.event} → {self.login}{" (primary)" if self.is_primary else ""}'

    def save(self, *args, **kwargs):
        self.login = (self.login or '').strip().lower()
        super().save(*args, **kwargs)
        # One primary channel per event — demote the others in the same event.
        if self.is_primary:
            EventTwitchChannel.objects.filter(
                event_id=self.event_id, is_primary=True,
            ).exclude(pk=self.pk).update(is_primary=False)


class AnnouncementColor(models.TextChoices):
    PRIMARY = 'primary', 'Channel accent'
    BLUE = 'blue', 'Blue'
    GREEN = 'green', 'Green'
    ORANGE = 'orange', 'Orange'
    PURPLE = 'purple', 'Purple'


class ChatTrigger(models.TextChoices):
    DONATION = 'donation', 'Donation received'
    MILESTONE = 'milestone', 'Milestone reached'
    GAME_CHANGE = 'game_change', 'Game / run change'
    SUB = 'sub', 'New subscription'
    FOLLOW = 'follow', 'New follow'
    RAID = 'raid', 'Incoming raid'
    CHEER = 'cheer', 'Bits cheered'
    REDEMPTION = 'redemption', 'Channel-point redemption'


class ChatAnnouncement(models.Model):
    """Per-event Twitch chat announcement config for one trigger.

    When the trigger fires, the active event's PRIMARY connected channel posts
    the rendered ``template`` into its own chat (best-effort — a send failure
    never blocks ingest). Available placeholders depend on the trigger; see
    ``api.chat.DEFAULT_TEMPLATES`` for the defaults and the supported fields.
    """

    event = models.ForeignKey(
        Event, on_delete=models.CASCADE, related_name='chat_announcements',
    )
    trigger = models.CharField(max_length=20, choices=ChatTrigger.choices)
    enabled = models.BooleanField(default=False)
    template = models.TextField(
        blank=True,
        help_text='Message posted to chat. Supports {placeholder} fields — see '
                  'the per-trigger hints in /control.',
    )
    as_announcement = models.BooleanField(
        default=False,
        help_text='Post as a highlighted Twitch /announce (needs '
                  'moderator:manage:announcements) instead of a normal message.',
    )
    announcement_color = models.CharField(
        max_length=10, choices=AnnouncementColor.choices,
        default=AnnouncementColor.PRIMARY,
        help_text='Highlight colour when posted as an announcement.',
    )
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['event', 'trigger']
        unique_together = [('event', 'trigger')]

    def __str__(self) -> str:
        state = 'on' if self.enabled else 'off'
        return f'{self.event} → chat:{self.trigger} ({state})'


class RecurringChatMessage(models.Model):
    """A chat message posted on a timer to the active event's primary connected
    channel — e.g. a periodic "donate here" CTA. Driven by
    ``manage.py post_chat_reminders`` on a cron tick (best-effort, like the
    per-trigger announcements). Placeholders: ``{donate_url} {total} {charity}
    {channel}`` (see ``api.chat.recurring_context``)."""

    event = models.ForeignKey(
        Event, on_delete=models.CASCADE, related_name='recurring_chat_messages',
    )
    label = models.CharField(
        max_length=80, blank=True,
        help_text='Operator label (e.g. "Donation CTA"). Not posted.',
    )
    template = models.TextField()
    interval_minutes = models.PositiveIntegerField(
        default=15, help_text='Minimum minutes between posts.',
    )
    only_when_live = models.BooleanField(
        default=True,
        help_text='Only post while the primary channel is live on Twitch.',
    )
    enabled = models.BooleanField(default=False)
    last_posted_at = models.DateTimeField(null=True, blank=True)
    order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['event', 'order', 'id']

    def __str__(self) -> str:
        state = 'on' if self.enabled else 'off'
        return f'{self.event} → recurring:{self.label or self.pk} ({state})'

    @property
    def is_due(self) -> bool:
        if not self.enabled:
            return False
        if self.last_posted_at is None:
            return True
        from datetime import timedelta
        return timezone.now() - self.last_posted_at >= timedelta(
            minutes=self.interval_minutes,
        )


class ScheduledJob(models.Model):
    """A periodic management command the operator can enable + schedule from the
    control panel. A single cron tick (``manage.py run_scheduled_jobs``) runs
    every enabled job whose interval has elapsed; the panel also offers a
    "Run now". Keeps the recurring chores (donation polling, chat reminders,
    shoutout draining) configurable without editing crontabs."""

    key = models.CharField(max_length=50, unique=True)
    label = models.CharField(max_length=120)
    command = models.CharField(
        max_length=200,
        help_text='manage.py command + args, e.g. "poll_donations --twitch".',
    )
    description = models.CharField(max_length=300, blank=True)
    enabled = models.BooleanField(default=False)
    interval_seconds = models.PositiveIntegerField(default=60)
    last_run_at = models.DateTimeField(null=True, blank=True)
    last_status = models.CharField(max_length=20, blank=True)  # ok / error / running
    last_output = models.TextField(blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['key']

    def __str__(self) -> str:
        return f'{self.label} ({"on" if self.enabled else "off"})'

    @property
    def is_due(self) -> bool:
        if not self.enabled:
            return False
        if self.last_run_at is None:
            return True
        from datetime import timedelta
        return timezone.now() - self.last_run_at >= timedelta(
            seconds=self.interval_seconds,
        )


class SchedulerHeartbeat(models.Model):
    """Singleton 'last tick' timestamp written by ``run_scheduled_jobs --loop``
    every pass, so the control panel can show whether the scheduler service is
    actually alive (independent of whether any job is enabled)."""

    last_tick_at = models.DateTimeField(null=True, blank=True)

    def save(self, *args, **kwargs):
        self.pk = 1
        super().save(*args, **kwargs)

    @classmethod
    def beat(cls) -> None:
        cls.objects.update_or_create(pk=1, defaults={'last_tick_at': timezone.now()})


class ShoutoutConfig(models.Model):
    """Per-event shoutout settings. Donors (Twitch Charity, who carry a Twitch
    login) and raiders can be auto-queued for a ``/shoutout``; the queue is
    drained by ``manage.py process_shoutouts`` respecting Twitch's cooldowns
    (2-min global, 60-min per target) and the from-channel-must-be-live rule."""

    event = models.OneToOneField(
        Event, on_delete=models.CASCADE, related_name='shoutout_config',
    )
    enabled = models.BooleanField(default=False)
    shout_donations = models.BooleanField(default=True)
    shout_raids = models.BooleanField(default=True)
    min_donation_amount = models.DecimalField(
        max_digits=10, decimal_places=2, default=Decimal('0.00'),
        help_text='Only shout out donors who gave at least this much.',
    )
    only_when_live = models.BooleanField(default=True)
    global_cooldown_seconds = models.PositiveIntegerField(
        default=120, help_text='Min seconds between any two shoutouts (Twitch ≥120).',
    )
    target_cooldown_seconds = models.PositiveIntegerField(
        default=3600, help_text='Min seconds before shouting the same channel again.',
    )
    max_age_minutes = models.PositiveIntegerField(
        default=30, help_text='Drop queued shoutouts older than this (stale).',
    )
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self) -> str:
        return f'Shoutout config for {self.event} ({"on" if self.enabled else "off"})'


class ShoutoutReason(models.TextChoices):
    DONATION = 'donation', 'Donation'
    RAID = 'raid', 'Raid'
    MANUAL = 'manual', 'Manual'


class ShoutoutStatus(models.TextChoices):
    PENDING = 'pending', 'Pending'
    SENT = 'sent', 'Sent'
    SKIPPED = 'skipped', 'Skipped'
    CANCELED = 'canceled', 'Canceled'
    FAILED = 'failed', 'Failed'


class ShoutoutRequest(models.Model):
    """One queued ``/shoutout``. Drained one-at-a-time by the cron, oldest first,
    skipping targets on per-target cooldown — so a burst of donations drip-feeds
    out within Twitch's rate limits instead of being dropped."""

    event = models.ForeignKey(
        Event, on_delete=models.CASCADE, related_name='shoutout_requests',
    )
    target_login = models.CharField(max_length=50)
    target_display = models.CharField(max_length=100, blank=True)
    reason = models.CharField(
        max_length=12, choices=ShoutoutReason.choices, default=ShoutoutReason.MANUAL,
    )
    note = models.CharField(max_length=200, blank=True)
    status = models.CharField(
        max_length=12, choices=ShoutoutStatus.choices,
        default=ShoutoutStatus.PENDING, db_index=True,
    )
    requested_at = models.DateTimeField(default=timezone.now, db_index=True)
    sent_at = models.DateTimeField(null=True, blank=True)
    detail = models.CharField(max_length=300, blank=True)

    class Meta:
        ordering = ['-requested_at']
        indexes = [models.Index(fields=['event', 'status'])]

    def __str__(self) -> str:
        return f'shoutout {self.target_login} ({self.status})'

    def save(self, *args, **kwargs):
        self.target_login = (self.target_login or '').strip().lower()
        super().save(*args, **kwargs)


class RewardMapping(models.Model):
    """A channel-point reward (matched by Twitch reward id, or by title as a
    fallback) mapped to one or more actions. When the reward is redeemed
    (``channel.channel_points_custom_reward_redemption.add``), its enabled
    actions run in order. See ``api.rewards``."""

    event = models.ForeignKey(
        Event, on_delete=models.CASCADE, related_name='reward_mappings',
    )
    reward_id = models.CharField(
        max_length=100, blank=True,
        help_text='Twitch custom-reward id (preferred match). Blank → match by title.',
    )
    reward_title = models.CharField(
        max_length=200,
        help_text='Reward name — shown in the panel and used to match when no id.',
    )
    enabled = models.BooleanField(default=True)
    order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['event', 'order', 'id']

    def __str__(self) -> str:
        return f'{self.event} → reward:{self.reward_title}'

    def matches(self, reward_id: str, reward_title: str) -> bool:
        if self.reward_id:
            return self.reward_id == (reward_id or '')
        return self.reward_title.strip().lower() == (reward_title or '').strip().lower()


class RewardActionType(models.TextChoices):
    CHAT = 'chat', 'Post chat message'
    SHOUTOUT = 'shoutout', 'Shout out the redeemer'
    DEATH_COUNTER = 'death_counter', 'Adjust death counter'


class RewardAction(models.Model):
    """One action run when a ``RewardMapping`` is redeemed. ``params`` holds the
    per-type config: chat → {template, as_announcement, color}; shoutout → {};
    death_counter → {delta}."""

    mapping = models.ForeignKey(
        RewardMapping, on_delete=models.CASCADE, related_name='actions',
    )
    action_type = models.CharField(max_length=20, choices=RewardActionType.choices)
    params = models.JSONField(default=dict, blank=True)
    enabled = models.BooleanField(default=True)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['mapping', 'order', 'id']

    def __str__(self) -> str:
        return f'{self.mapping.reward_title} → {self.action_type}'


class TwitchPrediction(models.Model):
    """A Twitch Prediction opened from the control panel (e.g. "Beat the boss
    first try?"). Mirrors the Helix prediction so the operator can resolve or
    cancel it later. Created on the active event's primary connected channel
    (needs the channel:manage:predictions scope)."""

    STATUS_ACTIVE = 'ACTIVE'
    STATUS_LOCKED = 'LOCKED'
    STATUS_RESOLVED = 'RESOLVED'
    STATUS_CANCELED = 'CANCELED'

    event = models.ForeignKey(
        Event, on_delete=models.CASCADE, related_name='predictions',
    )
    prediction_id = models.CharField(max_length=200, unique=True)
    broadcaster_id = models.CharField(max_length=64, blank=True)
    title = models.CharField(max_length=255)
    status = models.CharField(max_length=20, default=STATUS_ACTIVE)
    # Mirror of Twitch's outcomes: [{id, title, color, users, channel_points}].
    outcomes = models.JSONField(default=list, blank=True)
    winning_outcome_id = models.CharField(max_length=200, blank=True)
    window_seconds = models.PositiveIntegerField(default=120)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Twitch prediction'

    def __str__(self) -> str:
        return f'{self.title} ({self.status})'


class LayoutPreset(models.Model):
    """A named arrangement for one OBS game-layout aspect ratio.

    /control/games assigns each Game a ``layout_type`` (16x9 / 4x3 / 3ds / …)
    because games can only output at fixed aspect ratios. This model layers a
    library of *presets* on top of each type: where the game capture sits and
    which elements (items, death count, timer, runners, …) show in the freed
    regions. /obs/full renders the **active** preset for the currently-playing
    game's layout_type.

    Activation is scoped **per layout_type** — exactly one preset is active for
    each aspect ratio at a time (so flipping the active 4x3 preset doesn't touch
    the active 16x9 one). This differs from ThemeSettings, where activation is
    global. The shape of ``config`` is owned by the frontend
    (useLayoutPresetConfig.parsePresetConfig); the backend stores it opaquely
    and the parser drops unknown ids + clamps sizes to the 1920×984 stage.
    """

    name = models.CharField(
        max_length=100,
        help_text='Label shown in /control/layouts — purely cosmetic.',
    )
    layout_type = models.CharField(max_length=20, choices=LayoutType.choices)
    is_active = models.BooleanField(
        default=False,
        help_text='One active preset per layout_type. The active row drives '
                  '/obs/full for games of that aspect ratio.',
    )
    config = models.JSONField(
        default=dict,
        blank=True,
        help_text='Variant + per-region widths + per-region element lists. '
                  'Shape owned by the frontend parser; unknown ids are dropped '
                  'and over-budget widths clamped to the 1920×984 stage on read.',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Layout preset'
        verbose_name_plural = 'Layout presets'
        ordering = ['layout_type', '-is_active', 'name']

    def save(self, *args, **kwargs):
        # Mirror ThemeSettings.save, but demote only siblings of the SAME
        # layout_type so each aspect ratio keeps its own active preset.
        super().save(*args, **kwargs)
        if self.is_active:
            LayoutPreset.objects.filter(
                layout_type=self.layout_type, is_active=True,
            ).exclude(pk=self.pk).update(is_active=False)

    def __str__(self) -> str:
        return f'{self.get_layout_type_display()} — {self.name}'

    @classmethod
    def active_for(cls, layout_type: str) -> 'LayoutPreset | None':
        """The active preset for an aspect ratio, or None when none is set
        (the frontend then falls back to its baked-in per-layout default)."""
        return cls.objects.filter(layout_type=layout_type, is_active=True).first()


class LayoutGuideSettings(models.Model):
    """Singleton for OBS layout *global* settings: the capture alignment guide
    and the manual layout-type override for /obs/full.

    Capture guide: when on, the /obs/layout/<type> + /obs/full game-capture boxes
    render a semi-transparent hashed border + device label so the operator can
    line each OBS capture source up with its reserved box. The control lives in
    /control/layouts but the guide draws inside the OBS browser source — a
    different browser context — so the flag is stored here and polled by the OBS
    page (the same singleton-polled pattern as ChestAnnouncerSettings).

    Forced layout type: by default /obs/full auto-picks its aspect ratio from the
    currently-playing game's layout_type. ``forced_layout_type`` lets the operator
    override that — when set, /obs/full renders that type's active preset
    regardless of the playing game; blank means "auto (follow the schedule)".

    Pinned to pk=1.
    """

    show_guide = models.BooleanField(
        default=False,
        help_text='When true, OBS layout pages draw the capture alignment guide '
                  '(hashed border + device label). Toggled from /control/layouts; '
                  'leave off for the live scene.',
    )
    forced_layout_type = models.CharField(
        max_length=20,
        choices=LayoutType.choices,
        blank=True,
        default='',
        help_text='When set, /obs/full forces this aspect ratio instead of '
                  'following the currently-playing game. Blank = auto (follow '
                  'the schedule). Set from /control/layouts.',
    )
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Layout guide settings'
        verbose_name_plural = 'Layout guide settings'

    def __str__(self) -> str:
        return f'Layout guide: {"on" if self.show_guide else "off"}'

    @classmethod
    def get(cls) -> 'LayoutGuideSettings':
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
    background_gradient_angle = models.IntegerField(
        default=180,
        help_text='Direction of the page background gradient in degrees '
                  '(--theme-bg-angle). 0 = upward, 90 = right, 180 = '
                  'downward (default), 270 = left.',
    )
    navbar_tint_color = models.CharField(
        max_length=40, default='#2b1b25',
        help_text='Top stop of the navbar overlay gradient (--theme-navbar-tint), '
                  'painted over the background gradient to lift the navbar slightly. '
                  'Accepts hex or rgba.',
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
    omnibar_logo_url = models.CharField(
        max_length=500,
        blank=True,
        help_text='Wordmark shown specifically inside the omnibar brand '
                  'pill. Lets the broadcast layer carry a different mark '
                  'from the site hero (e.g. a white-on-coloured variant '
                  'tuned to whichever brand-pill gradient the theme uses). '
                  'Blank falls back to logo_url. Absolute URL or '
                  'site-relative path (e.g. /assets/img/foo.svg).',
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
    button_gradient_angle = models.IntegerField(
        default=180,
        help_text='Direction of the primary button gradient in degrees '
                  '(--theme-button-angle). 0 = upward, 90 = right, '
                  '180 = downward (default), 270 = left.',
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

    # ── Multi-colour accents ────────────────────────────────────────────
    # Three additional named accent slots beyond primary/secondary so
    # multi-colour palettes (e.g. SNES PAL: green/red/yellow + blue
    # primary) can drive status badges, KPI underlines, omnibar tag
    # accents etc. without competing with the brand primary.
    accent_1 = models.CharField(
        max_length=40, default='',
        blank=True,
        help_text='Optional accent #1 (--theme-accent-1). Used for the success/'
                  'positive register on badges and decorative stripes. Blank '
                  'falls back to primary_bright at runtime.',
    )
    accent_2 = models.CharField(
        max_length=40, default='',
        blank=True,
        help_text='Optional accent #2 (--theme-accent-2). Used for the warning/'
                  'caution register. Blank falls back to primary.',
    )
    accent_3 = models.CharField(
        max_length=40, default='',
        blank=True,
        help_text='Optional accent #3 (--theme-accent-3). Used for the danger/'
                  'attention register. Blank falls back to secondary.',
    )

    # ── Card / surface trio ─────────────────────────────────────────────
    # A "surface" is any card, panel, or omnibar slot that sits on top
    # of the page background. Themes with bright page backgrounds (SNES,
    # GameBoy) want explicit surface fills so cards don't disappear; the
    # darker baked-in `rgba(0,0,0,0.35)` previously applied to every
    # .control-card is now a defaultable theme value.
    surface_color = models.CharField(
        max_length=40, default='rgba(0, 0, 0, 0.35)',
        help_text='Card/panel fill (--theme-surface). Bright themes can set '
                  'a solid light value here; the default semi-transparent '
                  'black preserves the bloodmoon look on dark themes.',
    )
    surface_text_color = models.CharField(
        max_length=40, default='',
        blank=True,
        help_text='Text colour on surface (--theme-surface-text). Blank '
                  'falls back to text_color, which is correct for dark '
                  'surfaces; bright surfaces should set a dark value here.',
    )
    surface_border_color = models.CharField(
        max_length=40, default='',
        blank=True,
        help_text='Card/panel edge colour (--theme-surface-border). Blank '
                  'falls back to line_color.',
    )

    # ── Omnibar-specific ────────────────────────────────────────────────
    # The omnibar lane background, tag pill colour, and ticker accent
    # have until now been driven by --obs-accent (set per-game by the
    # playthrough state machine). These fields let a theme override
    # those defaults so the omnibar reads as the theme rather than the
    # game when no game is live, and so multi-colour themes get to
    # surface their accents in the broadcast layer too.
    omnibar_lane_bg = models.CharField(
        max_length=40, default='',
        blank=True,
        help_text='Solid fill for the omnibar lane (--theme-omnibar-lane-bg). '
                  'Blank keeps the baked-in steel gradient. Useful for bright '
                  'themes that want the bar to match the page.',
    )
    omnibar_tag_color = models.CharField(
        max_length=40, default='',
        blank=True,
        help_text='[Deprecated] Global tag-pill / brand cluster accent — '
                  'used as the fallback default for the per-section gradient '
                  'fields below when those are blank. Prefer setting '
                  'omnibar_brand_from / top_tag_from / etc. for full '
                  'control. Blank lets --obs-accent (the per-game accent) '
                  'drive everything.',
    )
    omnibar_ticker_accent = models.CharField(
        max_length=40, default='',
        blank=True,
        help_text='Ticker / divider accent on the bottom lane '
                  '(--theme-omnibar-ticker). Blank falls back to '
                  'primary_bright.',
    )
    # ── Per-section omnibar gradients ───────────────────────────────────
    # Four named sections each take a two-stop gradient (from → to,
    # 180° top-down). Blank fields fall back through omnibar_tag_color
    # → --obs-accent so a theme can opt into per-section colours
    # incrementally. Default angle is 180° (top sheen → bottom
    # shoulder) so the lit-object look of the omnibar pills is
    # preserved across themes.
    omnibar_brand_from = models.CharField(
        max_length=40, default='', blank=True,
        help_text='Top stop of the left-side logo / brand-pill gradient '
                  '(--theme-omnibar-brand-from).',
    )
    omnibar_brand_to = models.CharField(
        max_length=40, default='', blank=True,
        help_text='Bottom stop of the left-side logo / brand-pill gradient '
                  '(--theme-omnibar-brand-to).',
    )
    omnibar_top_tag_from = models.CharField(
        max_length=40, default='', blank=True,
        help_text='Top stop of the top-lane tag pill gradient '
                  '(--theme-omnibar-top-tag-from). Drives every panel in '
                  'the top lane.',
    )
    omnibar_top_tag_to = models.CharField(
        max_length=40, default='', blank=True,
        help_text='Bottom stop of the top-lane tag pill gradient '
                  '(--theme-omnibar-top-tag-to).',
    )
    omnibar_bottom_tag_from = models.CharField(
        max_length=40, default='', blank=True,
        help_text='Top stop of the bottom-lane tag pill gradient '
                  '(--theme-omnibar-bottom-tag-from). Drives every panel '
                  'in the bottom lane (donation reel, charity info, '
                  'schedule, etc.).',
    )
    omnibar_bottom_tag_to = models.CharField(
        max_length=40, default='', blank=True,
        help_text='Bottom stop of the bottom-lane tag pill gradient '
                  '(--theme-omnibar-bottom-tag-to).',
    )
    omnibar_total_from = models.CharField(
        max_length=40, default='', blank=True,
        help_text='Top stop of the right-side total-raised / charity '
                  'cluster gradient (--theme-omnibar-total-from).',
    )
    omnibar_total_to = models.CharField(
        max_length=40, default='', blank=True,
        help_text='Bottom stop of the right-side total-raised / charity '
                  'cluster gradient (--theme-omnibar-total-to).',
    )
    # ── Per-section omnibar text colours ────────────────────────────────
    # Each gradient section also takes a text colour so the content on
    # top of the gradient (tag pill label, body strong, body muted)
    # stays readable. Blank falls back to --theme-text (the legacy
    # omnibar text colour, currently white) so existing themes don't
    # change look until they opt in.
    omnibar_brand_text = models.CharField(
        max_length=40, default='', blank=True,
        help_text='Text colour on the left-side logo / brand pill '
                  '(--theme-omnibar-brand-text). Blank falls back to text_color.',
    )
    omnibar_top_tag_text = models.CharField(
        max_length=40, default='', blank=True,
        help_text='Text colour for the TOP-LANE TAG PILL ONLY '
                  '(--theme-omnibar-top-tag-text). The pill sits on the '
                  'gradient so the contrast register often differs from '
                  'the body content behind it. Blank falls back to '
                  'omnibar_top_lane_text → text_color.',
    )
    omnibar_top_lane_text = models.CharField(
        max_length=40, default='', blank=True,
        help_text='Text colour for the TOP-LANE BODY content '
                  '(--theme-omnibar-top-lane-text). Drives '
                  '.ob-text-strong / .ob-text-muted inside the top lane, '
                  'i.e. the panel content sitting to the right of the tag. '
                  'Blank falls back to text_color.',
    )
    omnibar_bottom_tag_text = models.CharField(
        max_length=40, default='', blank=True,
        help_text='Text colour for the BOTTOM-LANE TAG PILL ONLY '
                  '(--theme-omnibar-bottom-tag-text). Blank falls back to '
                  'omnibar_bottom_lane_text → text_color.',
    )
    omnibar_bottom_lane_text = models.CharField(
        max_length=40, default='', blank=True,
        help_text='Text colour for the BOTTOM-LANE BODY content '
                  '(--theme-omnibar-bottom-lane-text). Drives the panel '
                  'content sitting to the right of the bottom tag. Blank '
                  'falls back to text_color.',
    )
    omnibar_total_text = models.CharField(
        max_length=40, default='', blank=True,
        help_text='Text colour inside the right-side total-raised / charity '
                  'cluster — currency + amount + supporting copy '
                  '(--theme-omnibar-total-text). Blank falls back to text_color.',
    )
    # ── Celebration takeover defaults ──────────────────────────────────
    # The full-bar celebration banner (CelebrationBanner) renders a
    # gold-flash mood by default. These fields let a theme override
    # the tag pill / headline / subhead colours for the BANNER's
    # default look. Individual triggers can still override per-fire
    # via the payload (see CelebrationBanner — payload.tag_color,
    # payload.heading_color, payload.sub_color).
    omnibar_celebration_tag = models.CharField(
        max_length=40, default='', blank=True,
        help_text='[Deprecated] Single-colour default for the celebration '
                  'tag pill — kept as the fallback for omnibar_celebration_'
                  'tag_from/_to when those are blank. Prefer setting the '
                  'gradient pair below.',
    )
    omnibar_celebration_tag_from = models.CharField(
        max_length=40, default='', blank=True,
        help_text='Top stop of the celebration tag pill gradient '
                  '(--theme-omnibar-celebration-tag-from). Blank falls back '
                  'to omnibar_celebration_tag → brand mesh.',
    )
    omnibar_celebration_tag_to = models.CharField(
        max_length=40, default='', blank=True,
        help_text='Bottom stop of the celebration tag pill gradient '
                  '(--theme-omnibar-celebration-tag-to). Blank falls back '
                  'to omnibar_celebration_tag → brand mesh.',
    )
    omnibar_celebration_heading = models.CharField(
        max_length=40, default='', blank=True,
        help_text='Default celebration headline colour '
                  '(--theme-omnibar-celebration-heading). Blank falls '
                  'back to the original warm-gold (#ffe69b).',
    )
    omnibar_celebration_sub = models.CharField(
        max_length=40, default='', blank=True,
        help_text='Default celebration subhead colour '
                  '(--theme-omnibar-celebration-sub). Blank inherits from '
                  'the surrounding lane / fullbar text colour.',
    )
    omnibar_celebration_flash = models.CharField(
        max_length=40, default='', blank=True,
        help_text='Default top-anchored flash overlay colour during a '
                  'celebration takeover '
                  '(--theme-omnibar-celebration-flash). The CSS gradient '
                  'mixes this colour with transparent at three alpha '
                  'stops, so any solid hex / rgb value works. Blank '
                  'falls back to the baked-in gold (#ffd23a).',
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
    announced = models.BooleanField(
        default=False,
        help_text='Set once the omnibar has played the flash/celebration for '
                  'this milestone. Persistent so reopening (or adding a second) '
                  'OBS browser source never replays an already-celebrated '
                  'milestone. Independent of reached_at — cleared by Reset so '
                  'the celebration can re-arm.',
    )
    audio_url = models.CharField(
        max_length=500,
        blank=True,
        help_text='Optional fanfare audio. The OBS browser source plays '
                  'this once when the milestone is crossed. Absolute URL '
                  'or site-relative path.',
    )
    # ── Per-milestone celebration colours ──────────────────────────────
    # When the milestone is reached the omnibar fires a celebration
    # takeover (see CelebrationBanner). These fields let the operator
    # colour-code each milestone's banner so e.g. the £5k flash is
    # green and the £25k flash is purple — useful when grouping
    # milestones into tiers. All optional — blanks fall back to the
    # theme defaults (omnibar_celebration_* on ThemeSettings), then to
    # the baked-in gold-flash mood.
    tag_color_from = models.CharField(
        max_length=40, default='', blank=True,
        help_text='Top stop of the celebration tag pill gradient. Sent '
                  'to the banner as payload.tag_color_from. Pair with '
                  'tag_color_to to get a gradient; either alone falls '
                  'through to the theme default.',
    )
    tag_color_to = models.CharField(
        max_length=40, default='', blank=True,
        help_text='Bottom stop of the celebration tag pill gradient.',
    )
    heading_color = models.CharField(
        max_length=40, default='', blank=True,
        help_text='Headline (WaveText) colour during the celebration. '
                  'Sent as payload.heading_color.',
    )
    sub_color = models.CharField(
        max_length=40, default='', blank=True,
        help_text='Subhead (italic line under the headline) colour. '
                  'Sent as payload.sub_color.',
    )
    flash_color = models.CharField(
        max_length=40, default='', blank=True,
        help_text='Top-anchored flash overlay colour. Sent as '
                  'payload.flash_color — the banner mixes it at three '
                  'alpha stops so any solid hex / rgb value works.',
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

    @classmethod
    def mark_reached_for_event(cls, event_id) -> list['Milestone']:
        """Stamp ``reached_at`` on every still-pending milestone of this event
        whose threshold the running donation total now meets.

        Called from the Donation ``post_save`` signal so milestones flip to
        reached the moment a donation crosses them — the omnibar polls
        ``is_reached`` and fires its celebration on the false→true transition.

        The total sums *all* the event's donations (muted ones still count
        toward totals — only their announcement is suppressed), matching
        ``DonationViewSet.totals``. A single bulk UPDATE filtered on
        ``reached_at__isnull=True`` keeps this idempotent and cheap, so it's
        safe to run on every donation save.

        Returns the milestones that flipped false→true on *this* call (so the
        signal can write one audit-log row per newly-reached milestone); an
        empty list when nothing crossed.
        """
        if not event_id:
            return []
        total = Donation.objects.filter(event_id=event_id).aggregate(
            t=models.Sum('amount'),
        )['t'] or Decimal('0')
        pending = cls.objects.filter(
            event_id=event_id,
            reached_at__isnull=True,
            threshold_amount__lte=total,
        )
        # Snapshot the rows about to flip before the bulk UPDATE clears the
        # filter, so the caller can report exactly which crossed.
        newly = list(pending)
        if newly:
            cls.objects.filter(pk__in=[m.pk for m in newly]).update(
                reached_at=timezone.now(),
            )
        return newly


class RaffleDeliveryMethod(models.TextChoices):
    """How a won prize is delivered to its winner — drives both the badge on
    the public page and which contact detail the operator needs to collect
    (postal address for physical, an account/handle/email for virtual)."""

    PHYSICAL = 'physical', 'Physical (postal)'
    EMAIL = 'email', 'Email'
    TWITCH = 'twitch', 'Twitch whisper'
    DISCORD = 'discord', 'Discord'
    CODE = 'code', 'Unlock code / digital'
    OTHER = 'other', 'Other'


class RaffleConditionType(models.TextChoices):
    """What defines a raffle's entry window. Auto types derive their window
    from existing timestamps (event/schedule) so no cron is needed; MANUAL
    relies on the operator stamping opened_at/closed_at via the viewset."""

    MANUAL = 'manual', 'Manual (operator opens/closes)'
    WHOLE_EVENT = 'whole_event', 'Whole event'
    SCHEDULE_ENTRY = 'schedule_entry', 'While a schedule entry is playing'
    DATE_RANGE = 'date_range', 'Between two dates/times'


class RaffleStatus(models.TextChoices):
    DRAFT = 'draft', 'Draft'
    OPEN = 'open', 'Open'
    CLOSED = 'closed', 'Closed'
    DRAWN = 'drawn', 'Drawn'


class Raffle(models.Model):
    """A winnable prize plus the window during which donors are entered.

    Entrants are not a stored table — they are derived from `Donation` rows
    whose `donated_at` falls in the raffle's effective window and whose
    `amount` clears `min_amount`. Draw odds are weighted by donation amount
    (a £10 donation has 10× the chance of a £1 one). Drawing is triggered
    manually by the operator; the window opens/closes automatically for the
    non-manual condition types.
    """

    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='raffles')
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    image_url = models.CharField(
        max_length=500,
        blank=True,
        help_text='Prize artwork. Absolute URL or site-relative path '
                  '(e.g. /assets/img/prizes/foo.jpg).',
    )
    delivery_method = models.CharField(
        max_length=20,
        choices=RaffleDeliveryMethod.choices,
        default=RaffleDeliveryMethod.PHYSICAL,
    )
    quantity = models.PositiveIntegerField(
        default=1,
        help_text='How many winners to draw for this prize.',
    )
    min_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal('0'),
        help_text='Minimum donation to qualify as an entry. 0 = any donation.',
    )
    condition_type = models.CharField(
        max_length=20,
        choices=RaffleConditionType.choices,
        default=RaffleConditionType.MANUAL,
        help_text='What makes this prize available to win — drives the '
                  'entry window.',
    )
    schedule_entry = models.ForeignKey(
        ScheduleEntry,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='raffles',
        help_text='For condition_type=schedule_entry: entries are taken '
                  'while this schedule entry is being played.',
    )
    window_start = models.DateTimeField(
        null=True,
        blank=True,
        help_text='For condition_type=date_range: window opens at this time.',
    )
    window_end = models.DateTimeField(
        null=True,
        blank=True,
        help_text='For condition_type=date_range: window closes at this time.',
    )
    status = models.CharField(
        max_length=10,
        choices=RaffleStatus.choices,
        default=RaffleStatus.DRAFT,
    )
    opened_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text='Stamped when a manual raffle is opened, and frozen as the '
                  'window start once drawn.',
    )
    closed_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text='Stamped when the raffle is closed or drawn — freezes the '
                  'entry window so the draw is reproducible.',
    )
    is_active = models.BooleanField(
        default=True,
        help_text='Show on the public /incentives page and the omnibar.',
    )
    order = models.PositiveIntegerField(default=0)
    payload = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['order', 'created_at']

    def __str__(self) -> str:
        return f'{self.name} ({self.get_status_display()})'

    def effective_window(self, now=None):
        """Return (start, end) for the entry window. `end` may be None when the
        window is still open-ended. Derived from the condition type so the
        auto types need no background job; once drawn we freeze to the stored
        opened_at/closed_at."""
        now = now or timezone.now()
        if self.status == RaffleStatus.DRAWN:
            return self.opened_at, self.closed_at
        ct = self.condition_type
        if ct == RaffleConditionType.WHOLE_EVENT:
            end = None if self.event.is_active else self.closed_at
            return self.event.start_time, end
        if ct == RaffleConditionType.SCHEDULE_ENTRY and self.schedule_entry:
            entry = self.schedule_entry
            start, end = entry.started_at, entry.finished_at
            # The run timer stamps started_at; but an operator may instead
            # just mark the game as "currently playing" (the OBS pointer)
            # without starting a timer. Treat that as the play having begun
            # so a raffle gated to the live game opens immediately. The
            # pointer's updated_at is when it became current → the window
            # start; it stays open (end=None) until the timer finishes the
            # entry or the pointer moves away (started_at falls back to None).
            if start is None:
                cp = CurrentlyPlaying.objects.filter(schedule_entry=entry).first()
                if cp is not None:
                    start = cp.updated_at
            return start, end
        if ct == RaffleConditionType.DATE_RANGE:
            return self.window_start, self.window_end
        # MANUAL (and any auto type missing its anchor) → operator-stamped.
        return self.opened_at, self.closed_at

    def is_open(self, now=None) -> bool:
        """True when the entry window is currently active and not yet drawn."""
        now = now or timezone.now()
        if self.status in (RaffleStatus.DRAFT, RaffleStatus.DRAWN, RaffleStatus.CLOSED):
            return False
        start, end = self.effective_window(now)
        if start is None or start > now:
            return False
        if end is not None and now > end:
            return False
        return True

    def qualifying_donations(self, now=None):
        """Donation queryset eligible as entries given the effective window
        (capped at `now`) and the minimum amount."""
        now = now or timezone.now()
        start, end = self.effective_window(now)
        if start is None:
            return Donation.objects.none()
        upper = now if end is None else min(end, now)
        return Donation.objects.filter(
            event=self.event,
            donated_at__gte=start,
            donated_at__lte=upper,
            amount__gte=self.min_amount,
        )


class RaffleWinner(models.Model):
    """A drawn winner + the contact and fulfillment trail for getting the
    prize to them. Contact details are PII and are intentionally NOT exposed
    on the public RaffleSerializer (see serializers.py)."""

    raffle = models.ForeignKey(Raffle, on_delete=models.CASCADE, related_name='winners')
    donation = models.ForeignKey(
        Donation,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='raffle_wins',
        help_text='The winning entry. SET_NULL so deleting a donation keeps '
                  'the winner row + its snapshot name.',
    )
    donor_name = models.CharField(
        max_length=200,
        help_text='Snapshot of the donor name at draw time.',
    )
    drawn_at = models.DateTimeField(auto_now_add=True)
    contact_info = models.TextField(
        blank=True,
        help_text='PII — postal address (physical) or email / handle (virtual). '
                  'Filled in by the operator after contacting the winner.',
    )
    delivery_code = models.CharField(
        max_length=255,
        blank=True,
        help_text='Unlock / redemption code for digital prizes.',
    )
    fulfillment_status = models.CharField(
        max_length=12,
        choices=[
            ('pending', 'Pending contact'),
            ('contacted', 'Contacted'),
            ('sent', 'Sent / shipped'),
            ('delivered', 'Delivered'),
            ('forfeited', 'Forfeited / redraw'),
        ],
        default='pending',
    )
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ['raffle', 'drawn_at']

    def __str__(self) -> str:
        return f'{self.donor_name} → {self.raffle.name}'


class CharitySlide(models.Model):
    """One slide in the omnibar's right-cluster charity rotation.

    Two flavours:

      kind='logo'  — image_url + alt_text. Renders the image centred.
                     Use for SpecialEffect, GameBlast, sponsor logos.
      kind='blurb' — title + body. Renders as a two-line text card.
                     Use for "Helps disabled gamers play", "Donate at
                     zeldathon.co.uk/charity", short call-outs, etc.

    The omnibar cycles through every active slide on the
    `cycle_seconds` interval set by the operator. When zero slides are
    configured the frontend falls back to a hardcoded default set so
    a fresh install still has something to show.
    """

    KIND_LOGO = 'logo'
    KIND_BLURB = 'blurb'
    KIND_CHOICES = [
        (KIND_LOGO, 'Logo'),
        (KIND_BLURB, 'Blurb'),
    ]

    kind = models.CharField(max_length=8, choices=KIND_CHOICES, default=KIND_BLURB)
    title = models.CharField(
        max_length=80,
        blank=True,
        help_text='Blurb header (uppercase gold line). Ignored for logos.',
    )
    body = models.CharField(
        max_length=240,
        blank=True,
        help_text='Blurb body text. Ignored for logos.',
    )
    image_url = models.CharField(
        max_length=500,
        blank=True,
        help_text='Logo image URL. Absolute or site-relative. '
                  'Ignored for blurbs.',
    )
    alt_text = models.CharField(
        max_length=80,
        blank=True,
        help_text='Logo alt text (e.g. "SpecialEffect"). Ignored for blurbs.',
    )
    order = models.PositiveIntegerField(
        default=0,
        help_text='Display order in the rotation (lower = earlier).',
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['order', 'id']

    def __str__(self) -> str:
        if self.kind == self.KIND_LOGO:
            return f'[logo] {self.alt_text or self.image_url}'
        return f'[blurb] {self.title or self.body[:40]}'


class ChestAnnouncerSoundTrigger(models.Model):
    """Rule that maps an incoming donation to a specific sound file.

    /obs/chest-announcer evaluates active triggers in priority order
    (lowest number wins) when each donation arrives. The first match
    plays its `sound_url` instead of the default procedural fanfare;
    no match → fanfare plays as the fallback. Three trigger kinds:

        game     — match when the currently-playing schedule entry's
                   game equals `game`. Use for game-themed stings.
        amount   — match when the donation amount equals `match`
                   (string, e.g. "6.70" matches £6.70 exactly,
                   ±0.005 tolerance for rounding).
        keyword  — match when the donation message contains any of
                   the comma-separated terms in `match` (case-
                   insensitive substring).

    `sound_url` is a URL or site-relative path to an audio file the
    browser can play (mp3, wav, ogg). The streamer is responsible for
    ensuring they have the rights to any audio they reference here —
    nothing is bundled with this codebase.
    """

    KIND_GAME = 'game'
    KIND_AMOUNT = 'amount'
    KIND_KEYWORD = 'keyword'
    KIND_CHOICES = [
        (KIND_GAME, 'Game'),
        (KIND_AMOUNT, 'Amount'),
        (KIND_KEYWORD, 'Keyword'),
    ]

    name = models.CharField(
        max_length=120,
        help_text='Operator-facing label (e.g. "£6.70 sting", "OoT theme").',
    )
    kind = models.CharField(max_length=16, choices=KIND_CHOICES)
    match = models.CharField(
        max_length=200,
        blank=True,
        help_text=(
            'amount: JS regex tested against the bare amount string '
            '(e.g. "69.00"). Currency glyphs in the pattern are '
            'stripped automatically, so "^£69\\.00$" works the same as '
            '"^69\\.00$". "69" matches anything containing the digits '
            '"69"; "^69\\.00$" matches exactly 69.00; "\\.69$" matches '
            'any amount ending in 69 pence. keyword: comma-separated '
            'terms, case-insensitive substring of the donation message. '
            'game: leave blank, the `game` FK below drives the match.'
        ),
    )
    game = models.ForeignKey(
        'Game',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='chest_sound_triggers',
        help_text='Only used when kind=game. Fires while this game is the '
                  'currently-playing schedule entry.',
    )
    sound_url = models.CharField(
        max_length=500,
        help_text='Absolute URL or site-relative path to an audio file '
                  '(mp3/wav/ogg). Streamer is responsible for licensing.',
    )
    volume = models.FloatField(
        default=0.6,
        help_text='Playback gain (0.0–1.0). Defaults to 0.6 — louder than '
                  'the fanfare since the streamer presumably wants the '
                  'sting to land.',
    )
    priority = models.PositiveIntegerField(
        default=10,
        help_text='Lower number = higher priority. Multiple triggers can '
                  'match the same donation; the lowest-priority active '
                  'trigger wins.',
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['priority', 'name']
        verbose_name = 'Chest announcer sound trigger'
        verbose_name_plural = 'Chest announcer sound triggers'

    def __str__(self) -> str:
        return f'{self.name} ({self.kind})'


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
            'to avoid overlapping with the spoken readout — leave off '
            'unless you want a fanfare sting under the TTS.'
        ),
    )
    tts_enabled = models.BooleanField(
        default=True,
        help_text=(
            'When true, the chest announcer reads each donation (donor, '
            'amount and message) aloud via browser TTS as the card is '
            'held up. Independent of audio_enabled, which only gates the '
            'fanfare/trigger SFX. The omnibar no longer speaks donations, '
            'so this is the primary readout — default true.'
        ),
    )
    between_cards_ms = models.PositiveIntegerField(
        default=1500,
        help_text=(
            'Pause in milliseconds between donation cards when '
            'multiple donations queue up. Hero stays at the chest in '
            'idle pose for this long before reaching in for the next '
            'donation, giving viewers a beat to register each donor '
            'before the next reveal. Range 0–10000 enforced client-side.'
        ),
    )
    card_min_hold_ms = models.PositiveIntegerField(
        default=2800,
        help_text=(
            'Minimum time (ms) a donation card stays on screen, even '
            'if the audio finishes earlier. Keeps the visual rhythm '
            'consistent for short sounds. Range 500–60000 enforced '
            'client-side.'
        ),
    )
    card_max_hold_ms = models.PositiveIntegerField(
        default=20000,
        help_text=(
            'Hard ceiling (ms) on how long a card can stay on screen '
            'waiting for audio to finish. A long-running custom sting '
            'gets cut off after this to keep the donation queue moving. '
            'Should be >= card_min_hold_ms. Range up to 300000 (5 min) '
            'enforced client-side.'
        ),
    )
    scale = models.FloatField(
        default=1.0,
        validators=[MinValueValidator(0.1), MaxValueValidator(4.0)],
        help_text=(
            'Overall size of the scene (hero, chest, card, confetti) as a '
            'multiplier of the container-derived default. 1.0 is the legacy '
            'size; lower values shrink the scene for tall OBS sources (e.g. '
            'a full 1920x1080 browser source, where the default is huge). '
            'The ground baseline stays fixed, so the scene scales toward the '
            'floor line. Range 0.25–2.0 enforced client-side.'
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


# ── Schedule-entry sound triggers ───────────────────────────────────────
#
# A small library of reusable audio assets that can be wired to schedule
# entries at configurable timing offsets. Each trigger fires once per
# event run (cleared by an operator reset action) and creates an
# OmnibarOverride which the omnibar picks up via the existing SSE stream.
# The override either plays the sound silently or pairs it with a
# celebration-banner takeover, depending on `show_banner`. See:
#   - backend/api/sse.py for the evaluator that fires due triggers
#   - frontend/src/routes/obs/omnibar/Omnibar.tsx for playback wiring


class SoundAsset(models.Model):
    """Reusable audio asset. Referenced by many trigger rows so the
    same `MM_ClockTower_Bell.wav` can be wired to several entries
    (or several offsets on the same entry) without duplicating the URL.
    """

    name = models.CharField(
        max_length=120,
        help_text='Operator-facing label (e.g. "MM Clock Tower Bell").',
    )
    url = models.CharField(
        max_length=500,
        help_text='Absolute URL or site-relative path to the audio file.',
    )
    volume = models.FloatField(
        default=0.85,
        help_text='Playback volume, 0.0–1.0. Applied to every trigger '
                  'using this asset.',
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['name']

    def __str__(self) -> str:
        return self.name


class TriggerAnchor(models.TextChoices):
    START = 'start', 'Entry start'
    END = 'end', 'Entry end'


class ScheduleEntrySoundTrigger(models.Model):
    """Schedules a SoundAsset to play at a specific moment relative to
    a ScheduleEntry's start or end. The fire time is computed from the
    entry's ETA (event start + cumulative planned minutes), so it
    drifts with the schedule when prior games run long/short.

    Multiple rows per entry are the norm — three -30/-20/-10s "warning"
    bells plus one 0s "go!" sting on the same break would be four rows
    all pointing at the same SoundAsset(s) with different
    `offset_seconds`.
    """

    schedule_entry = models.ForeignKey(
        ScheduleEntry,
        related_name='sound_triggers',
        on_delete=models.CASCADE,
    )
    sound = models.ForeignKey(
        SoundAsset,
        on_delete=models.PROTECT,
        help_text='Which sound from the library to play.',
    )
    anchor = models.CharField(
        max_length=8,
        choices=TriggerAnchor.choices,
        default=TriggerAnchor.START,
        help_text='Whether `offset_seconds` counts from the entry\'s '
                  'start or end ETA.',
    )
    offset_seconds = models.IntegerField(
        default=0,
        help_text='Signed seconds offset from the anchor. -30 fires 30s '
                  'before the anchor, 0 fires at it, +120 fires two '
                  'minutes after.',
    )
    tag = models.CharField(
        max_length=64,
        blank=True,
        default='',
        help_text='Banner tag pill label (the gold chip on the left). '
                  'Blank falls back to "NOW PLAYING" on the omnibar. '
                  'Used to label the cue — e.g. "BREAK STARTING", '
                  '"BIG MOMENT", etc.',
    )
    message = models.CharField(
        max_length=240,
        blank=True,
        help_text='Banner headline shown when `show_banner` is true. '
                  'Ignored otherwise.',
    )
    subhead = models.CharField(
        max_length=240,
        blank=True,
        help_text='Optional smaller text shown beneath the headline on '
                  'the celebration banner. Ignored when `show_banner` '
                  'is false. Use for context like "Charity break · 15 min" '
                  'under a "BREAK STARTING" headline.',
    )
    priority = models.SmallIntegerField(
        default=5,
        help_text='Priority on the created OmnibarOverride.',
    )
    duration_seconds = models.PositiveIntegerField(
        default=6,
        help_text='How long the override stays live, in seconds.',
    )
    show_banner = models.BooleanField(
        default=True,
        help_text='When false the omnibar plays the sound but skips '
                  'the celebration banner takeover — useful for '
                  'ambient cues like warning bells. The override row '
                  'is still created for the audit trail.',
    )
    is_active = models.BooleanField(default=True)
    last_fired_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text='Stamped by the SSE evaluator when this trigger '
                  'fires. Empty = eligible to fire. Cleared by the '
                  '/api/schedule-entry-sound-triggers/reset/ action '
                  'so a trigger can be re-armed for a re-run.',
    )

    class Meta:
        ordering = ['schedule_entry__order', 'anchor', 'offset_seconds']
        indexes = [
            models.Index(fields=['is_active', 'last_fired_at']),
        ]

    def __str__(self) -> str:
        sign = '+' if self.offset_seconds >= 0 else ''
        return (
            f'{self.schedule_entry.display_title or self.schedule_entry_id} '
            f'· {self.anchor}{sign}{self.offset_seconds}s · {self.sound.name}'
        )


# ── Charities ───────────────────────────────────────────────────────────
#
# A Charity is the beneficiary of one or more Events. The main row carries
# the identity and copy (name, mission, CTAs, charity number, primary logo
# / banner / website). Repeating data — additional websites, fundraising
# videos, image gallery, "what does £X do?" impact tiers — lives in
# separate related tables so they can be reordered and edited row-by-row
# from the admin and /control without rewriting a JSON blob.
#
# Events link to Charity via the EventCharity through-table, which holds
# the per-event metadata (is_primary, order) that doesn't belong on the
# Charity itself — an org like SpecialEffect is "primary" for one event
# and a secondary beneficiary on another.


class SocialPlatform(models.TextChoices):
    """Catalogue of social platforms a Charity might link to.

    Closed enum so the control panel can render a recognised label /
    icon per row. Adding a new platform requires a migration (and a
    matching frontend label), which is intentional — the icon list
    needs to stay in sync. `OTHER` is the escape hatch for platforms
    we haven't catalogued yet.
    """

    TWITTER = 'twitter', 'X / Twitter'
    FACEBOOK = 'facebook', 'Facebook'
    INSTAGRAM = 'instagram', 'Instagram'
    YOUTUBE = 'youtube', 'YouTube'
    TIKTOK = 'tiktok', 'TikTok'
    LINKEDIN = 'linkedin', 'LinkedIn'
    BLUESKY = 'bluesky', 'Bluesky'
    THREADS = 'threads', 'Threads'
    MASTODON = 'mastodon', 'Mastodon'
    TWITCH = 'twitch', 'Twitch'
    DISCORD = 'discord', 'Discord'
    REDDIT = 'reddit', 'Reddit'
    PATREON = 'patreon', 'Patreon'
    OTHER = 'other', 'Other'


class Charity(models.Model):
    """A charity that one or more Events fundraise for."""

    slug = models.SlugField(
        max_length=80,
        unique=True,
        help_text='URL-safe key (e.g. "specialeffect"). Used in API paths '
                  'and as a stable handle when seeding events.',
    )
    name = models.CharField(max_length=200, unique=True)
    short_name = models.CharField(
        max_length=80,
        blank=True,
        help_text='Compact display label for tight UI (omnibar pills, '
                  'mobile cards). Falls back to `name` when blank.',
    )
    charity_number = models.CharField(
        max_length=40,
        blank=True,
        help_text='Registered charity number (e.g. UK Charity Commission '
                  'number). Free-text — different jurisdictions use '
                  'different formats.',
    )
    mission_statement = models.TextField(
        blank=True,
        help_text='Short paragraph summarising what the charity does. '
                  'Surfaced on the public /charity page and on the '
                  '/donations side panel.',
    )
    mission_tagline = models.CharField(
        max_length=160,
        blank=True,
        help_text='One-line condensed mission for tight spaces — the omnibar '
                  'charity ticker uses this so the long mission_statement '
                  "doesn't scroll forever. Falls back to mission_statement "
                  'when blank.',
    )

    # ── Branding ────────────────────────────────────────────────────
    # CharField (not URLField) on every operator-set media URL so the
    # admin forms accept site-relative paths (/assets/img/foo.svg)
    # alongside absolute URLs.
    logo_url = models.CharField(
        max_length=500,
        blank=True,
        help_text='Official charity logo — whatever aspect ratio the '
                  'charity ships (often a wide wordmark, e.g. '
                  'specialeffect-logo.svg). Used in the /charity page '
                  'header and on the /donations side panel where there '
                  'is room for a full mark. Absolute URL or '
                  'site-relative path.',
    )
    logo_thumbnail_url = models.CharField(
        max_length=500,
        blank=True,
        help_text='Square (or near-square) thumbnail for compact UI — '
                  'omnibar charity-cluster pills, control-panel table '
                  'rows, donation cards. Falls back to `logo_url` '
                  'rendered with `object-fit: contain` when blank, '
                  'which can look awkward for wide wordmarks, so '
                  'setting this is recommended for any charity whose '
                  'main logo is not roughly square. Absolute URL or '
                  'site-relative path.',
    )
    banner_url = models.CharField(
        max_length=500,
        blank=True,
        help_text='Wide hero/banner image used on the /charity page and '
                  'in promotional content. Absolute URL or site-relative '
                  'path.',
    )

    # ── Primary contact / web presence ─────────────────────────────
    primary_website_url = models.URLField(
        blank=True,
        help_text='Main charity website. Additional sites (campaign '
                  'microsites, GameBlast page, etc.) go in '
                  'CharityWebsite rows.',
    )

    # ── Calls to action ────────────────────────────────────────────
    # Two distinct CTAs surfaced in the omnibar / public page:
    #   `help_cta_*`   — "Here's how the charity can help YOU"
    #                    (link out to assessments, resources, support).
    #   `donate_cta_*` — "Make a donation now" (the per-event donation
    #                    URL still lives on DonationPage; this is the
    #                    evergreen direct-to-charity link).
    help_cta_headline = models.CharField(
        max_length=120,
        blank=True,
        help_text='Headline for the "how can the charity help you?" CTA. '
                  'e.g. "Need help adapting your gaming setup?".',
    )
    help_cta_body = models.TextField(
        blank=True,
        help_text='Body copy under the help CTA headline.',
    )
    help_cta_url = models.URLField(
        blank=True,
        help_text='Where the help CTA button links to (assessment form, '
                  'support page).',
    )
    donate_cta_headline = models.CharField(
        max_length=120,
        blank=True,
        help_text='Headline for the "make a donation" CTA. e.g. '
                  '"Every penny helps disabled gamers play".',
    )
    donate_cta_body = models.TextField(
        blank=True,
        help_text='Body copy under the donate CTA headline.',
    )
    donate_cta_url = models.URLField(
        blank=True,
        help_text='Evergreen donation page for the charity (used when '
                  'no event-scoped DonationPage applies).',
    )

    # ── Platform support ────────────────────────────────────────────
    # JSON list of DonationPlatform.choices keys (e.g.
    # ["justgiving", "tiltify", "twitch"]). Lets the picker UI grey
    # out platforms the charity can't actually receive funds via,
    # without forcing every charity to have a DonationPage seeded for
    # every platform. Validated by the serializer against the
    # DonationPlatform enum.
    supported_platforms = models.JSONField(
        default=list,
        blank=True,
        help_text='List of DonationPlatform keys the charity supports '
                  '(e.g. ["justgiving", "tiltify", "twitch"]). Empty '
                  'list = no platform constraint declared.',
    )

    is_active = models.BooleanField(
        default=True,
        help_text='Soft-delete switch. Inactive charities are hidden '
                  'from picker UIs but kept for historical audit / past '
                  'events.',
    )
    order = models.PositiveIntegerField(
        default=0,
        help_text='Display order in catalogue pickers (lower = earlier).',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['order', 'name']
        verbose_name_plural = 'charities'

    def __str__(self) -> str:
        return self.name


class CharityWebsite(models.Model):
    """Additional website link for a Charity beyond the primary URL."""

    charity = models.ForeignKey(
        Charity, on_delete=models.CASCADE, related_name='websites'
    )
    label = models.CharField(
        max_length=120,
        help_text='Display label (e.g. "GameBlast 24", "Workshop blog").',
    )
    url = models.URLField()
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['charity', 'order', 'id']

    def __str__(self) -> str:
        return f'{self.charity.name} → {self.label}'


class CharitySocialLink(models.Model):
    """A social-media presence for a Charity.

    Discriminated by ``platform`` so the frontend can render the
    correct icon / brand colour without having to parse the URL.
    Multiple rows per platform are allowed (e.g. a primary X account
    plus a campaign-specific one) — the catalogue isn't unique-per-
    platform, just enum-typed.
    """

    charity = models.ForeignKey(
        Charity, on_delete=models.CASCADE, related_name='social_links'
    )
    platform = models.CharField(
        max_length=20,
        choices=SocialPlatform.choices,
        help_text='Pick from the closed catalogue. Use `Other` for '
                  'platforms we have not enumerated yet.',
    )
    url = models.URLField(
        help_text='Full URL to the profile (the display layer renders '
                  'the icon + handle / label).',
    )
    handle = models.CharField(
        max_length=80,
        blank=True,
        help_text='Optional human-readable handle (e.g. "@specialeffect"). '
                  'When blank, the display layer derives a label from the '
                  'URL or platform name.',
    )
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['charity', 'order', 'id']

    def __str__(self) -> str:
        label = self.handle or self.get_platform_display()
        return f'{self.charity.name} → {label}'


class CharityVideo(models.Model):
    """A fundraising / awareness video link for a Charity.

    Stores the watch URL (YouTube/Vimeo/etc.) plus an optional
    thumbnail. Embed mode is decided client-side by inspecting the URL
    so we don't have to redeploy when a new host is added.
    """

    charity = models.ForeignKey(
        Charity, on_delete=models.CASCADE, related_name='videos'
    )
    title = models.CharField(max_length=200)
    url = models.URLField(
        help_text='Watch URL on YouTube / Vimeo / direct mp4.',
    )
    thumbnail_url = models.CharField(
        max_length=500,
        blank=True,
        help_text='Optional poster image. Falls back to a host-derived '
                  'thumbnail when blank.',
    )
    description = models.TextField(
        blank=True,
        help_text='Short caption shown below the video tile.',
    )
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['charity', 'order', 'id']

    def __str__(self) -> str:
        return f'{self.charity.name} → {self.title}'


class CharityImage(models.Model):
    """One image in a charity's fundraising gallery.

    Used for the /charity page mosaic and for marketing assets the
    omnibar / pre-stream scenes can rotate through. Distinct from
    `Charity.logo_url` / `banner_url` which are the canonical brand
    marks.
    """

    charity = models.ForeignKey(
        Charity, on_delete=models.CASCADE, related_name='images'
    )
    image_url = models.CharField(
        max_length=500,
        help_text='Absolute URL or site-relative path.',
    )
    alt_text = models.CharField(
        max_length=160,
        blank=True,
        help_text='Screen-reader alt + image fallback. Strongly '
                  'recommended.',
    )
    caption = models.CharField(
        max_length=200,
        blank=True,
        help_text='Optional visible caption shown under the image.',
    )
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['charity', 'order', 'id']

    def __str__(self) -> str:
        return f'{self.charity.name} → {self.alt_text or self.image_url}'


class CharityImpactTier(models.Model):
    """One row of the "What could your donation do?" table.

    Mirrors the existing benefitRows in /donations (£5 → Flexible
    Fixings, £10 → Joystick Extensions, …). Stored per-charity so
    different beneficiaries can declare their own impact ladder.

    Two body fields:
      `description`      — plain-text, always populated; used as the
                            fallback and for screen readers.
      `description_html` — optional rich-text override, e.g. for the
                            £75 row that embeds an `<a>` tag to the
                            Xbox Adaptive Controller page. The
                            frontend renders this via
                            dangerouslySetInnerHTML when non-empty,
                            otherwise it renders `description`.
    """

    charity = models.ForeignKey(
        Charity, on_delete=models.CASCADE, related_name='impact_tiers'
    )
    amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text='Donation amount this tier illustrates (e.g. 10.00).',
    )
    currency = models.CharField(
        max_length=3,
        default='GBP',
        help_text='ISO 4217 currency code. Display picks the symbol '
                  'from a small lookup table client-side.',
    )
    image_url = models.CharField(
        max_length=500,
        blank=True,
        help_text='Illustrative image for the benefit. Absolute URL or '
                  'site-relative path.',
    )
    alt_text = models.CharField(
        max_length=160,
        blank=True,
        help_text='Image alt + screen-reader label for the tier.',
    )
    description = models.TextField(
        help_text='Plain-text benefit description. Always required so '
                  'screen readers have something useful even when the '
                  'HTML variant is set.',
    )
    description_html = models.TextField(
        blank=True,
        help_text='Optional HTML override used by the frontend when set. '
                  'Lets a tier embed inline links (e.g. an `<a>` to a '
                  'product page) without losing the plain-text fallback. '
                  'Operator is trusted; this is rendered via '
                  'dangerouslySetInnerHTML.',
    )
    order = models.PositiveIntegerField(
        default=0,
        help_text='Display order in the table (lower = earlier). '
                  'Conventionally orders by ascending amount but the '
                  'field is independent so curators can pin a hero tier '
                  'to the top.',
    )

    class Meta:
        ordering = ['charity', 'order', 'amount']
        indexes = [models.Index(fields=['charity', 'order'])]

    def __str__(self) -> str:
        return f'{self.charity.name} → {self.currency} {self.amount}'


class EventCharity(models.Model):
    """Through-table linking Event ↔ Charity (many-to-many).

    Carries the per-event metadata that doesn't belong on either side:
    which charity is the primary beneficiary, and the display order
    when the event lists multiple. The Event side adds the M2M field
    `Event.charities` with `through='EventCharity'`.
    """

    event = models.ForeignKey(
        Event, on_delete=models.CASCADE, related_name='event_charities'
    )
    charity = models.ForeignKey(
        Charity, on_delete=models.CASCADE, related_name='event_charities'
    )
    is_primary = models.BooleanField(
        default=False,
        help_text='Promotes this charity above others on landing CTAs '
                  'and in the omnibar charity-cluster rotation. Only '
                  'one EventCharity per Event can be primary at a '
                  'time; saving a row as primary demotes the others.',
    )
    order = models.PositiveIntegerField(
        default=0,
        help_text='Display order when an event lists multiple charities '
                  '(lower = earlier).',
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['event', 'order', 'id']
        unique_together = [('event', 'charity')]
        verbose_name_plural = 'event ↔ charity links'

    def __str__(self) -> str:
        flag = ' ★' if self.is_primary else ''
        return f'{self.event.name} → {self.charity.name}{flag}'

    def save(self, *args, **kwargs):
        # Only one primary beneficiary per event at a time. When this
        # row is saved as primary, demote any other primary rows for
        # the same event in the same transaction. Mirrors the pattern
        # used by DonationPage.save / ThemeSettings.save.
        super().save(*args, **kwargs)
        if self.is_primary:
            EventCharity.objects.filter(
                event_id=self.event_id, is_primary=True,
            ).exclude(pk=self.pk).update(is_primary=False)


class ActivityLog(models.Model):
    """Append-only audit trail of everything the app does.

    Captures operator actions (mutating API requests, written by
    ``ActivityLogMiddleware``), internal event triggers (sound triggers,
    milestone crossings, written by explicit ``log_activity`` calls), and
    errors. The control panel's Logs & Queue page reads this table; the
    queue's "failed" lane is simply ``level='error'`` rows in a recent
    window.

    Rows are never edited — only inserted and (eventually) pruned by the
    ``prune_activity_log`` management command. There is no auth on the API
    (see the API-no-auth note), so the middleware redacts known PII keys
    (donor names, messages, tokens) before persisting request bodies, and
    the read endpoint must be reverse-proxy-gated like other operator data.
    """

    class Category(models.TextChoices):
        OPERATOR_ACTION = 'operator-action', 'Operator action'
        EVENT_TRIGGER = 'event-trigger', 'Event trigger'
        SOUND_TRIGGER = 'sound-trigger', 'Sound trigger'
        WEBHOOK = 'webhook', 'Webhook'
        EXTERNAL_EVENT = 'external-event', 'External event'
        SYSTEM = 'system', 'System'

    class Level(models.TextChoices):
        INFO = 'info', 'Info'
        WARNING = 'warning', 'Warning'
        ERROR = 'error', 'Error'

    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    category = models.CharField(
        max_length=24, choices=Category.choices, db_index=True,
    )
    action = models.CharField(
        max_length=64,
        help_text="Slug verb, e.g. 'timer.start', 'override.create', "
                  "'sound-trigger.fired', 'webhook.justgiving.ingest'.",
    )
    level = models.CharField(
        max_length=8, choices=Level.choices, default=Level.INFO, db_index=True,
    )
    summary = models.CharField(max_length=300, help_text='One-line human summary.')
    source = models.CharField(
        max_length=32, default='system',
        help_text="Origin: 'operator', 'system', 'twitch', 'justgiving', …",
    )
    target_type = models.CharField(max_length=64, blank=True)
    target_id = models.CharField(max_length=64, blank=True)
    detail = models.JSONField(
        default=dict, blank=True,
        help_text='Sanitised request body / payload / error context.',
    )
    request_method = models.CharField(max_length=8, blank=True)
    request_path = models.CharField(max_length=300, blank=True)
    status_code = models.SmallIntegerField(null=True, blank=True)
    acknowledged_at = models.DateTimeField(
        null=True, blank=True,
        help_text='When an operator dismissed this entry from the queue\'s '
                  'failed lane. The row stays in the audit trail — this only '
                  'clears it from the live "needs attention" view.',
    )

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['category', '-created_at']),
            models.Index(fields=['level', '-created_at']),
        ]

    def __str__(self) -> str:
        return f'[{self.level}] {self.category}/{self.action} — {self.summary}'


class Profile(models.Model):
    """Local authorization record keyed to a Clerk identity.

    Clerk owns *authentication* (who you are); this row owns *authorization*
    (what you may do). A Django ``User`` + ``Profile`` pair is created lazily the
    first time a valid Clerk token is presented (see ``api.authentication``),
    defaulting to the read-only ``viewer`` role. An admin promotes operators in
    the django-unfold admin — open Clerk sign-up never grants write access on
    its own.

    Roles are intentionally a simple choices field for now; the access checks go
    through ``has_operator()`` so this can grow into Django Groups / per-feature
    permissions later without touching every call site.
    """

    ROLE_VIEWER = 'viewer'
    ROLE_OPERATOR = 'operator'
    ROLE_CHOICES = [
        (ROLE_VIEWER, 'Viewer'),
        (ROLE_OPERATOR, 'Operator'),
    ]

    user = models.OneToOneField(
        'auth.User', on_delete=models.CASCADE, related_name='profile',
    )
    clerk_user_id = models.CharField(max_length=255, unique=True, db_index=True)
    # Clerk instance the user signed in from (the token `iss`). The same person
    # has a distinct clerk_user_id per instance, so this disambiguates the
    # dev vs prod profiles and selects the right secret key for Backend API calls.
    clerk_issuer = models.CharField(max_length=255, blank=True)
    email = models.EmailField(blank=True)
    role = models.CharField(max_length=32, choices=ROLE_CHOICES, default=ROLE_VIEWER)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['email', 'clerk_user_id']

    def __str__(self) -> str:
        return f'{self.email or self.clerk_user_id} ({self.role})'

    def has_operator(self) -> bool:
        """Whether this profile may perform mutating actions."""
        return self.role == self.ROLE_OPERATOR


class AuthConfig(models.Model):
    """Singleton runtime configuration for authentication + cross-origin access.

    Editable in the Django admin so the operator can rotate Clerk keys, add an
    allowed origin, or change the Stream Deck secret without editing env files or
    redeploying. Every field falls back to its Django setting (env-driven) when
    left blank, so local dev works with zero admin setup and prod can override
    live. Singleton (pk=1) — there is only ever one row.

    Consumption (all per-request, so admin edits take effect immediately):
      - Clerk params + hotkey secret are read on each authenticated request.
      - ``web_origins`` powers CORS via the corsheaders ``check_request_enabled``
        signal. (Django's CSRF_TRUSTED_ORIGINS, used only for the admin login,
        stays env-driven in settings.)
    """

    # Clerk -------------------------------------------------------------------
    clerk_issuers = models.TextField(
        blank=True,
        help_text='Trusted Clerk issuer URLs, one per line or comma-separated. '
                  'List both the dev and prod instances so localhost and the '
                  'public site both authenticate, e.g.\n'
                  'https://your-app.clerk.accounts.dev\n'
                  'https://clerk.zeldathon.co.uk\n'
                  'The JWKS for each is derived as <issuer>/.well-known/jwks.json. '
                  'Blank uses the CLERK_ISSUERS / CLERK_ISSUER env vars.',
    )
    clerk_authorized_parties = models.TextField(
        blank=True,
        help_text='Allowed azp claim values (the frontend origins), one per '
                  'line or comma-separated. List every origin across instances, '
                  'e.g. http://localhost:5173, https://www.zeldathon.co.uk',
    )
    clerk_secret_key = models.CharField(
        max_length=255, blank=True,
        help_text='Reserved for the Clerk Management API. Stored server-side; '
                  'never exposed to the frontend.',
    )

    # Stream Deck -------------------------------------------------------------
    timer_hotkey_secret = models.CharField(
        max_length=255, blank=True,
        help_text='Shared secret the Stream Deck sends as the X-Hotkey-Secret '
                  'header to /api/timer-hotkey/.',
    )

    # CORS allowed origins (applied per-request via the corsheaders signal) ---
    web_origins = models.TextField(
        blank=True,
        help_text='Full origins (scheme + host) allowed to call this API from a '
                  'browser (CORS), one per line or comma-separated. e.g. '
                  'https://www.zeldathon.co.uk. Added on top of the env-driven '
                  'CORS_ALLOWED_ORIGINS; takes effect immediately (no restart).',
    )

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Auth & access settings'
        verbose_name_plural = 'Auth & access settings'

    def __str__(self) -> str:
        return 'Auth & access settings'

    def save(self, *args, **kwargs):
        self.pk = 1  # enforce singleton
        super().save(*args, **kwargs)

    @classmethod
    def get(cls) -> 'AuthConfig':
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj

    @staticmethod
    def _as_list(text: str) -> list[str]:
        if not text:
            return []
        out: list[str] = []
        for chunk in text.replace(',', '\n').splitlines():
            value = chunk.strip()
            if value:
                out.append(value)
        return out

    def issuers_list(self) -> list[str]:
        # Normalise trailing slashes so issuer comparisons are exact.
        return [i.rstrip('/') for i in self._as_list(self.clerk_issuers)]

    def authorized_parties_list(self) -> list[str]:
        return self._as_list(self.clerk_authorized_parties)

    def web_origins_list(self) -> list[str]:
        return self._as_list(self.web_origins)

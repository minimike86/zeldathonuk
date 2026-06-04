"""Django admin registrations — gives the streamer a quick management UI
before the React control panel is fully built."""
from django.conf import settings
from django.contrib import admin, messages
from django.utils.html import format_html
from unfold.admin import ModelAdmin, TabularInline

from . import audio, igdb, models, ocremix, zeldawiki


@admin.register(models.Game)
class GameAdmin(ModelAdmin):
    list_display = ['box_art_thumb', 'title', 'platform', 'layout_type',
                    'default_play_minutes', 'release_year',
                    'igdb_id', 'twitch_game_id', 'hltb_id']
    list_display_links = ['box_art_thumb', 'title']
    list_filter = ['platform', 'layout_type']
    search_fields = ['title', 'igdb_id', 'twitch_game_id', 'hltb_id']
    readonly_fields = ['box_art_preview']
    fields = ['title', 'platform', 'layout_type', 'default_play_minutes',
              'release_year', 'igdb_id', 'twitch_game_id', 'hltb_id',
              'box_art_url', 'box_art_preview']
    actions = ['refresh_igdb_metadata', 'refresh_play_times', 'scrape_ocremix_remixes',
               'import_zelda_wiki_items']

    @admin.display(description='Cover')
    def box_art_thumb(self, obj):
        if not obj.box_art_url:
            return '—'
        return format_html(
            '<img src="{}" style="height:48px;width:auto;border-radius:2px;" alt="">',
            obj.box_art_url,
        )

    @admin.display(description='Preview')
    def box_art_preview(self, obj):
        if not obj.box_art_url:
            return '—'
        return format_html(
            '<img src="{}" style="max-height:280px;width:auto;border-radius:4px;" alt="">',
            obj.box_art_url,
        )

    @admin.action(description='Refresh IGDB + HLTB metadata for selected games')
    def refresh_igdb_metadata(self, request, queryset):
        """Re-fetch cover URL, IGDB id, Twitch Helix game id, and HLTB id from IGDB.

        Runs synchronously — IGDB throttles to 4 req/s so the action sleeps 0.3s
        between rows. Selecting the full catalogue takes ~15s.
        """
        client_id = settings.TWITCH_CLIENT_ID
        client_secret = settings.TWITCH_CLIENT_SECRET
        if not client_id or not client_secret:
            self.message_user(
                request,
                'TWITCH_CLIENT_ID and TWITCH_CLIENT_SECRET must be set in the environment.',
                level=messages.ERROR,
            )
            return

        rows = list(queryset.values_list('title', 'platform'))
        title_to_pk = dict(queryset.values_list('title', 'pk'))

        updated = 0
        partial = 0
        missed = 0
        try:
            for title, _platform, meta in igdb.fetch_metadata_batch(client_id, client_secret, rows):
                pk = title_to_pk.get(title)
                if pk is None:
                    continue
                fields_set = {}
                if meta.igdb_id:
                    fields_set['igdb_id'] = meta.igdb_id
                if meta.cover_url:
                    fields_set['box_art_url'] = meta.cover_url
                if meta.twitch_game_id:
                    fields_set['twitch_game_id'] = meta.twitch_game_id
                if meta.hltb_id:
                    fields_set['hltb_id'] = meta.hltb_id
                if meta.main_story_rushed_minutes:
                    fields_set['default_play_minutes'] = meta.main_story_rushed_minutes
                if not fields_set:
                    missed += 1
                    continue
                models.Game.objects.filter(pk=pk).update(**fields_set)
                if meta.igdb_id and meta.cover_url and meta.hltb_id:
                    updated += 1
                else:
                    partial += 1
        except igdb.MissingCredentials as exc:
            self.message_user(request, str(exc), level=messages.ERROR)
            return
        except Exception as exc:
            self.message_user(
                request,
                f'IGDB refresh aborted after a failure: {exc}',
                level=messages.ERROR,
            )
            return

        self.message_user(
            request,
            f'Refreshed {updated} fully, {partial} partially, {missed} with no matches.',
            level=messages.SUCCESS if updated or partial else messages.WARNING,
        )

    @admin.action(description='Refresh default play minutes from HLTB (Main Story Rushed)')
    def refresh_play_times(self, request, queryset):
        """Re-scrape `default_play_minutes` from HLTB's Main Story Rushed column.

        Lighter than the IGDB action — no token mint, just one HTTP fetch per
        game that already has an hltb_id. Games without an hltb_id are skipped.
        """
        updated = skipped = missed = 0
        for game in queryset:
            if not game.hltb_id:
                skipped += 1
                continue
            minutes = igdb.fetch_main_story_rushed_minutes(game.hltb_id)
            if minutes <= 0:
                missed += 1
                continue
            models.Game.objects.filter(pk=game.pk).update(default_play_minutes=minutes)
            updated += 1
        self.message_user(
            request,
            f'Updated {updated} games, {missed} with no HLTB time, {skipped} missing hltb_id.',
            level=messages.SUCCESS if updated else messages.WARNING,
        )

    @admin.action(description='Scrape OCRemix remixes for selected games')
    def scrape_ocremix_remixes(self, request, queryset):
        """For each selected Game, find matching OCRemix games by title and import
        every remix as an AudioTrack. Existing tracks are skipped (idempotent)."""
        session = ocremix.make_session()
        total_added = total_skipped = total_failed = 0
        searched = found = 0
        for game in queryset:
            searched += 1
            ocr_ids = ocremix.discover_game_ids(session, game.title)
            if not ocr_ids:
                continue
            found += 1
            for gid in ocr_ids:
                result = ocremix.scrape_game(session, gid)
                total_added += result.added
                total_skipped += result.skipped
                total_failed += result.failed
        if found == 0:
            self.message_user(
                request,
                f'OCRemix returned no matching games for any of the {searched} selected titles.',
                level=messages.WARNING,
            )
            return
        self.message_user(
            request,
            f'Scraped {found}/{searched} games — added {total_added} tracks, '
            f'skipped {total_skipped} (already present), failed {total_failed}.',
            level=messages.SUCCESS,
        )

    @admin.action(description='Import items from Zelda wiki for selected games')
    def import_zelda_wiki_items(self, request, queryset):
        """For each selected Game, pull its item checklist (names + sprite art)
        from the Zelda wiki and upsert GameItem rows. Idempotent. Stores the
        remote thumbnail URL (run the management command with --download to
        pull sprites into the assets folder instead)."""
        session = zeldawiki.make_session()
        total_added = total_updated = 0
        matched = 0
        for game in queryset:
            result = zeldawiki.import_for_game(session, game)
            if result.added or result.updated:
                matched += 1
            total_added += result.added
            total_updated += result.updated
        if matched == 0:
            self.message_user(
                request,
                'The Zelda wiki returned no matching item category for any selected game.',
                level=messages.WARNING,
            )
            return
        self.message_user(
            request,
            f'Imported items for {matched}/{queryset.count()} games — '
            f'added {total_added}, updated {total_updated}.',
            level=messages.SUCCESS,
        )


@admin.register(models.Runner)
class RunnerAdmin(ModelAdmin):
    list_display = ['name', 'channel_url', 'is_streamer']
    search_fields = ['name']


@admin.register(models.Event)
class EventAdmin(ModelAdmin):
    list_display = ['name', 'start_time', 'is_active', 'currency_symbol']
    list_filter = ['is_active']
    # Required so other admins (CharityAdmin / EventCharityAdmin) can
    # reference Event via autocomplete_fields.
    search_fields = ['name']

    def get_inlines(self, request, obj):  # noqa: ANN001
        # Resolved at request time. `EventCharityInline` is defined
        # further down this module; by the time the admin renders a
        # page, every class body in the module has executed and the
        # name is reachable via module globals.
        return [EventCharityInline]


@admin.register(models.ScheduleEntry)
class ScheduleEntryAdmin(ModelAdmin):
    list_display = ['event', 'order', 'game', 'planned_minutes', 'is_completed', 'started_at']
    list_filter = ['event', 'is_completed']
    autocomplete_fields = ['game', 'runners']


@admin.register(models.GameItemSet)
class GameItemSetAdmin(ModelAdmin):
    list_display = ['game', 'name', 'kind', 'order']
    list_filter = ['game', 'kind']
    search_fields = ['name', 'game__title']


@admin.register(models.GameItem)
class GameItemAdmin(ModelAdmin):
    list_display = ['game', 'name', 'category', 'order']
    list_filter = ['game', 'category']
    search_fields = ['name', 'game__title']
    filter_horizontal = ['sets']


@admin.register(models.CollectedItem)
class CollectedItemAdmin(ModelAdmin):
    list_display = ['schedule_entry', 'item', 'collected_at']
    list_filter = ['schedule_entry__event']


@admin.register(models.GameObjective)
class GameObjectiveAdmin(ModelAdmin):
    list_display = ['game', 'name', 'category', 'order']
    list_filter = ['game', 'category']
    search_fields = ['name', 'game__title']


@admin.register(models.ScheduleEntryObjective)
class ScheduleEntryObjectiveAdmin(ModelAdmin):
    list_display = ['schedule_entry', 'objective', 'status', 'obtained_at']
    list_filter = ['status', 'schedule_entry__event']


@admin.register(models.DonationPlatformProfile)
class DonationPlatformProfileAdmin(ModelAdmin):
    """Per-platform settings (fees, Gift Aid, fee warning, min donation).

    Singleton-per-platform — DonationPage rows look these up by platform key,
    so editing one row here updates every event's page for that platform.
    """
    list_display = ['platform', 'display_label', 'minimum_donation_amount',
                    'has_logo', 'has_fees_url', 'has_gift_aid_url',
                    'has_fee_warning']
    list_filter = ['platform']
    fields = ['platform', 'display_label', 'logo_url', 'fees_url',
              'gift_aid_url', 'fee_warning', 'minimum_donation_amount']

    @admin.display(boolean=True, description='Logo?')
    def has_logo(self, obj):
        return bool(obj.logo_url)

    @admin.display(boolean=True, description='Fees URL?')
    def has_fees_url(self, obj):
        return bool(obj.fees_url)

    @admin.display(boolean=True, description='Gift Aid URL?')
    def has_gift_aid_url(self, obj):
        return bool(obj.gift_aid_url)

    @admin.display(boolean=True, description='Fee warning?')
    def has_fee_warning(self, obj):
        return bool(obj.fee_warning)


@admin.register(models.DonationPage)
class DonationPageAdmin(ModelAdmin):
    list_display = ['event', 'platform', 'label', 'url', 'is_primary', 'order']
    list_filter = ['event', 'platform']
    list_editable = ['is_primary', 'order']
    fields = ['event', 'platform', 'label', 'url', 'external_id', 'is_primary',
              'order']


@admin.register(models.Donation)
class DonationAdmin(ModelAdmin):
    list_display = ['donated_at', 'platform', 'donor_name', 'amount', 'currency', 'event']
    list_filter = ['platform', 'event', 'currency']
    search_fields = ['donor_name', 'external_id', 'message']
    date_hierarchy = 'donated_at'


@admin.register(models.BrbTimer)
class BrbTimerAdmin(ModelAdmin):
    list_display = ['target_time', 'message', 'is_active']
    list_filter = ['is_active']


@admin.register(models.CurrentlyPlaying)
class CurrentlyPlayingAdmin(ModelAdmin):
    list_display = ['schedule_entry', 'updated_at']


@admin.register(models.AudioTrack)
class AudioTrackAdmin(ModelAdmin):
    list_display = ['title', 'artist', 'game', 'ocr_id', 'enabled', 'order']
    list_filter = ['game', 'enabled']
    search_fields = ['title', 'artist', 'game', 'ocr_id']
    list_editable = ['enabled', 'order']
    actions = ['prewarm_audio_cache']

    @admin.action(description='Pre-warm audio cache for selected tracks (force re-download)')
    def prewarm_audio_cache(self, request, queryset):
        """Force-refresh each selected track's MP3 in the on-disk cache.

        Always overwrites — the use case for clicking this is "I edited the
        source URL" or "the cached file looks broken," so silently skipping
        already-cached tracks defeats the purpose. Tracks whose upstream errors
        get auto-disabled by `audio._download_to_cache` — same behaviour as a
        live proxy hit."""
        downloaded = failed = 0
        for track in queryset:
            cache_path = audio._cache_path_for(track)
            cache_path.unlink(missing_ok=True)
            if audio._download_to_cache(track, cache_path):
                downloaded += 1
            else:
                failed += 1
        self.message_user(
            request,
            f'Re-downloaded {downloaded} tracks, {failed} failed (auto-disabled).',
            level=messages.SUCCESS if downloaded else messages.WARNING,
        )


@admin.register(models.NowPlayingAudio)
class NowPlayingAudioAdmin(ModelAdmin):
    list_display = ['track', 'updated_at']


@admin.register(models.ThemeSettings)
class ThemeSettingsAdmin(ModelAdmin):
    """Library of named themes. The row with `is_active=True` is what
    /api/theme/ returns, and toggling it in this admin demotes the rest
    on save (mirrors Event activation)."""
    list_display = ['__str__', 'is_active', 'primary', 'secondary', 'updated_at']
    list_filter = ['is_active']
    readonly_fields = ['created_at', 'updated_at']
    fieldsets = (
        ('Identity', {'fields': ('name', 'is_active')}),
        ('Palette', {
            'fields': ('primary', 'primary_bright', 'secondary',
                       'background_from', 'background_to',
                       'text_color', 'text_muted', 'line_color'),
        }),
        ('Branding', {
            'fields': ('logo_url', 'logo_small_url', 'favicon_url'),
        }),
        ('Background media', {
            'fields': ('background_video_url', 'background_image_url'),
        }),
        ('Buttons + lines', {
            'fields': ('button_gradient_from', 'button_gradient_to',
                       'button_text_color', 'button_border_color',
                       'divider_thickness'),
        }),
        ('Fonts', {'fields': ('heading_font', 'body_font')}),
        (None, {'fields': ('created_at', 'updated_at')}),
    )
    list_editable = ['is_active']


@admin.register(models.TwitchOAuthToken)
class TwitchOAuthTokenAdmin(ModelAdmin):
    """Singleton row — Twitch user OAuth token + refresh metadata.

    The token is refreshed automatically when nearing expiry; this UI is mainly
    for inspecting status or pasting a fresh token after re-running the Twitch
    CLI to upgrade scopes.
    """
    list_display = ['__str__', 'expires_at', 'scopes', 'updated_at']
    readonly_fields = ['expires_at', 'scopes', 'updated_at']
    fields = ['access_token', 'refresh_token', 'expires_at', 'scopes', 'updated_at']
    actions = ['force_refresh_token']

    def has_add_permission(self, request):
        return not models.TwitchOAuthToken.objects.exists()

    def has_delete_permission(self, request, obj=None):
        return False

    @admin.action(description='Force-refresh the access token now')
    def force_refresh_token(self, request, queryset):
        from . import twitch
        try:
            twitch.get_user_access_token(force_refresh=True)
        except twitch.TwitchAuthError as exc:
            self.message_user(request, str(exc), level=messages.ERROR)
            return
        self.message_user(request, 'Twitch token refreshed.', level=messages.SUCCESS)


# ── Omnibar v2 ─────────────────────────────────────────────────────────────


@admin.register(models.PlaythroughEvent)
class PlaythroughEventAdmin(ModelAdmin):
    list_display = ['kind', 'schedule_entry', 'created_at', 'expires_at']
    list_filter = ['kind']
    search_fields = ['kind', 'schedule_entry__title']
    date_hierarchy = 'created_at'
    readonly_fields = ['created_at']


@admin.register(models.OmnibarOverride)
class OmnibarOverrideAdmin(ModelAdmin):
    list_display = ['kind', 'target_lane', 'is_active', 'is_live',
                    'priority', 'starts_at', 'expires_at']
    list_filter = ['kind', 'target_lane', 'is_active']
    search_fields = ['kind']
    readonly_fields = ['is_live', 'created_at']


@admin.register(models.ExternalEvent)
class ExternalEventAdmin(ModelAdmin):
    list_display = ['source', 'kind', 'occurred_at', 'consumed_at']
    list_filter = ['source', 'kind']
    search_fields = ['source', 'kind']
    date_hierarchy = 'occurred_at'


@admin.register(models.Incentive)
class IncentiveAdmin(ModelAdmin):
    list_display = ['name', 'event', 'current_amount', 'goal_amount',
                    'progress_pct', 'is_active', 'reached_at']
    list_filter = ['event', 'is_active']
    search_fields = ['name', 'description']
    readonly_fields = ['progress_pct', 'is_reached', 'created_at', 'updated_at']


@admin.register(models.Milestone)
class MilestoneAdmin(ModelAdmin):
    list_display = ['name', 'event', 'threshold_amount', 'reached_at']
    list_filter = ['event']
    search_fields = ['name']
    readonly_fields = ['is_reached', 'created_at']


class RaffleWinnerInline(TabularInline):
    model = models.RaffleWinner
    extra = 0
    fields = ['donor_name', 'donation', 'fulfillment_status',
              'contact_info', 'delivery_code', 'drawn_at']
    readonly_fields = ['drawn_at']


@admin.register(models.Raffle)
class RaffleAdmin(ModelAdmin):
    list_display = ['name', 'event', 'status', 'delivery_method',
                    'condition_type', 'quantity', 'is_active', 'order']
    list_filter = ['event', 'status', 'delivery_method', 'condition_type',
                   'is_active']
    search_fields = ['name', 'description']
    readonly_fields = ['created_at', 'updated_at']
    inlines = [RaffleWinnerInline]


@admin.register(models.RaffleWinner)
class RaffleWinnerAdmin(ModelAdmin):
    list_display = ['donor_name', 'raffle', 'fulfillment_status', 'drawn_at']
    list_filter = ['fulfillment_status', 'raffle__event']
    search_fields = ['donor_name', 'contact_info', 'delivery_code']
    readonly_fields = ['drawn_at']


@admin.register(models.CharitySlide)
class CharitySlideAdmin(ModelAdmin):
    list_display = ['kind', 'order', 'preview', 'is_active']
    list_filter = ['kind', 'is_active']
    search_fields = ['title', 'body', 'alt_text']
    ordering = ['order', 'id']
    readonly_fields = ['created_at', 'updated_at']

    @admin.display(description='Preview')
    def preview(self, obj):
        return obj.title or obj.alt_text or (obj.body[:40] + ('…' if len(obj.body) > 40 else ''))


@admin.register(models.ChestAnnouncerSoundTrigger)
class ChestAnnouncerSoundTriggerAdmin(ModelAdmin):
    list_display = ['name', 'kind', 'match', 'game', 'priority', 'is_active']
    list_filter = ['kind', 'is_active']
    search_fields = ['name', 'match', 'sound_url']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(models.ChestAnnouncerSettings)
class ChestAnnouncerSettingsAdmin(ModelAdmin):
    """Singleton — one row (pk=1) created lazily via .get(). Hiding the
    "Add" button keeps the admin from offering to make a second row
    that the get-or-create logic would ignore anyway."""

    list_display = ['__str__', 'audio_enabled', 'updated_at']
    readonly_fields = ['updated_at']

    def has_add_permission(self, request) -> bool:  # noqa: ANN001
        return not models.ChestAnnouncerSettings.objects.exists()

    def has_delete_permission(self, request, obj=None) -> bool:  # noqa: ANN001
        return False


# ── Charities ────────────────────────────────────────────────────────────


class CharityWebsiteInline(TabularInline):
    model = models.CharityWebsite
    extra = 1
    fields = ['label', 'url', 'order']


class CharitySocialLinkInline(TabularInline):
    model = models.CharitySocialLink
    extra = 0
    fields = ['platform', 'url', 'handle', 'order']


class CharityVideoInline(TabularInline):
    model = models.CharityVideo
    extra = 0
    fields = ['title', 'url', 'thumbnail_url', 'order']


class CharityImageInline(TabularInline):
    model = models.CharityImage
    extra = 0
    fields = ['image_url', 'alt_text', 'caption', 'order']


class CharityImpactTierInline(TabularInline):
    model = models.CharityImpactTier
    extra = 1
    fields = ['amount', 'currency', 'image_url', 'alt_text',
              'description', 'description_html', 'order']


class EventCharityInline(TabularInline):
    """Surfaced both ways: on the Charity page (see EventCharityInline
    in EventAdmin below) and on the Event page so curators can attach
    beneficiaries from whichever side feels natural."""
    model = models.EventCharity
    extra = 0
    autocomplete_fields = ['charity', 'event']
    fields = ['event', 'charity', 'is_primary', 'order']


@admin.register(models.Charity)
class CharityAdmin(ModelAdmin):
    list_display = ['name', 'slug', 'short_name', 'is_active', 'order',
                    'charity_number']
    list_filter = ['is_active']
    search_fields = ['name', 'short_name', 'slug', 'charity_number',
                     'mission_statement']
    prepopulated_fields = {'slug': ('name',)}
    readonly_fields = ['created_at', 'updated_at']
    ordering = ['order', 'name']
    inlines = [
        CharityImpactTierInline,
        CharityWebsiteInline,
        CharitySocialLinkInline,
        CharityVideoInline,
        CharityImageInline,
        EventCharityInline,
    ]
    fieldsets = (
        ('Identity', {
            'fields': ('name', 'slug', 'short_name', 'charity_number',
                       'is_active', 'order'),
        }),
        ('About', {
            'fields': ('mission_statement',),
        }),
        ('Branding', {
            'fields': ('logo_url', 'logo_thumbnail_url', 'banner_url'),
        }),
        ('Web presence', {
            'fields': ('primary_website_url', 'supported_platforms'),
        }),
        ('Call to action — "how can the charity help you?"', {
            'fields': ('help_cta_headline', 'help_cta_body', 'help_cta_url'),
        }),
        ('Call to action — "make a donation"', {
            'fields': ('donate_cta_headline', 'donate_cta_body',
                       'donate_cta_url'),
        }),
        ('Meta', {
            'fields': ('created_at', 'updated_at'),
        }),
    )


@admin.register(models.EventCharity)
class EventCharityAdmin(ModelAdmin):
    list_display = ['event', 'charity', 'is_primary', 'order', 'created_at']
    list_filter = ['is_primary', 'event']
    search_fields = ['event__name', 'charity__name', 'charity__slug']
    autocomplete_fields = ['event', 'charity']
    readonly_fields = ['created_at']


@admin.register(models.AuthConfig)
class AuthConfigAdmin(ModelAdmin):
    """Singleton settings page for Clerk auth, the Stream Deck secret, and the
    CORS allowed origins. Blank fields fall back to env."""
    fieldsets = (
        ('Clerk', {
            'fields': ('clerk_issuers', 'clerk_authorized_parties',
                       'clerk_secret_key'),
        }),
        ('Stream Deck', {
            'fields': ('timer_hotkey_secret',),
        }),
        ('CORS allowed origins', {
            'fields': ('web_origins',),
        }),
        ('Meta', {'fields': ('updated_at',)}),
    )
    readonly_fields = ['updated_at']

    def has_add_permission(self, request):
        # Singleton — only ever the pk=1 row, created on demand.
        return not models.AuthConfig.objects.exists()

    def has_delete_permission(self, request, obj=None):
        return False

    def changelist_view(self, request, extra_context=None):
        # Jump straight into the single row instead of showing a 1-item list.
        from django.shortcuts import redirect
        from django.urls import reverse
        obj = models.AuthConfig.get()
        return redirect(reverse('admin:api_authconfig_change', args=[obj.pk]))


@admin.register(models.Profile)
class ProfileAdmin(ModelAdmin):
    """Promote/demote operators. Profiles are auto-created (as viewers) on first
    Clerk sign-in; change `role` to `operator` here to grant write access."""
    list_display = ['email', 'clerk_user_id', 'role', 'clerk_issuer', 'updated_at']
    list_filter = ['role', 'clerk_issuer']
    search_fields = ['email', 'clerk_user_id', 'user__username']
    readonly_fields = ['clerk_user_id', 'clerk_issuer', 'created_at', 'updated_at']
    list_editable = ['role']
    autocomplete_fields = ['user']

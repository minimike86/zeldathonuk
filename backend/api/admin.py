"""Django admin registrations — gives the streamer a quick management UI
before the React control panel is fully built."""
from django.conf import settings
from django.contrib import admin, messages
from django.utils.html import format_html

from . import audio, igdb, models, ocremix


@admin.register(models.Game)
class GameAdmin(admin.ModelAdmin):
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
    actions = ['refresh_igdb_metadata', 'scrape_ocremix_remixes']

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


@admin.register(models.Runner)
class RunnerAdmin(admin.ModelAdmin):
    list_display = ['name', 'channel_url', 'is_streamer']
    search_fields = ['name']


@admin.register(models.Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ['name', 'start_time', 'is_active', 'currency_symbol']
    list_filter = ['is_active']


@admin.register(models.ScheduleEntry)
class ScheduleEntryAdmin(admin.ModelAdmin):
    list_display = ['event', 'order', 'game', 'planned_minutes', 'is_completed', 'started_at']
    list_filter = ['event', 'is_completed']
    autocomplete_fields = ['game', 'runners']


@admin.register(models.GameItem)
class GameItemAdmin(admin.ModelAdmin):
    list_display = ['game', 'name', 'category', 'order']
    list_filter = ['game', 'category']
    search_fields = ['name', 'game__title']


@admin.register(models.CollectedItem)
class CollectedItemAdmin(admin.ModelAdmin):
    list_display = ['schedule_entry', 'item', 'collected_at']
    list_filter = ['schedule_entry__event']


@admin.register(models.Donation)
class DonationAdmin(admin.ModelAdmin):
    list_display = ['donated_at', 'platform', 'donor_name', 'amount', 'currency', 'event']
    list_filter = ['platform', 'event', 'currency']
    search_fields = ['donor_name', 'external_id', 'message']
    date_hierarchy = 'donated_at'


@admin.register(models.BrbTimer)
class BrbTimerAdmin(admin.ModelAdmin):
    list_display = ['target_time', 'message', 'is_active']
    list_filter = ['is_active']


@admin.register(models.CurrentlyPlaying)
class CurrentlyPlayingAdmin(admin.ModelAdmin):
    list_display = ['schedule_entry', 'updated_at']


@admin.register(models.AudioTrack)
class AudioTrackAdmin(admin.ModelAdmin):
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
class NowPlayingAudioAdmin(admin.ModelAdmin):
    list_display = ['track', 'updated_at']


@admin.register(models.TwitchOAuthToken)
class TwitchOAuthTokenAdmin(admin.ModelAdmin):
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

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import audio, dev_scenes, eventsub, sandbox, sse, twitch, views, webhooks

router = DefaultRouter()
router.register('games', views.GameViewSet)
router.register('game-items', views.GameItemViewSet)
router.register('game-item-sets', views.GameItemSetViewSet)
router.register('game-objectives', views.GameObjectiveViewSet)
router.register('runners', views.RunnerViewSet)
router.register('events', views.EventViewSet)
router.register('schedule', views.ScheduleEntryViewSet)
router.register('donations', views.DonationViewSet)
router.register('donation-pages', views.DonationPageViewSet)
router.register('themes', views.ThemeSettingsViewSet)
router.register('layout-presets', views.LayoutPresetViewSet)
router.register('brb', views.BrbTimerViewSet)
# Omnibar v2 streams
router.register('playthrough-events', views.PlaythroughEventViewSet)
router.register('overrides', views.OmnibarOverrideViewSet)
router.register('external-events', views.ExternalEventViewSet)
router.register('incentives', views.IncentiveViewSet)
router.register('milestones', views.MilestoneViewSet)
router.register('raffles', views.RaffleViewSet)
router.register('raffle-winners', views.RaffleWinnerViewSet)
router.register('charity-slides', views.CharitySlideViewSet)
router.register('charities', views.CharityViewSet)
router.register('charity-websites', views.CharityWebsiteViewSet)
router.register('charity-social-links', views.CharitySocialLinkViewSet)
router.register('charity-videos', views.CharityVideoViewSet)
router.register('charity-images', views.CharityImageViewSet)
router.register('charity-impact-tiers', views.CharityImpactTierViewSet)
router.register('event-charities', views.EventCharityViewSet)
router.register(
    'chest-announcer/sound-triggers',
    views.ChestAnnouncerSoundTriggerViewSet,
    basename='chest-announcer-sound-trigger',
)
router.register('sound-assets', views.SoundAssetViewSet)
router.register(
    'schedule-entry-sound-triggers',
    views.ScheduleEntrySoundTriggerViewSet,
    basename='schedule-entry-sound-trigger',
)
router.register('activity-log', views.ActivityLogViewSet, basename='activity-log')

urlpatterns = [
    path('healthz/', views.healthz, name='api-healthz'),
    # Authenticated user's local profile (identity + role) — drives control-panel
    # access in the frontend.
    path('me/', views.me, name='me'),
    path('currently-playing/', views.currently_playing, name='currently-playing'),
    # Server-side timer actions for an external macro pad / Stream Deck — works
    # while the emulator (not the browser) holds OS focus. POST {"action": ...}.
    path('timer-hotkey/', views.timer_hotkey, name='timer-hotkey'),
    path('tts/replay/', views.tts_replay, name='tts-replay'),
    path('tts/now-reading/', views.tts_now_reading, name='tts-now-reading'),
    path('donation-mute-reasons/', views.donation_mute_reasons, name='donation-mute-reasons'),
    path('theme/', views.theme_settings, name='theme-settings'),
    path('layout-guide/', views.layout_guide_settings, name='layout-guide-settings'),
    path(
        'chest-announcer/settings/',
        views.chest_announcer_settings,
        name='chest-announcer-settings',
    ),
    path(
        'chest-announcer/replay/',
        views.chest_replay,
        name='chest-replay',
    ),
    # Webhook intake — one path per platform plus a generic fallback.
    path('webhooks/justgiving/', webhooks.justgiving_webhook, name='wh-justgiving'),
    path('webhooks/tiltify/', webhooks.tiltify_webhook, name='wh-tiltify'),
    path('webhooks/donation/', webhooks.generic_webhook, name='wh-generic'),
    # Twitch — push the active schedule to the channel's Twitch schedule.
    path('twitch/push-schedule/', twitch.push_schedule, name='twitch-push'),
    # Read-only live-status check used by the public homepage to decide
    # whether to show the "<channel> is Offline" placeholder.
    path('twitch/stream-status/', twitch.stream_status, name='twitch-stream-status'),
    # Active Twitch Charity campaign (Twitch's own total + goal). Public read,
    # polled by the omnibar goal display. Null when no campaign is running.
    path(
        'twitch/charity-campaign/',
        views.twitch_charity_campaign,
        name='twitch-charity-campaign',
    ),
    # Twitch EventSub push intake (follow/sub/raid/bits). Writes to
    # ExternalEvent; omnibar polls for these on a 1.5s tick.
    path('twitch/eventsub/', eventsub.eventsub_webhook, name='twitch-eventsub'),
    # Audio playlist + CORS proxy for the visualiser.
    path('audio/playlist/', audio.playlist, name='audio-playlist'),
    path('audio/proxy/', audio.proxy, name='audio-proxy'),
    path('audio/now-playing/', audio.now_playing, name='audio-now-playing'),
    path('audio/track/<int:track_id>/', audio.update_track, name='audio-update-track'),
    # Dev-only: edits the zelda franchise module (scenes/franchises/zelda/
    # index.ts) and deletes the scene's .tsx file. Guarded by DEBUG in the view.
    path('dev/scenes/unregister/', dev_scenes.unregister_scene, name='dev-unregister-scene'),
    # Sandbox triggers — fabricate Twitch events / donations for rehearsal.
    # DEBUG-only; return 404 in production.
    path('sandbox/twitch-event/', sandbox.sandbox_twitch_event, name='sandbox-twitch-event'),
    path('sandbox/donation/', sandbox.sandbox_donation, name='sandbox-donation'),
    path(
        'sandbox/charity-campaign/',
        sandbox.sandbox_charity_campaign,
        name='sandbox-charity-campaign',
    ),
    # SSE push for low-latency overrides + playthrough + external events.
    # Omnibar prefers SSE; falls back to polling if the stream errors.
    path('stream/omnibar/', sse.omnibar_stream, name='omnibar-stream'),
    # Live snapshot of the event "queue" (awaiting / processing / failed)
    # for the control panel's Logs & Queue page.
    path('queue/', views.queue_snapshot, name='queue-snapshot'),
    # Image upload (multipart) — returns an absolute URL clients can store
    # in a *_url field.
    path('uploads/image/', views.upload_image, name='upload-image'),
    path('', include(router.urls)),
]

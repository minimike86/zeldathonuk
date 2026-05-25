from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import audio, twitch, views, webhooks

router = DefaultRouter()
router.register('games', views.GameViewSet)
router.register('runners', views.RunnerViewSet)
router.register('events', views.EventViewSet)
router.register('schedule', views.ScheduleEntryViewSet)
router.register('donations', views.DonationViewSet)
router.register('brb', views.BrbTimerViewSet)

urlpatterns = [
    path('healthz/', views.healthz, name='api-healthz'),
    path('currently-playing/', views.currently_playing, name='currently-playing'),
    # Webhook intake — one path per platform plus a generic fallback.
    path('webhooks/justgiving/', webhooks.justgiving_webhook, name='wh-justgiving'),
    path('webhooks/tiltify/', webhooks.tiltify_webhook, name='wh-tiltify'),
    path('webhooks/donation/', webhooks.generic_webhook, name='wh-generic'),
    # Twitch — push the active schedule to the channel's Twitch schedule.
    path('twitch/push-schedule/', twitch.push_schedule, name='twitch-push'),
    # Audio playlist + CORS proxy for the visualiser.
    path('audio/playlist/', audio.playlist, name='audio-playlist'),
    path('audio/proxy/', audio.proxy, name='audio-proxy'),
    path('audio/now-playing/', audio.now_playing, name='audio-now-playing'),
    path('audio/track/<int:track_id>/', audio.update_track, name='audio-update-track'),
    path('', include(router.urls)),
]

"""Django signal receivers for the api app.

Wired in ``ApiConfig.ready()`` (see ``apps.py``) so they register on startup.
"""
from corsheaders.signals import check_request_enabled
from django.db.models.signals import post_save
from django.dispatch import receiver

from . import chat
from .activity import log_activity
from .models import AuthConfig, Donation, Milestone


@receiver(check_request_enabled)
def cors_allow_configured_origins(sender, request, **kwargs):
    """Allow CORS for any origin listed in the admin-editable AuthConfig.

    Runs per-request (in addition to the static settings.CORS_ALLOWED_ORIGINS),
    so an operator can add an allowed origin in the Django admin without a
    redeploy. Returning True tells django-cors-headers to emit the CORS headers
    for this request's Origin.
    """
    origin = request.META.get('HTTP_ORIGIN')
    if not origin:
        return False
    try:
        return origin in AuthConfig.get().web_origins_list()
    except Exception:
        # DB unavailable / unmigrated — fall back to the static settings list.
        return False


@receiver(post_save, sender=Donation)
def mark_milestones_on_donation(sender, instance, created=False, **kwargs):
    """Auto-mark milestones reached whenever a donation lands, and post the
    configured Twitch chat announcements (best-effort).

    Covers every ingestion path (REST, sandbox, webhooks, polling jobs, admin)
    in one place. ``Milestone.mark_reached_for_event`` is idempotent, so firing
    on both creates and updates (e.g. a webhook re-send via ``update_or_create``
    that changes an amount) is safe. It returns only the milestones that
    crossed on *this* save, so we write one audit row per actual crossing
    rather than on every donation.
    """
    event = instance.event
    for milestone in Milestone.mark_reached_for_event(instance.event_id):
        log_activity(
            category='event-trigger',
            action='milestone.reached',
            summary=f'Milestone reached: {milestone.name} '
                    f'(£{milestone.threshold_amount})',
            source='system',
            target=milestone,
            detail={'threshold_amount': str(milestone.threshold_amount)},
        )
        chat.announce(event, 'milestone', {
            'milestone': milestone.name,
            'threshold': milestone.threshold_amount,
            'currency': event.currency_symbol,
        })
    # Announce only genuinely new, non-muted donations — not webhook re-sends
    # (created=False on the update_or_create update path).
    if created and not instance.is_muted:
        chat.announce(event, 'donation', {
            'donor': instance.donor_name,
            'amount': instance.amount,
            'currency': event.currency_symbol,
            'message': instance.message,
            'channel': instance.source_channel,
        })

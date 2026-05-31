"""Django signal receivers for the api app.

Wired in ``ApiConfig.ready()`` (see ``apps.py``) so they register on startup.
"""
from django.db.models.signals import post_save
from django.dispatch import receiver

from .activity import log_activity
from .models import Donation, Milestone


@receiver(post_save, sender=Donation)
def mark_milestones_on_donation(sender, instance, **kwargs):
    """Auto-mark milestones reached whenever a donation lands.

    Covers every ingestion path (REST, sandbox, webhooks, polling jobs, admin)
    in one place. ``Milestone.mark_reached_for_event`` is idempotent, so firing
    on both creates and updates (e.g. a webhook re-send via ``update_or_create``
    that changes an amount) is safe. It returns only the milestones that
    crossed on *this* save, so we write one audit row per actual crossing
    rather than on every donation.
    """
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

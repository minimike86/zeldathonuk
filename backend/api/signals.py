"""Django signal receivers for the api app.

Wired in ``ApiConfig.ready()`` (see ``apps.py``) so they register on startup.
"""
from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import Donation, Milestone


@receiver(post_save, sender=Donation)
def mark_milestones_on_donation(sender, instance, **kwargs):
    """Auto-mark milestones reached whenever a donation lands.

    Covers every ingestion path (REST, sandbox, webhooks, polling jobs, admin)
    in one place. ``Milestone.mark_reached_for_event`` is idempotent, so firing
    on both creates and updates (e.g. a webhook re-send via ``update_or_create``
    that changes an amount) is safe.
    """
    Milestone.mark_reached_for_event(instance.event_id)

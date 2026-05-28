from django.apps import AppConfig


class ApiConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'api'

    def ready(self):
        # Register signal receivers (Donation post_save → auto-mark milestones).
        from . import signals  # noqa: F401

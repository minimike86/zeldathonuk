from django.apps import AppConfig


class ApiConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'api'

    def ready(self):
        # Register signal receivers: Donation post_save → milestones, and the
        # corsheaders check_request_enabled receiver that allows the
        # admin-editable AuthConfig.web_origins per request (see signals.py).
        from . import signals  # noqa: F401

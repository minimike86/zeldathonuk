"""DRF permission classes for the zeldathon API.

The public site (home page, schedule, donations, OBS overlays) reads the API
anonymously, so safe methods stay open to everyone. Anything that mutates state
requires an authenticated Clerk user whose local Profile carries the
``operator`` role — see :class:`api.authentication.ClerkJWTAuthentication` and
:class:`api.models.Profile`.
"""
from __future__ import annotations

from rest_framework.permissions import BasePermission, SAFE_METHODS


class ReadOnlyOrOperator(BasePermission):
    """Allow GET/HEAD/OPTIONS for anyone; require operator role to write."""

    message = 'Operator role required for this action.'

    def has_permission(self, request, view) -> bool:
        if request.method in SAFE_METHODS:
            return True
        user = getattr(request, 'user', None)
        if not (user and user.is_authenticated):
            return False
        profile = getattr(user, 'profile', None)
        return bool(profile and profile.has_operator())

    def has_object_permission(self, request, view, obj) -> bool:
        return self.has_permission(request, view)

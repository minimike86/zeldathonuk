"""Clerk JWT authentication for DRF.

Clerk issues short-lived RS256 session JWTs to the React app. The frontend
sends them as ``Authorization: Bearer <jwt>``; this class verifies the
signature against the issuing instance's published JWKS (cached per issuer by
``PyJWKClient``), checks the standard claims, and maps the token's ``sub``
(Clerk user id) onto a local Django ``User`` + :class:`api.models.Profile` pair
— creating them lazily on first sight with the read-only ``viewer`` role.

Multiple issuers are trusted at once (one Vite bundle serves both localhost via
a dev Clerk instance and the public site via the prod instance — see
[[deploy-tunnel-topology]]). The token's ``iss`` selects which instance to
verify against, and is itself checked against the trusted set.

Authentication only establishes *identity* here. Authorization (operator vs
viewer) lives in the Profile and is enforced by
:class:`api.permissions.ReadOnlyOrOperator`.

Config (DB AuthConfig first, env fallback when blank):
  - ``CLERK_ISSUERS`` (or legacy ``CLERK_ISSUER``) — the trusted issuer URLs
  - ``CLERK_AUTHORIZED_PARTIES`` — allowed ``azp`` values (the frontend origins)
"""
from __future__ import annotations

import logging

import jwt
from django.conf import settings
from django.contrib.auth import get_user_model
from jwt import InvalidTokenError, PyJWKClient
from rest_framework import authentication, exceptions

from . import models

logger = logging.getLogger('api.auth')


def _resolve_config() -> tuple[list[str], list[str]]:
    """Effective (trusted_issuers, authorized_parties) — DB AuthConfig first,
    falling back to the env-driven Django settings when blank."""
    cfg = models.AuthConfig.get()
    issuers = cfg.issuers_list() or [
        i.rstrip('/') for i in getattr(settings, 'CLERK_ISSUERS', [])
    ]
    parties = cfg.authorized_parties_list() or getattr(
        settings, 'CLERK_AUTHORIZED_PARTIES', [],
    )
    return issuers, parties


# One PyJWKClient per issuer's JWKS URL — each fetches the JWKS once and caches
# its signing keys (keyed by kid), so we only hit Clerk on a cache miss / key
# rotation. Keyed by URL so adding/removing an issuer rebuilds lazily.
_jwks_clients: dict[str, PyJWKClient] = {}


def _jwks_client_for(issuer: str) -> PyJWKClient:
    url = f'{issuer.rstrip("/")}/.well-known/jwks.json'
    client = _jwks_clients.get(url)
    if client is None:
        client = PyJWKClient(url, cache_keys=True)
        _jwks_clients[url] = client
    return client


class ClerkJWTAuthentication(authentication.BaseAuthentication):
    """Authenticate requests bearing a Clerk session JWT."""

    keyword = b'bearer'

    def authenticate(self, request):
        """Return (user, token) for a valid Clerk JWT, else None (anonymous).

        We deliberately never raise: a missing/invalid/expired token leaves the
        request anonymous so public SAFE reads always work (the public site +
        OBS overlays must not break because a stale token rode along). Access
        control is left to the permission classes — writes and /api/me/ still
        require a verified operator/user, they just yield 401/403 via permission
        denial rather than an auth exception. Rejections are logged so a genuine
        operator-token problem is still diagnosable server-side.
        """
        header = authentication.get_authorization_header(request).split()
        if not header or header[0].lower() != self.keyword:
            return None  # no bearer token → anonymous
        if len(header) != 2:
            logger.info('Clerk auth: malformed Authorization header')
            return None

        token = header[1].decode('utf-8', errors='replace')
        issuers, parties = _resolve_config()
        if not issuers:
            logger.warning('Clerk auth: no trusted issuers configured')
            return None

        # Trust the issuer before fetching its keys: read the (unverified) iss
        # claim, confirm it's one we trust, then verify the signature against
        # that instance's JWKS with the issuer pinned.
        try:
            unverified = jwt.decode(token, options={'verify_signature': False})
        except InvalidTokenError as exc:
            logger.info('Clerk auth: undecodable token: %s', exc)
            return None

        issuer = (unverified.get('iss') or '').rstrip('/')
        if issuer not in issuers:
            logger.warning(
                'Clerk auth: untrusted issuer %r (trusted: %r)', issuer, issuers,
            )
            return None

        try:
            signing_key = _jwks_client_for(issuer).get_signing_key_from_jwt(token)
            claims = jwt.decode(
                token,
                signing_key.key,
                algorithms=['RS256'],
                issuer=issuer,
                # Tolerate modest clock skew between this server and Clerk for
                # iat/nbf/exp. Clerk session tokens are short-lived (~60s), so
                # keep this small — it's a skew cushion, not a lifetime extension.
                # (If tokens are rejected with "not yet valid (iat)", the host
                # clock is badly out of sync — fix the clock, don't grow this.)
                leeway=60,
                options={'require': ['exp', 'sub']},
            )
        except InvalidTokenError as exc:
            logger.warning('Clerk auth: token verification failed: %s', exc)
            return None

        azp = claims.get('azp')
        if parties and azp and azp not in parties:
            logger.warning(
                'Clerk auth: untrusted azp %r (allowed: %r)', azp, parties,
            )
            return None

        return (self._sync_user(claims), token)

    def authenticate_header(self, request):
        # Makes DRF return 401 (not 403) when a bad/expired token is supplied.
        return 'Bearer'

    @staticmethod
    def _sync_user(claims: dict):
        """Return the Django user for these Clerk claims, creating it + a viewer
        Profile on first sight and keeping the cached email fresh."""
        clerk_id = claims['sub']
        # Email is only present if the Clerk session token exposes it (add an
        # `email` claim in Clerk → Sessions → Customize session token); tolerate
        # its absence.
        email = claims.get('email') or claims.get('email_address') or ''
        # The issuer identifies which Clerk instance (dev vs prod) this user
        # belongs to — the same person has a different `sub` per instance, so we
        # store it to disambiguate the resulting per-instance profiles.
        issuer = (claims.get('iss') or '').rstrip('/')

        profile = (
            models.Profile.objects
            .select_related('user')
            .filter(clerk_user_id=clerk_id)
            .first()
        )
        if profile is not None:
            changed = []
            if email and email not in (profile.email, profile.user.email):
                profile.email = email
                profile.user.email = email
                profile.user.save(update_fields=['email'])
                changed.append('email')
            if issuer and profile.clerk_issuer != issuer:
                profile.clerk_issuer = issuer
                changed.append('clerk_issuer')
            if changed:
                profile.save(update_fields=[*changed, 'updated_at'])
            return profile.user

        User = get_user_model()
        user, _ = User.objects.get_or_create(
            username=clerk_id, defaults={'email': email},
        )
        models.Profile.objects.create(
            user=user,
            clerk_user_id=clerk_id,
            email=email,
            clerk_issuer=issuer,
            role=models.Profile.ROLE_VIEWER,
        )
        return user

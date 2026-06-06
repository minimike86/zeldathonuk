"""Django settings for the zeldathon API."""
import sys
from pathlib import Path

import dj_database_url
import environ
from django.core.exceptions import ImproperlyConfigured
from django.core.management.utils import get_random_secret_key

BASE_DIR = Path(__file__).resolve().parent.parent

env = environ.Env(
    DJANGO_DEBUG=(bool, False),
)
environ.Env.read_env(BASE_DIR / '.env')

DEBUG = env.bool('DJANGO_DEBUG', default=False)

# In dev, auto-generate a per-process secret so the app boots without any
# env setup. In production we require an explicit DJANGO_SECRET_KEY — silently
# falling back to a random value would log everyone out on every restart.
_secret = env('DJANGO_SECRET_KEY', default='')
if _secret:
    SECRET_KEY = _secret
elif DEBUG:
    SECRET_KEY = get_random_secret_key()
else:
    raise ImproperlyConfigured('DJANGO_SECRET_KEY is required when DEBUG is False')

ALLOWED_HOSTS = env.list('DJANGO_ALLOWED_HOSTS', default=['localhost', '127.0.0.1', 'zeldathon.co.uk', 'www.zeldathon.co.uk'])

# ──────────────────────────────────────────────────────────────────────────────
# Applications
# ──────────────────────────────────────────────────────────────────────────────
INSTALLED_APPS = [
    'unfold',  # must precede django.contrib.admin to override its templates
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'corsheaders',
    'api',
]

# django-unfold admin theme branding.
UNFOLD = {
    'SITE_TITLE': 'Zeldathon Admin',
    'SITE_HEADER': 'Zeldathon',
}

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    # Audit trail — logs every mutating /api/ request to ActivityLog. Sits
    # last so it sees the final response status (and skips GET/SSE traffic).
    'api.activity.ActivityLogMiddleware',
]

ROOT_URLCONF = 'zeldathon.urls'
WSGI_APPLICATION = 'zeldathon.wsgi.application'
ASGI_APPLICATION = 'zeldathon.asgi.application'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

# ──────────────────────────────────────────────────────────────────────────────
# Database — Postgres in all environments. SQLite fallback only when no URL.
# ──────────────────────────────────────────────────────────────────────────────
DATABASES = {
    'default': dj_database_url.config(
        default=env('DATABASE_URL', default=f'sqlite:///{BASE_DIR / "db.sqlite3"}'),
        conn_max_age=600,
        conn_health_checks=True,
    ),
}
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# ──────────────────────────────────────────────────────────────────────────────
# i18n / tz
# ──────────────────────────────────────────────────────────────────────────────
LANGUAGE_CODE = 'en-gb'
TIME_ZONE = 'Europe/London'
USE_I18N = True
USE_TZ = True

# ──────────────────────────────────────────────────────────────────────────────
# Static files — served by WhiteNoise in production
# ──────────────────────────────────────────────────────────────────────────────
STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# User-uploaded files (event logos, banners, etc.).
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# During tests, redirect uploads to a throwaway temp dir so the upload views
# never write stub files into the real (git-tracked) media/ tree. Without this
# every `manage.py test` run leaves orphan PNGs in media/uploads, media/logos,
# etc. The dir is created per test process and left for the OS to reap.
if 'test' in sys.argv:
    import tempfile

    MEDIA_ROOT = Path(tempfile.mkdtemp(prefix='zeldathon-test-media-'))

# ──────────────────────────────────────────────────────────────────────────────
# CORS — frontend dev server + production origin(s)
# ──────────────────────────────────────────────────────────────────────────────
CORS_ALLOWED_ORIGINS = env.list(
    'CORS_ALLOWED_ORIGINS',
    default=['http://localhost:5173', 'http://127.0.0.1:5173'],
)
CORS_ALLOWED_ORIGIN_REGEXES = env.list(
    'CORS_ALLOWED_ORIGIN_REGEXES',
    default=(
        [
            r'^http://192\.168\.\d+\.\d+:5173$',
            r'^http://10\.\d+\.\d+\.\d+:5173$',
            r'^http://172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+:5173$',
        ]
        if DEBUG else
        []
    ),
)
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_PRIVATE_NETWORK = env.bool('CORS_ALLOW_PRIVATE_NETWORK', default=DEBUG)

# Origins trusted for unsafe (POST/PUT/PATCH/DELETE) cross-origin requests —
# needed for the django-unfold admin login over the Cloudflare tunnel, where the
# Origin is the public https hostname. DRF itself is token-authed (no cookies),
# so this is really just for the session-cookie admin.
CSRF_TRUSTED_ORIGINS = env.list(
    'CSRF_TRUSTED_ORIGINS',
    default=['https://api.zeldathon.co.uk', 'https://www.zeldathon.co.uk'],
)

# ──────────────────────────────────────────────────────────────────────────────
# Clerk authentication
# ──────────────────────────────────────────────────────────────────────────────
# Clerk owns authentication; api.models.Profile owns authorization. The frontend
# sends Clerk session JWTs as Bearer tokens which api.authentication verifies
# against each issuer's JWKS. Multiple instances are trusted at once (dev for
# localhost + prod for the public site), so this is a LIST. CLERK_ISSUER (single)
# is still honoured for back-compat. The DB AuthConfig overrides these when set.
CLERK_ISSUERS = env.list(
    'CLERK_ISSUERS',
    default=[i for i in [env('CLERK_ISSUER', default='')] if i],
)
# Allowed `azp` (authorized party) claim values — the frontend origins across
# all instances (e.g. http://localhost:5173 and https://www.zeldathon.co.uk).
CLERK_AUTHORIZED_PARTIES = env.list('CLERK_AUTHORIZED_PARTIES', default=[])
# Optional — reserved for the Clerk Management API (e.g. backfilling emails).
CLERK_SECRET_KEY = env('CLERK_SECRET_KEY', default='')

# Shared secret the Stream Deck / macro pad sends as `X-Hotkey-Secret` to
# /api/timer-hotkey/. That endpoint is machine-driven (no Clerk login), so it is
# gated by this secret instead of the operator role.
TIMER_HOTKEY_SECRET = env('TIMER_HOTKEY_SECRET', default='')

# ──────────────────────────────────────────────────────────────────────────────
# DRF — Clerk JWT auth; reads are public, writes require the operator role
# ──────────────────────────────────────────────────────────────────────────────
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'api.authentication.ClerkJWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'api.permissions.ReadOnlyOrOperator',
    ],
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
    ],
}

# ──────────────────────────────────────────────────────────────────────────────
# Third-party API credentials (proxied from the frontend, never exposed there)
# ──────────────────────────────────────────────────────────────────────────────
# Tiltify v5 API is OAuth2 — the app fetches a short-lived access token from
# the client credentials below, so unattended polling keeps working. The
# campaign(s) to poll come per-event from the event's Tiltify DonationPage
# (external_id = campaign id), so TILTIFY_CAMPAIGN_ID is no longer used.
# TILTIFY_ACCESS_TOKEN stays as an optional manual override (e.g. a token
# pasted in for a one-off test); leave it blank in normal operation.
TILTIFY_CLIENT_ID = env('TILTIFY_CLIENT_ID', default='')
TILTIFY_CLIENT_SECRET = env('TILTIFY_CLIENT_SECRET', default='')
# Signing secret for the Tiltify webhook — when set, each delivery's HMAC
# signature is verified before ingest.
TILTIFY_WEBHOOK_SECRET = env('TILTIFY_WEBHOOK_SECRET', default='')
TILTIFY_ACCESS_TOKEN = env('TILTIFY_ACCESS_TOKEN', default='')
TILTIFY_CAMPAIGN_ID = env('TILTIFY_CAMPAIGN_ID', default='')
JUSTGIVING_API_KEY = env('JUSTGIVING_API_KEY', default='')
# Which JustGiving API to target: 'production' (api.justgiving.com) or
# 'staging' (api.staging.justgiving.com).
JUSTGIVING_ENV = env('JUSTGIVING_ENV', default='production')
TWITCH_CLIENT_ID = env('TWITCH_CLIENT_ID', default='')
TWITCH_CLIENT_SECRET = env('TWITCH_CLIENT_SECRET', default='')
# User OAuth — bootstraps the persisted TwitchOAuthToken row on first use.
# After that, refreshes happen automatically and the DB row is the source of truth.
TWITCH_ACCESS_TOKEN = env('TWITCH_ACCESS_TOKEN', default='')
TWITCH_REFRESH_TOKEN = env('TWITCH_REFRESH_TOKEN', default='')
TWITCH_BROADCASTER_ID = env('TWITCH_BROADCASTER_ID', default='')
# EventSub (webhook) — shared HMAC secret Twitch signs deliveries with (10-100
# chars) and the PUBLIC https URL of the /api/twitch/eventsub/ endpoint. Both
# are needed by `manage.py twitch_eventsub` to register subscriptions; the
# secret is also what eventsub.py verifies incoming signatures against.
TWITCH_EVENTSUB_SECRET = env('TWITCH_EVENTSUB_SECRET', default='')
TWITCH_EVENTSUB_CALLBACK_URL = env('TWITCH_EVENTSUB_CALLBACK_URL', default='')

# ──────────────────────────────────────────────────────────────────────────────
# Production hardening
# ──────────────────────────────────────────────────────────────────────────────
if not DEBUG:
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
    SECURE_HSTS_SECONDS = 60 * 60 * 24 * 30
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True

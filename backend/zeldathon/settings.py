"""Django settings for the zeldathon API."""
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

ALLOWED_HOSTS = env.list('DJANGO_ALLOWED_HOSTS', default=['localhost', '127.0.0.1'])

# ──────────────────────────────────────────────────────────────────────────────
# Applications
# ──────────────────────────────────────────────────────────────────────────────
INSTALLED_APPS = [
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

# ──────────────────────────────────────────────────────────────────────────────
# CORS — frontend dev server + production origin(s)
# ──────────────────────────────────────────────────────────────────────────────
CORS_ALLOWED_ORIGINS = env.list('CORS_ALLOWED_ORIGINS', default=['http://localhost:5173'])
CORS_ALLOW_CREDENTIALS = True

# ──────────────────────────────────────────────────────────────────────────────
# DRF — no auth wired yet; everything is AllowAny until auth is added
# ──────────────────────────────────────────────────────────────────────────────
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.AllowAny',
    ],
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
    ],
}

# ──────────────────────────────────────────────────────────────────────────────
# Third-party API credentials (proxied from the frontend, never exposed there)
# ──────────────────────────────────────────────────────────────────────────────
TILTIFY_ACCESS_TOKEN = env('TILTIFY_ACCESS_TOKEN', default='')
TILTIFY_CAMPAIGN_ID = env('TILTIFY_CAMPAIGN_ID', default='')
JUSTGIVING_API_KEY = env('JUSTGIVING_API_KEY', default='')
JUSTGIVING_PAGE_SHORTNAME = env('JUSTGIVING_PAGE_SHORTNAME', default='')
TWITCH_CLIENT_ID = env('TWITCH_CLIENT_ID', default='')
TWITCH_CLIENT_SECRET = env('TWITCH_CLIENT_SECRET', default='')
# User OAuth — bootstraps the persisted TwitchOAuthToken row on first use.
# After that, refreshes happen automatically and the DB row is the source of truth.
TWITCH_ACCESS_TOKEN = env('TWITCH_ACCESS_TOKEN', default='')
TWITCH_REFRESH_TOKEN = env('TWITCH_REFRESH_TOKEN', default='')
TWITCH_BROADCASTER_ID = env('TWITCH_BROADCASTER_ID', default='')

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

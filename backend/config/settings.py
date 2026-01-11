"""
Django settings for Atlas - Sistema de Gestão de Clientes LGPD
"""

import os
from datetime import timedelta
from pathlib import Path

import dj_database_url

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# ===========================================
# SECURITY SETTINGS
# ===========================================

SECRET_KEY = os.environ.get('SECRET_KEY', 'django-insecure-change-me')
DEBUG = os.environ.get('DEBUG', 'True').lower() in ('true', '1', 'yes')
ALLOWED_HOSTS = os.environ.get('ALLOWED_HOSTS', 'localhost,127.0.0.1').split(',')

# Adicionar hosts ngrok automaticamente em modo DEBUG
if DEBUG:
    ALLOWED_HOSTS += ['.ngrok-free.app', '.ngrok.io']

# URL do Frontend (para geração de links de validação de documentos)
FRONTEND_URL = os.environ.get('FRONTEND_URL', 'http://localhost:3000')

# ===========================================
# APPLICATION DEFINITION
# ===========================================

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # Third party apps
    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',
    'corsheaders',
    'simple_history',
    'django_filters',
    
    # Local apps
    'apps.accounts',
    'apps.core',
    'apps.empresa',
    'apps.titulares',
    'apps.contratos',
    'apps.ordem_servico',
]

# Debug toolbar only in development
if DEBUG:
    INSTALLED_APPS += [
        'debug_toolbar',
        'django_extensions',
    ]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'simple_history.middleware.HistoryRequestMiddleware',
]

if DEBUG:
    MIDDLEWARE.insert(0, 'debug_toolbar.middleware.DebugToolbarMiddleware')

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'

# ===========================================
# DATABASE
# ===========================================

DATABASE_URL = os.environ.get('DATABASE_URL', 'sqlite:///db.sqlite3')
DATABASES = {
    'default': dj_database_url.parse(DATABASE_URL, conn_max_age=600)
}

# ===========================================
# CACHE
# ===========================================
# Para produção sem VNET no Azure Container Apps, usamos cache local em memória.
# Redis só funciona com VNET configurada ou usando Azure Cache for Redis.
# Para 10 usuários simultâneos, cache local é suficiente.

REDIS_URL = os.environ.get('REDIS_URL', '')

if REDIS_URL:
    CACHES = {
        'default': {
            'BACKEND': 'django.core.cache.backends.redis.RedisCache',
            'LOCATION': REDIS_URL,
            'OPTIONS': {
                'socket_connect_timeout': 5,
                'socket_timeout': 5,
            }
        }
    }
else:
    # Fallback: cache local em memória (adequado para poucos usuários)
    CACHES = {
        'default': {
            'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
            'LOCATION': 'atlas-cache',
        }
    }

# ===========================================
# CELERY (preparado para futuro)
# ===========================================

CELERY_BROKER_URL = os.environ.get('CELERY_BROKER_URL', 'redis://localhost:6379/1')
CELERY_RESULT_BACKEND = CELERY_BROKER_URL
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = 'America/Sao_Paulo'

# ===========================================
# PASSWORD VALIDATION
# ===========================================

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# ===========================================
# INTERNATIONALIZATION
# ===========================================

LANGUAGE_CODE = 'pt-br'
TIME_ZONE = 'America/Sao_Paulo'
USE_I18N = True
USE_TZ = True

# Diretórios de traduções
LOCALE_PATHS = [
    BASE_DIR / 'locale',
]

# ===========================================
# STATIC & MEDIA FILES
# ===========================================

STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_DIRS = [
    BASE_DIR / 'static',
]
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# ===========================================
# DEFAULT PRIMARY KEY
# ===========================================

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# ===========================================
# AUTHENTICATION
# ===========================================

AUTH_USER_MODEL = 'accounts.User'

AUTHENTICATION_BACKENDS = [
    # Backend customizado do Atlas (usa auth_group nativo para Cargos)
    'apps.accounts.backends.AtlasPermissionBackend',
]

# ===========================================
# REST FRAMEWORK
# ===========================================

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
    'DEFAULT_PAGINATION_CLASS': 'config.pagination.SafePageNumberPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle'
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '100/hour',
        'user': '1000/hour'
    },
    # Exception handler customizado para mensagens padronizadas
    'EXCEPTION_HANDLER': 'apps.core.exceptions.custom_exception_handler',
    # Date formats - ISO 8601 sem timezone para DateField
    'DATE_FORMAT': '%Y-%m-%d',
    'DATE_INPUT_FORMATS': ['%Y-%m-%d', '%d/%m/%Y'],
    'DATETIME_FORMAT': '%Y-%m-%dT%H:%M:%S%z',
    'DATETIME_INPUT_FORMATS': ['%Y-%m-%dT%H:%M:%S%z', '%Y-%m-%dT%H:%M:%S'],
}

# ===========================================
# SIMPLE JWT
# ===========================================

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=int(os.environ.get('ACCESS_TOKEN_LIFETIME_MINUTES', 60))),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=int(os.environ.get('REFRESH_TOKEN_LIFETIME_DAYS', 7))),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': True,
    'AUTH_HEADER_TYPES': ('Bearer',),
    'AUTH_HEADER_NAME': 'HTTP_AUTHORIZATION',
}

# ===========================================
# CORS SETTINGS
# ===========================================

CORS_ALLOWED_ORIGINS = os.environ.get(
    'CORS_ALLOWED_ORIGINS', 
    'http://localhost:3000,http://127.0.0.1:3000'
).split(',')

CORS_ALLOW_CREDENTIALS = True

# Permitir origens que correspondem a padrões (útil para ngrok, etc.)
CORS_ALLOWED_ORIGIN_REGEXES = [
    r"^https://.*\.ngrok-free\.app$",
    r"^https://.*\.ngrok\.io$",
]

# Permitir todos os headers e métodos necessários
CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
    'x-active-sistema',
    'ngrok-skip-browser-warning',
]

CORS_ALLOW_METHODS = [
    'DELETE',
    'GET',
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
]

# Em modo DEBUG, permitir todas as origens (facilita desenvolvimento)
if DEBUG:
    CORS_ALLOW_ALL_ORIGINS = True

# CSRF Trusted Origins (necessário para Django 4.0+)
CSRF_TRUSTED_ORIGINS = os.environ.get(
    'CSRF_TRUSTED_ORIGINS',
    'http://localhost:3000,http://127.0.0.1:3000,http://localhost:8000,http://127.0.0.1:8000'
).split(',')

# Adicionar padrões ngrok ao CSRF trusted origins
CSRF_TRUSTED_ORIGINS += [
    'https://*.ngrok-free.app',
    'https://*.ngrok.io',
]

# ===========================================
# DEBUG TOOLBAR
# ===========================================

INTERNAL_IPS = ['127.0.0.1', 'localhost']

# Para funcionar com Docker
if DEBUG:
    import socket
    hostname, _, ips = socket.gethostbyname_ex(socket.gethostname())
    INTERNAL_IPS += [ip[: ip.rfind(".")] + ".1" for ip in ips]

# ===========================================
# LOGGING
# ===========================================

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': os.environ.get('DJANGO_LOG_LEVEL', 'INFO'),
            'propagate': False,
        },
    },
}

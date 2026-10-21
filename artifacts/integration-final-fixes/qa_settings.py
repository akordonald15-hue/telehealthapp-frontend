from telehealth_backend.settings import *  # noqa: F403

# Imported only by this disposable Docker QA project, never deployment settings.
CELERY_TASK_ALWAYS_EAGER = True
CELERY_TASK_EAGER_PROPAGATES = True
CELERY_BROKER_URL = "memory://"
CELERY_RESULT_BACKEND = "cache+memory://"
EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"
if not TESTING:  # noqa: F405
    EMAIL_BACKEND = "django.core.mail.backends.filebased.EmailBackend"
    EMAIL_FILE_PATH = "/qa/mailbox"
EMAIL_PROVIDER = "smtp"
CARETEKK_SMS_ENABLED = False
USE_S3 = False
PASSWORD_HASHERS = ["django.contrib.auth.hashers.MD5PasswordHasher"]
if TESTING:  # noqa: F405
    PAYMENT_PROVIDER = "paystack"  # Existing provider unit tests mock outbound calls.
REST_FRAMEWORK = {**REST_FRAMEWORK, "DEFAULT_THROTTLE_RATES": {  # noqa: F405
    **REST_FRAMEWORK.get("DEFAULT_THROTTLE_RATES", {}),  # noqa: F405
    "anon": "10000/hour", "user": "10000/hour",
}}

# Initialize the existing Celery application for eager, isolated task execution.
from telehealth_backend.celery import app

app.set_default()
from telehealth_backend.asgi import application  # noqa: E402,F401

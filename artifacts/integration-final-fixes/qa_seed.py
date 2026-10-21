"""Only run inside the disposable QA database defined in compose.qa.yml."""
import json
from django.conf import settings
from django.utils import timezone
from datetime import timedelta
from apps.authentication.models import User
from apps.profiles.models import DoctorProfile, NurseProfile, Specialty
from apps.appointments.models import AvailabilitySlot
from apps.homecare.models import HomeCareService

assert settings.DATABASES["default"]["NAME"] == "caretekk_release_qa"
import boto3
storage = boto3.client("s3", endpoint_url="http://minio:9000", aws_access_key_id="local-qa-only", aws_secret_access_key="local-qa-storage-password", region_name="us-east-1")
if "caretekk-release-qa" not in [bucket["Name"] for bucket in storage.list_buckets()["Buckets"]]:
    storage.create_bucket(Bucket="caretekk-release-qa")
password = "Local-QA-Only-2026!"
ids = {}
for role, email in [
    ("admin", "qa-admin@caretekk.invalid"),
    ("doctor", "qa-clinician@caretekk.invalid"),
    ("nurse", "qa-nurse@caretekk.invalid"),
]:
    user, _ = User.objects.get_or_create(email=email, defaults={"role": role})
    user.set_password(password)
    user.is_active = True
    user.is_email_verified = True
    user.full_name = f"Release QA {role}"
    user.phone = "+2348012345678"
    user.is_staff = role == "admin"
    user.is_superuser = role == "admin"
    user.save()
    ids[role] = user.id
    if role == "doctor":
        profile, _ = DoctorProfile.objects.get_or_create(user=user, defaults={"license_no": "QA-NOT-REAL-DOCTOR"})
        profile.specialties.add(Specialty.objects.get_or_create(name="General Practice")[0])
        profile.clinic_name = "Release QA Clinic"
        profile.save()
        ids["doctor_profile"] = profile.id
        start = (timezone.now() + timedelta(days=1)).replace(hour=10, minute=0, second=0, microsecond=0)
        AvailabilitySlot.objects.get_or_create(doctor=profile, start_at=start, end_at=start + timedelta(hours=1))
        ids["scheduled_at"] = start.isoformat()
    if role == "nurse":
        profile, _ = NurseProfile.objects.get_or_create(user=user, defaults={"license_no": "QA-NOT-REAL-NURSE"})
        profile.onboarding_status = "approved"
        profile.active_for_dispatch = True
        profile.service_zone = "eket"
        profile.service_type = "Home Nursing Visit"
        profile.save()
        ids["nurse_profile"] = profile.id
service = HomeCareService.objects.filter(zone="eket", is_active=True).first()
if not service:
    service = HomeCareService.objects.create(name="Home Nursing Visit", zone="eket", price="5000.00")
ids["homecare_service"] = service.id
print("QA_FIXTURES=" + json.dumps(ids))

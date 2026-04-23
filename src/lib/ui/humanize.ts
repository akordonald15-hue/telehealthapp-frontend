import type { AuditEvent, MedicalRecord, Message, UserRole } from "@/lib/types/backend";

function titleize(value: string) {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function conversationTitle(role?: UserRole) {
  if (role === "patient") {
    return "Conversation with your care team";
  }
  if (role === "doctor") {
    return "Patient conversation";
  }
  return "Care conversation";
}

export function conversationSummary(role?: UserRole) {
  if (role === "patient") {
    return "You and your care team";
  }
  if (role === "doctor") {
    return "Shared with the patient";
  }
  return "Care team conversation";
}

export function messageSenderLabel(message: Message, currentUserId?: number | null) {
  if (currentUserId && message.sender === currentUserId) {
    return "You";
  }

  return "Care team";
}

export function appointmentCompanionLabel(role?: UserRole) {
  if (role === "patient") {
    return "Assigned doctor";
  }
  if (role === "doctor") {
    return "Scheduled patient visit";
  }
  return "Scheduled consultation";
}

export function medicalRecordTitle(record: MedicalRecord) {
  return record.appointment ? "Medical record for your visit" : "Medical record";
}

export function medicalRecordSummary(record: MedicalRecord, role?: UserRole) {
  if (role === "patient") {
    return record.doctor ? "Shared by your care team" : "Added to your record";
  }
  if (role === "doctor") {
    return "Patient care note";
  }
  return record.doctor ? "Care team record" : "Medical record";
}

export function referralSummary(role?: UserRole) {
  if (role === "patient") {
    return "Shared with your care team";
  }
  if (role === "doctor") {
    return "Prepared for follow-up care";
  }
  return "Referral activity";
}

export function paymentSummary(provider: string, role?: UserRole) {
  const label = provider ? titleize(provider) : "Payment";
  if (role === "patient") {
    return label;
  }
  if (role === "admin") {
    return `${label} payment`;
  }
  return label;
}

export function humanizeAuditAction(action: string) {
  const normalized = action.toLowerCase();

  switch (normalized) {
    case "login_success":
      return "Sign-in completed";
    case "login_failed":
      return "Sign-in attempt blocked";
    case "referral_created":
      return "Referral created";
    case "referral_status_changed":
      return "Referral status updated";
    case "referral_updated":
      return "Referral details updated";
    case "referral_sent":
      return "Referral sent";
    case "referral_email_failed":
      return "Referral delivery needs attention";
    case "payment_initiated":
      return "Payment started";
    case "payment_webhook_processed":
      return "Payment confirmed";
    case "medical_record_created":
      return "Medical record added";
    case "medical_file_uploaded":
      return "Medical file added";
    case "appointment_created":
      return "Appointment booked";
    case "appointment_cancelled":
      return "Appointment cancelled";
    default:
      return titleize(normalized);
  }
}

export function humanizeAuditObject(objectType: string) {
  const normalized = objectType.toLowerCase();

  switch (normalized) {
    case "referral":
      return "Referral";
    case "medicalrecord":
    case "medical_record":
      return "Medical record";
    case "medicalfile":
    case "medical_file":
      return "Medical file";
    case "appointment":
      return "Appointment";
    case "payment":
      return "Payment";
    case "thread":
      return "Conversation";
    case "message":
      return "Message";
    case "triage":
    case "triagesession":
      return "Triage session";
    default:
      return titleize(normalized);
  }
}

export function humanizeAuditSubtitle(event: AuditEvent) {
  const objectLabel = humanizeAuditObject(event.object_type);
  const actorLabel = event.actor ? "Updated by a signed-in team member" : "Recorded automatically";
  return `${objectLabel} · ${actorLabel}`;
}

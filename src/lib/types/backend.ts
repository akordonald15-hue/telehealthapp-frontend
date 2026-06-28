export type UserRole = "patient" | "doctor" | "nurse" | "admin";

export type User = {
  id: number;
  email: string;
  full_name: string;
  phone: string;
  role: UserRole;
  must_change_password: boolean;
  created_at: string;
  updated_at: string;
};

export type RegisterResponse = Pick<User, "id" | "email" | "phone" | "role">;

export type TokenPair = {
  access: string;
  refresh?: string;
};

export type DetailResponse = {
  detail: string;
};

export type PasswordResetVerifyResponse = DetailResponse & {
  reset_token: string;
  expires_at: string;
};

export type ProviderSetupVerifyResponse = DetailResponse & {
  email: string;
  name: string;
  role: "doctor" | "nurse";
  expires_at: string;
};

export type BackendErrorPayload = {
  error?: string;
  message?: string | Record<string, string[] | string> | unknown[];
  detail?: string;
  request_id?: string;
  timestamp?: string;
};

export type PaginatedResponse<T> = {
  count?: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

export type Specialty = {
  id: number;
  name: string;
};

export type ProviderAvailabilityStatus = "available" | "unavailable" | "busy" | "on_visit" | "offline" | "on_break";

export type PatientProfile = {
  id: number;
  full_name?: string;
  email?: string;
  phone?: string;
  dob: string | null;
  gender: string;
  state?: string;
  lga?: string;
  address: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  medical_history: Record<string, unknown>;
  profile_complete?: boolean;
};

export type DoctorProfile = {
  id: number;
  license_no: string;
  clinic_name: string;
  bio: string;
  years_experience: number;
  availability_status: ProviderAvailabilityStatus;
  preferred_availability_status: ProviderAvailabilityStatus;
  last_active_at: string | null;
  specialties: Specialty[];
  rating?: number | null;
  review_count?: number;
  completed_consultations?: number;
  rating_breakdown?: RatingBreakdown;
};

export type NurseProfile = {
  id: number;
  license_no: string;
  onboarding_status: "pending" | "approved" | "suspended";
  availability_status: ProviderAvailabilityStatus;
  preferred_availability_status: ProviderAvailabilityStatus;
  service_radius_km: number;
  service_type: string;
  service_zone: HomeCareZone | "";
  service_zone_label?: string;
  base_address: string;
  base_latitude: string | null;
  base_longitude: string | null;
  active_for_dispatch: boolean;
  last_active_at: string | null;
  rating?: number | null;
  review_count?: number;
  completed_visits?: number;
  rating_breakdown?: RatingBreakdown;
};

export type ProviderAvailabilityState = {
  provider_type: "doctor" | "nurse";
  availability_status: ProviderAvailabilityStatus;
  preferred_availability_status: ProviderAvailabilityStatus;
  last_active_at: string | null;
  active_workload_count: number;
  active_job_label: string;
  can_self_update: boolean;
  blocked_reason: string;
  allowed_statuses: ProviderAvailabilityStatus[];
};

export type MedicalFile = {
  id: number;
  s3_key: string;
  filename: string;
  content_type: string;
  size_bytes: number;
  created_at: string;
};

export type MedicalRecord = {
  id: number;
  patient: number;
  doctor: number | null;
  appointment: number | null;
  notes: string;
  created_at: string;
  files: MedicalFile[];
};

export type MedicalFileUploadInit = {
  upload_url: string;
  file_id: number;
};

export type MedicalFileDownload = {
  download_url: string;
};

export type CarePlan = {
  id: number;
  patient: number;
  patient_name?: string;
  doctor: number;
  doctor_name?: string;
  appointment: number | null;
  appointment_scheduled_at?: string | null;
  complaint_summary: string;
  assessment_note: string;
  care_steps: string;
  medications: string;
  lifestyle_advice: string;
  referral_recommendation: string;
  follow_up_date: string | null;
  warning_signs: string;
  created_at: string;
  updated_at: string;
};

export type AppointmentStatus =
  | "pending_payment"
  | "awaiting_payment_verification"
  | "payment_rejected"
  | "confirmed"
  | "scheduled"
  | "accepted"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "missed";

export type AppointmentRating = {
  id: number;
  score: number;
  feedback: string;
  created_at: string;
};

export type Appointment = {
  id: number;
  patient: number;
  doctor: number;
  triage_session?: number | null;
  triage_summary?: {
    label: string;
    symptoms: string[];
    duration: string;
    severity: string;
    risk_level: string;
    recommendation: string;
    department: string;
    red_flags: string[];
    possible_causes?: string[];
    urgency_guidance?: string[];
    self_care_guidance?: string[];
    created_at: string;
    disclaimer: string;
  } | null;
  patient_profile?: {
    id: number;
    display_name: string;
    email?: string;
    phone?: string;
    dob?: string | null;
    gender?: string;
    state?: string;
    lga?: string;
  };
  doctor_profile?: {
    id: number;
    display_name: string;
  };
  scheduled_at: string;
  status: AppointmentStatus;
  reason: string;
  notes: string;
  rating?: AppointmentRating | null;
};

export type AvailabilitySlot = {
  id: number;
  doctor: number;
  start_at: string;
  end_at: string;
  is_booked: boolean;
};

export type Thread = {
  id: number;
  thread_id?: number;
  patient: number;
  doctor: number;
  patient_profile?: {
    id: number;
    display_name: string;
    email?: string;
  };
  doctor_profile?: {
    id: number;
    display_name: string;
    specialty?: string;
    specialties?: string[];
  };
  appointment?: {
    id: number;
    status: AppointmentStatus | string;
    scheduled_at: string;
  } | null;
  last_message?: {
    id: number;
    body: string;
    sender: number;
    sender_role: UserRole;
    sender_name: string;
    created_at: string;
  } | null;
  unread_count?: number;
  updated_at?: string;
  consultation_status?: string;
  consultation_lifecycle_status?: "open" | "doctor_ended" | "expired" | "disputed" | "resolved";
  consultation_started_at?: string | null;
  consultation_expires_at?: string | null;
  ended_at?: string | null;
  can_send_messages?: boolean;
  can_end_consultation?: boolean;
  can_raise_dispute?: boolean;
  latest_dispute?: {
    id: number;
    reason_category: string;
    review_status: string;
    created_at: string;
  } | null;
  triage_summary?: {
    label: string;
    symptoms: string[];
    duration: string;
    severity: string;
    risk_level: string;
    recommendation: string;
    department: string;
    red_flags: string[];
    possible_causes?: string[];
    urgency_guidance?: string[];
    self_care_guidance?: string[];
    created_at: string;
    disclaimer: string;
  } | null;
  created_at: string;
};

export type ConsultationDispute = {
  id: number;
  thread: number;
  reason_category: string;
  explanation: string;
  review_status: string;
  created_at: string;
  updated_at: string;
};

export type Message = {
  id: number;
  thread: number;
  sender: number;
  body: string;
  attachment_url: string;
  attachment_kind?: "file" | "image" | "voice" | "";
  attachment_filename?: string;
  attachment_content_type?: string;
  attachment_size_bytes?: number;
  attachment_duration_seconds?: number | null;
  created_at: string;
  read_at: string | null;
};

export type ProviderDoctor = DoctorProfile & {
  display_name: string;
  profile_image_url: string | null;
  rating: number | null;
  review_count?: number;
  completed_consultations?: number;
  rating_breakdown?: RatingBreakdown;
  active_workload: number;
  next_available_time: string | null;
  updated_at: string;
};

export type ProviderNurse = {
  id: number;
  display_name: string;
  specialty: string;
  service_type: string;
  profile_image_url: string | null;
  rating: number | null;
  review_count?: number;
  completed_visits?: number;
  rating_breakdown?: RatingBreakdown;
  availability_status: ProviderAvailabilityStatus;
  service_radius_km: number;
  service_zone: HomeCareZone | "";
  service_zone_label?: string;
  location_area: string;
  active_workload: number;
  updated_at: string;
};

export type RatingBreakdown = Record<string, { count: number; percentage: number }>;

export type MessageAttachmentUploadInit = {
  upload_url: string;
  attachment_id: number;
  attachment_url: string;
};

export type HomeCareBookingSource = "direct" | "doctor_referral";
export type HomeCareZone = "eket" | "uyo";
export type HomeCareService = {
  id: number;
  name: string;
  zone: HomeCareZone;
  zone_label: string;
  description: string;
  price: string;
  is_active: boolean;
};
export type HomeCareRequestStatus =
  | "requested"
  | "awaiting_payment"
  | "awaiting_payment_verification"
  | "payment_rejected"
  | "matching"
  | "assigned"
  | "accepted"
  | "verification_in_progress"
  | "confirmed"
  | "in_transit"
  | "arrived"
  | "care_in_progress"
  | "care_completed"
  | "patient_confirmed"
  | "match_failed"
  | "awaiting_patient_confirmation"
  | "unreachable"
  | "cancelled";

export type HomeCareAssignmentStatus = "pending" | "accepted" | "declined" | "reassigned" | "cancelled" | "completed";

export type HomeCareNurseSummary = {
  id: number;
  display_name: string;
  availability_status: NurseProfile["availability_status"];
};

export type HomeCareAssignment = {
  id: number;
  request: number;
  nurse: HomeCareNurseSummary;
  status: HomeCareAssignmentStatus;
  status_reason: string;
  match_score: string;
  accepted_at: string | null;
  declined_at: string | null;
  trip_started_at: string | null;
  arrived_at: string | null;
  care_started_at: string | null;
  care_completed_at: string | null;
  closed_at: string | null;
  is_current: boolean;
  created_at: string;
  updated_at: string;
};

export type HomeCareRequestListItem = {
  id: number;
  booking_source: HomeCareBookingSource;
  status: HomeCareRequestStatus;
  service: number | null;
  service_name_snapshot: string;
  service_price_snapshot: string | null;
  service_zone: string;
  contact_name_snapshot: string;
  contact_phone_snapshot: string;
  service_address_snapshot: string;
  requested_window_start: string | null;
  requested_window_end: string | null;
  current_assignment: HomeCareAssignment | null;
  created_at: string;
  updated_at: string;
};

export type HomeCareRequestDetail = HomeCareRequestListItem & {
  patient: number;
  referral: number | null;
  service_location_notes: string;
  service_latitude: string | null;
  service_longitude: string | null;
  care_notes: string;
  source_snapshot: Record<string, unknown>;
  cancel_reason: string;
};

export type HomeCareRequestCreate = {
  booking_source: HomeCareBookingSource;
  referral?: number | null;
  service?: number | null;
  service_zone?: string;
  preferred_nurse?: number | null;
  contact_name_snapshot?: string;
  contact_phone_snapshot?: string;
  service_address_snapshot?: string;
  service_location_notes?: string;
  service_latitude?: string | null;
  service_longitude?: string | null;
  requested_window_start?: string | null;
  requested_window_end?: string | null;
  care_notes?: string;
};

export type HomeCareRequestEvent = {
  id: number;
  event_type: string;
  from_status: string;
  to_status: string;
  metadata: Record<string, unknown>;
  actor: number | null;
  actor_email: string | null;
  assignment: number | null;
  created_at: string;
};

export type HomeCareTrackingPoint = {
  id: number;
  latitude: string;
  longitude: string;
  accuracy_meters: number;
  source: string;
  created_at: string;
};

export type HomeCareRating = {
  id: number;
  score: number;
  feedback: string;
  created_at: string;
};

export type PaymentProvider = "paystack" | "flutterwave" | "bank_transfer";
export type PaymentStatus =
  | "pending"
  | "awaiting_transfer"
  | "transfer_submitted"
  | "awaiting_manual_verification"
  | "success"
  | "rejected"
  | "failed"
  | "cancelled"
  | "refunded";

export type BankTransferDetails = {
  bank_name: string;
  account_name: string;
  account_number: string;
  instructions: string;
  reference: string;
};

export type Payment = {
  id: number;
  patient: number;
  patient_name?: string;
  patient_phone?: string;
  appointment: number | null;
  homecare_request: number | null;
  provider: string;
  amount: string;
  currency: string;
  status: PaymentStatus;
  external_ref: string;
  provider_reference: string;
  transfer_notified_at?: string | null;
  manual_reviewed_at?: string | null;
  manual_review_note?: string;
  bank_transfer?: BankTransferDetails | null;
};

export type PaymentInitiation = {
  payment_id: number;
  provider: string;
  amount: string;
  currency: string;
  status: PaymentStatus;
  appointment_id: number | null;
  homecare_request_id: number | null;
  authorization_url: string | null;
  external_ref: string;
  initialization_status?: string;
  transfer_notified_at?: string | null;
  bank_transfer?: BankTransferDetails | null;
  can_submit_transfer_notification?: boolean;
};

export type AppointmentBookingResponse = {
  appointment: Appointment;
  payment: PaymentInitiation;
};

export type HomeCareBookingResponse = {
  request: HomeCareRequestDetail;
  payment: PaymentInitiation;
};

export type Refund = {
  id: number;
  payment: number;
  amount: string;
  status: "pending" | "success" | "failed";
  provider_reference: string;
  created_at: string;
};

export type ProviderLedgerStatus =
  | "pending"
  | "available"
  | "payout_requested"
  | "approved"
  | "paid"
  | "disputed"
  | "refunded"
  | "cancelled";

export type ProviderWalletDashboard = {
  wallet_id: number;
  provider_type: "doctor" | "nurse";
  currency: string;
  pending_balance: string;
  available_balance: string;
  payout_requested_balance: string;
  paid_out_balance: string;
  disputed_balance: string;
  refunded_balance: string;
  lifetime_net_earning: string;
  next_available_at: string | null;
};

export type ProviderLedgerEntry = {
  id: number;
  account: number;
  account_type: string;
  wallet: number | null;
  direction: "debit" | "credit";
  amount: string;
  currency: string;
  description: string;
  created_at: string;
};

export type ProviderLedgerTransaction = {
  id: number;
  transaction_type: string;
  status: ProviderLedgerStatus;
  idempotency_key: string;
  source_payment: number | null;
  source_appointment: number | null;
  source_homecare_request: number | null;
  source_refund: number | null;
  created_by: number | null;
  metadata: Record<string, unknown>;
  created_at: string;
  entries: ProviderLedgerEntry[];
};

export type ProviderPayoutRequest = {
  id: number;
  wallet: number;
  provider_type: "doctor" | "nurse";
  amount: string;
  currency: string;
  status: "pending" | "approved" | "paid" | "cancelled";
  requested_by: number;
  approved_by: number | null;
  cancelled_by: number | null;
  created_at: string;
  approved_at: string | null;
  cancelled_at: string | null;
  notes: string;
};

export type ReferralStatus = "pending" | "reviewed" | "contacted" | "completed" | "cancelled";

export type Referral = {
  id: number;
  patient: number;
  patient_name?: string;
  doctor: number;
  doctor_name?: string;
  appointment?: number | null;
  appointment_scheduled_at?: string | null;
  referred_to: string;
  notes: string;
  status: ReferralStatus;
  created_at?: string;
  updated_at?: string;
};

export type AuditEvent = {
  id: number;
  actor: number | null;
  action: string;
  object_type: string;
  object_id: string;
  ip_address: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type AdminAuditLog = {
  id: number;
  actor: number | null;
  action: string;
  object_type: string;
  object_id: string;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type AdminDashboardMetricOverview = {
  total_patients: number;
  total_doctors: number;
  total_nurses: number;
  active_consultations: number;
  active_homecare_requests: number;
  completed_consultations: number;
  completed_homecare_visits: number;
  total_platform_revenue: string;
  pending_provider_earnings: string;
  total_provider_payouts: string;
  failed_payments: number;
  refunded_payments: number;
  unresolved_disputes: number;
};

export type AdminDashboardResponse = {
  overview: AdminDashboardMetricOverview;
  operations: {
    appointments_today: number;
    homecare_today: number;
    open_threads: number;
    pending_refunds: number;
    recent_audit_events: number;
  };
  analytics: {
    daily_bookings: Array<{ source: "appointments" | "homecare"; date: string; count: number }>;
    weekly_revenue: Array<{ week: string; amount: string }>;
    top_doctors: Array<{
      id: number;
      email: string;
      display_name: string;
      completed_consultations: number;
      active_consultations: number;
      availability_status: ProviderAvailabilityStatus;
    }>;
    top_nurses: Array<{
      id: number;
      email: string;
      completed_visits: number;
      active_requests: number;
      rating: number | null;
      availability_status: ProviderAvailabilityStatus;
      onboarding_status: NurseProfile["onboarding_status"];
    }>;
    appointment_cancellation_rate: number;
    homecare_cancellation_rate: number;
  };
};

export type AdminUser = User & {
  is_active: boolean;
  is_email_verified: boolean;
  is_staff: boolean;
  profile_id: number | null;
  provider_status: string | null;
  availability_status: ProviderAvailabilityStatus | null;
};

export type AdminProvider = {
  provider_type: "doctor" | "nurse";
  id: number;
  user_email: string;
  display_name: string;
  availability_status: ProviderAvailabilityStatus;
  is_active: boolean;
  onboarding_status: string | null;
  active_for_dispatch: boolean | null;
  service_zone?: HomeCareZone | "" | null;
  service_zone_label?: string | null;
  base_address?: string | null;
  active_workload: number;
  active_job_label: string;
  completed_workload: number;
  rating: number | null;
  last_active_at: string | null;
  updated_at: string;
};

export type AdminProviderCreateResponse = {
  detail: string;
  provider_type: "doctor" | "nurse";
  provider_id: number;
  user_id: number;
  email: string;
  password_setup_sent: boolean;
};

export type TriageSeverity = "mild" | "moderate" | "severe";
export type TriageSessionStatus =
  | "started"
  | "in_progress"
  | "analyzed"
  | "completed"
  | "closed"
  | "processing";

export type TriageSession = {
  id: number;
  status: TriageSessionStatus;
  created_at: string;
  updated_at: string;
  disclaimer?: string;
  task_id?: string;
};

export type TriageSymptomSubmitResponse = {
  session_id: number;
  status: string;
  symptoms_saved: number;
  disclaimer: string;
};

export type TriageProcessingResponse = {
  session_id?: number;
  conversation_id?: string;
  status: string;
  detail?: string;
  task_id?: string;
  task_status?: string;
  result_url?: string;
  disclaimer: string;
};

export type TriageQuestion = {
  id: number;
  question_text: string;
  symptom: string;
  department: string;
  priority: number;
  is_emergency_related: boolean;
};

export type TriageReport = {
  id: number;
  session: number;
  recommended_department: string | null;
  risk_level: "low" | "medium" | "high";
  risk_score: number;
  summary: string;
  raw_symptoms: unknown[];
  recommended_doctors: unknown[];
  disclaimer: string;
  created_at: string;
};

export type TriageConversation = {
  id: string;
  session: number;
  status: "active" | "completed";
  started_at: string;
  completed_at: string | null;
};

export type TriageConversationStart = {
  conversation: TriageConversation;
  disclaimer: string;
  task_id: string;
  status: string;
};

export type TriageConversationMessageResponse = {
  conversation_id: string;
  session_id: number;
  status: string;
  task_id: string;
  result_url: string;
  extracted_symptoms: unknown[];
  risk_score: number | null;
  risk_level: string | null;
  department: string | null;
  emergency: Record<string, unknown> | null;
  next_question: TriageQuestion | null;
  disclaimer: string;
};

export type TriageAnswer = {
  id: number;
  question: TriageQuestion;
  answer_text: string;
  created_at: string;
};

export type TriageAnswerResponse = {
  conversation_id: string;
  answer: TriageAnswer;
  next_question: TriageQuestion | null;
  disclaimer: string;
};

export type TriageConversationResult = {
  conversation: string;
  status: "processing" | "completed" | "failed";
  task_id: string;
  extracted_symptoms: unknown[];
  risk_score: number;
  risk_level: string;
  department: string;
  emergency: Record<string, unknown>;
  next_question: TriageQuestion | null;
  summary_preview: string;
  error: string;
  updated_at: string;
  disclaimer: string;
};

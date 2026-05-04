export type UserRole = "patient" | "doctor" | "nurse" | "admin";

export type User = {
  id: number;
  email: string;
  phone: string;
  role: UserRole;
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

export type ProviderAvailabilityStatus = "available" | "unavailable" | "busy" | "offline" | "on_break";

export type PatientProfile = {
  id: number;
  dob: string | null;
  gender: string;
  address: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  medical_history: Record<string, unknown>;
};

export type DoctorProfile = {
  id: number;
  license_no: string;
  clinic_name: string;
  bio: string;
  years_experience: number;
  availability_status: ProviderAvailabilityStatus;
  specialties: Specialty[];
};

export type NurseProfile = {
  id: number;
  license_no: string;
  onboarding_status: "pending" | "approved" | "suspended";
  availability_status: ProviderAvailabilityStatus;
  service_radius_km: number;
  base_address: string;
  base_latitude: string | null;
  base_longitude: string | null;
  active_for_dispatch: boolean;
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

export type AppointmentStatus = "scheduled" | "completed" | "cancelled";

export type Appointment = {
  id: number;
  patient: number;
  doctor: number;
  scheduled_at: string;
  status: AppointmentStatus;
  reason: string;
  notes: string;
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
  patient: number;
  doctor: number;
  created_at: string;
};

export type Message = {
  id: number;
  thread: number;
  sender: number;
  body: string;
  attachment_url: string;
  created_at: string;
  read_at: string | null;
};

export type ProviderDoctor = DoctorProfile & {
  user_email: string;
  display_name: string;
  profile_image_url: string | null;
  qualification: string;
  rating: number | null;
  active_workload: number;
  next_available_time: string | null;
  updated_at: string;
};

export type ProviderNurse = {
  id: number;
  user_email: string;
  display_name: string;
  license_no: string;
  specialty: string;
  service_type: string;
  profile_image_url: string | null;
  rating: number | null;
  availability_status: ProviderAvailabilityStatus;
  onboarding_status: NurseProfile["onboarding_status"];
  active_for_dispatch: boolean;
  service_radius_km: number;
  location_area: string;
  base_latitude: string | null;
  base_longitude: string | null;
  active_workload: number;
  updated_at: string;
};

export type MessageAttachmentUploadInit = {
  upload_url: string;
  attachment_id: number;
  attachment_url: string;
};

export type HomeCareBookingSource = "direct" | "doctor_referral";
export type HomeCareRequestStatus =
  | "requested"
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
  user_email: string;
  license_no: string;
  availability_status: NurseProfile["availability_status"];
  active_for_dispatch: boolean;
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

export type PaymentProvider = "paystack" | "flutterwave";
export type PaymentStatus = "pending" | "success" | "failed" | "refunded";

export type Payment = {
  id: number;
  patient: number;
  appointment: number | null;
  homecare_request: number | null;
  provider: string;
  amount: string;
  currency: string;
  status: PaymentStatus;
  external_ref: string;
  provider_reference: string;
};

export type PaymentInitiation = {
  payment_id: number;
  provider: string;
  amount: string;
  currency: string;
  appointment_id: number | null;
  homecare_request_id: number | null;
  authorization_url: string | null;
  external_ref: string;
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

export type ReferralStatus = "draft" | "sent";

export type Referral = {
  id: number;
  patient: number;
  doctor: number;
  referred_to: string;
  notes: string;
  status: ReferralStatus;
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

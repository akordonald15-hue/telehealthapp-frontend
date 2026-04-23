export type UserRole = "patient" | "doctor" | "admin";

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
  specialties: Specialty[];
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

export type MessageAttachmentUploadInit = {
  upload_url: string;
  attachment_id: number;
  attachment_url: string;
};

export type PaymentProvider = "paystack" | "flutterwave";
export type PaymentStatus = "pending" | "success" | "failed" | "refunded";

export type Payment = {
  id: number;
  patient: number;
  appointment: number | null;
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
  authorization_url: string | null;
  external_ref: string;
};

export type Refund = {
  id: number;
  payment: number;
  amount: string;
  status: "pending" | "success" | "failed";
  provider_reference: string;
  created_at: string;
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

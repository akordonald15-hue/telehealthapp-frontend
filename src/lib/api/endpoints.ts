import { apiList, apiRequest } from "@/lib/api/client";
import type {
  AdminAuditLog,
  Appointment,
  AuditEvent,
  AvailabilitySlot,
  DetailResponse,
  DoctorProfile,
  MedicalFileDownload,
  MedicalFileUploadInit,
  MedicalRecord,
  Message,
  PatientProfile,
  Payment,
  PaymentInitiation,
  Refund,
  Referral,
  RegisterResponse,
  Thread,
  TokenPair,
  TriageAnswerResponse,
  TriageConversationMessageResponse,
  TriageConversationResult,
  TriageConversationStart,
  TriageProcessingResponse,
  TriageReport,
  TriageSession,
  TriageSeverity,
  TriageSymptomSubmitResponse,
  User,
  UserRole,
} from "@/lib/types/backend";

type PublicRegistrationRole = Extract<UserRole, "patient" | "doctor">;

export const authApi = {
  register: (body: { email: string; phone?: string; role: PublicRegistrationRole; password: string }) =>
    apiRequest<RegisterResponse>("/auth/register/", { method: "POST", body, auth: false }),
  login: (body: { email: string; password: string }) =>
    apiRequest<TokenPair>("/auth/login/", { method: "POST", body, auth: false }),
  refresh: (body: { refresh: string }) =>
    apiRequest<TokenPair>("/auth/refresh/", { method: "POST", body, auth: false }),
  logout: (body: { refresh: string }) => apiRequest<DetailResponse>("/auth/logout/", { method: "POST", body }),
  me: () => apiRequest<User>("/auth/me/"),
  updateMe: (body: Partial<Pick<User, "email" | "phone">>) =>
    apiRequest<User>("/auth/me/", { method: "PATCH", body }),
  passwordResetRequest: (body: { email: string }) =>
    apiRequest<DetailResponse>("/auth/password-reset/request/", { method: "POST", body, auth: false }),
  passwordResetConfirm: (body: { token: string; new_password: string }) =>
    apiRequest<DetailResponse>("/auth/password-reset/confirm/", { method: "POST", body, auth: false }),
  emailVerificationRequest: (body: { email: string }) =>
    apiRequest<DetailResponse>("/auth/email/verify/request/", { method: "POST", body: body, auth: false }),
  emailVerificationConfirm: (body: { token: string }) =>
    apiRequest<DetailResponse>("/auth/email/verify/confirm/", { method: "POST", body, auth: false }),
};

export const profilesApi = {
  me: <T extends PatientProfile | DoctorProfile>() => apiRequest<T>("/profiles/me/"),
  updateMe: <T extends PatientProfile | DoctorProfile>(body: Partial<T>) =>
    apiRequest<T>("/profiles/me/", { method: "PATCH", body }),
  doctors: (query?: { page?: number; page_size?: number }) => apiList<DoctorProfile>("/profiles/doctors/", query),
  medicalRecords: (query?: { page?: number; page_size?: number }) =>
    apiList<MedicalRecord>("/profiles/medical-records/", query),
  createMedicalRecord: (body: { patient: number; appointment?: number | null; notes?: string }) =>
    apiRequest<MedicalRecord>("/profiles/medical-records/", { method: "POST", body }),
  medicalRecord: (id: number) => apiRequest<MedicalRecord>(`/profiles/medical-records/${id}/`),
  initMedicalFileUpload: (
    recordId: number,
    body: { filename: string; content_type?: string; size_bytes?: number },
  ) => apiRequest<MedicalFileUploadInit>(`/profiles/medical-records/${recordId}/files/init/`, { method: "POST", body }),
  medicalFileDownload: (fileId: number) =>
    apiRequest<MedicalFileDownload>(`/profiles/medical-files/${fileId}/download/`),
};

export const appointmentsApi = {
  list: (query?: { page?: number; page_size?: number }) => apiList<Appointment>("/appointments/", query),
  create: (body: { doctor: number; scheduled_at: string; status?: string; reason?: string; notes?: string }) =>
    apiRequest<Appointment>("/appointments/", { method: "POST", body }),
  detail: (id: number) => apiRequest<Appointment>(`/appointments/${id}/`),
  update: (id: number, body: Partial<Pick<Appointment, "doctor" | "scheduled_at" | "status" | "reason" | "notes">>) =>
    apiRequest<Appointment>(`/appointments/${id}/`, { method: "PATCH", body }),
  cancel: (id: number) => apiRequest<DetailResponse>(`/appointments/${id}/cancel/`, { method: "POST" }),
  reschedule: (id: number, body: { scheduled_at: string }) =>
    apiRequest<DetailResponse>(`/appointments/${id}/reschedule/`, { method: "POST", body }),
  availability: (query?: { doctor_id?: number; page?: number; page_size?: number }) =>
    apiList<AvailabilitySlot>("/appointments/availability/", query),
};

export const messagingApi = {
  threads: (query?: { page?: number; page_size?: number }) => apiList<Thread>("/messages/threads/", query),
  createThread: (body: { patient?: number; doctor?: number }) =>
    apiRequest<Thread>("/messages/threads/", { method: "POST", body }),
  messages: (threadId: number, query?: { page?: number; page_size?: number }) =>
    apiList<Message>(`/messages/threads/${threadId}/messages/`, query),
  createMessage: (threadId: number, body: { body: string; attachment_url?: string }) =>
    apiRequest<Message>(`/messages/threads/${threadId}/messages/`, { method: "POST", body }),
};

export const paymentsApi = {
  list: (query?: { page?: number; page_size?: number }) => apiList<Payment>("/payments/", query),
  create: (body: { appointment?: number | null; provider: string; amount: string | number; currency?: string }) =>
    apiRequest<Payment>("/payments/", { method: "POST", body }),
  initiate: (body: {
    provider: "paystack" | "flutterwave";
    amount: number;
    currency?: string;
    appointment_id?: number;
    callback_url: string;
  }) => apiRequest<PaymentInitiation>("/payments/initiate/", { method: "POST", body }),
  detail: (id: number) => apiRequest<Payment>(`/payments/${id}/`),
  refund: (body: { payment: number; amount: string | number }) =>
    apiRequest<Refund>("/payments/refunds/", { method: "POST", body }),
};

export const referralsApi = {
  list: (query?: { page?: number; page_size?: number }) => apiList<Referral>("/referrals/", query),
  create: (body: { patient: number; referred_to: string; notes?: string; status?: string }) =>
    apiRequest<Referral>("/referrals/", { method: "POST", body }),
  detail: (id: number) => apiRequest<Referral>(`/referrals/${id}/`),
  update: (id: number, body: Partial<Pick<Referral, "patient" | "referred_to" | "notes" | "status">>) =>
    apiRequest<Referral>(`/referrals/${id}/`, { method: "PATCH", body }),
};

export const auditApi = {
  list: (query?: { page?: number; page_size?: number; action?: string; actor?: number }) =>
    apiList<AuditEvent>("/audit/", query),
  adminLogs: (query?: { page?: number; page_size?: number }) =>
    apiList<AdminAuditLog>("/admin/audit-logs/", query),
};

export const triageApi = {
  start: () => apiRequest<TriageSession>("/triage/start", { method: "POST" }),
  submitSymptoms: (
    sessionId: number,
    body: {
      symptoms: string[];
      severity: TriageSeverity;
      duration?: string;
      age?: number | null;
      gender?: string;
      medical_history?: Record<string, unknown>;
      location?: string;
      follow_up_answers?: Record<string, unknown>;
    },
  ) => apiRequest<TriageSymptomSubmitResponse>(`/triage/${sessionId}/symptoms`, { method: "POST", body }),
  analyze: (sessionId: number) => apiRequest<TriageProcessingResponse>(`/triage/${sessionId}/analyze`),
  requestAnalyze: (sessionId: number) =>
    apiRequest<TriageProcessingResponse>(`/triage/${sessionId}/analyze`, { method: "POST" }),
  doctors: (sessionId: number) => apiRequest<TriageProcessingResponse>(`/triage/${sessionId}/doctors`),
  report: (sessionId: number) => apiRequest<TriageReport | TriageProcessingResponse>(`/triage/${sessionId}/report`),
  startConversation: (body?: { session_id?: number }) =>
    apiRequest<TriageConversationStart>("/triage/conversation/start", { method: "POST", body: body || {} }),
  sendConversationMessage: (
    conversationId: string,
    body: {
      session_id?: number;
      message: string;
      severity?: TriageSeverity;
      age?: number | null;
      gender?: string;
      medical_history?: Record<string, unknown>;
      duration?: string;
      location?: string;
    },
  ) => apiRequest<TriageConversationMessageResponse>(`/triage/conversation/${conversationId}/message`, { method: "POST", body }),
  answerConversationQuestion: (conversationId: string, body: { question_id: number; answer_text: string }) =>
    apiRequest<TriageAnswerResponse>(`/triage/conversation/${conversationId}/answer`, { method: "POST", body }),
  completeConversation: (conversationId: string, body?: { session_id?: number; latest_payload?: Record<string, unknown> }) =>
    apiRequest<TriageProcessingResponse>(`/triage/conversation/${conversationId}/complete`, {
      method: "POST",
      body: body || {},
    }),
  conversationResult: (conversationId: string) =>
    apiRequest<TriageConversationResult | TriageProcessingResponse>(`/triage/conversation/${conversationId}/result`),
};

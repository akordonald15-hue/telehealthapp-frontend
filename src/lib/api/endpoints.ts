import { apiList, apiRequest } from "@/lib/api/client";
import type {
  AdminAuditLog,
  AdminDashboardResponse,
  AdminProvider,
  AdminProviderCreateResponse,
  AdminUser,
  Appointment,
  AppointmentBookingResponse,
  AppointmentRating,
  AuditEvent,
  AvailabilitySlot,
  CarePlan,
  ConsultationDispute,
  DetailResponse,
  DoctorProfile,
  HomeCareAssignment,
  HomeCareAvailableSlot,
  HomeCareBookingResponse,
  HomeCareRating,
  HomeCareRequestCreate,
  HomeCareRequestDetail,
  HomeCareRequestEvent,
  HomeCareRequestListItem,
  HomeCareService,
  HomeCareTrackingPoint,
  MedicalFileDownload,
  MedicalFileUploadInit,
  MedicalRecord,
  Message,
  MessageAttachmentUploadInit,
  NurseProfile,
  PatientProfile,
  Payment,
  PasswordResetVerifyResponse,
  PaymentInitiation,
  PaymentProvider,
  ProviderSetupVerifyResponse,
  ProviderLedgerTransaction,
  ProviderPayoutRequest,
  ProviderAvailabilityStatus,
  ProviderAvailabilityState,
  ProviderDoctor,
  ProviderNurse,
  ProviderWalletDashboard,
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

function authPath(path: string) {
  return typeof window === "undefined" ? path : `/api${path}`;
}

export const authApi = {
  register: (body: { email: string; phone?: string; password: string }) =>
    apiRequest<RegisterResponse>(authPath("/auth/register/"), {
      method: "POST",
      body: { ...body, role: "patient" },
      auth: false,
    }),
  login: (body: { email: string; password: string }) =>
    apiRequest<TokenPair>(authPath("/auth/login/"), { method: "POST", body, auth: false }),
  google: (body: { id_token: string }) =>
    apiRequest<TokenPair>(authPath("/auth/google/"), { method: "POST", body, auth: false }),
  refresh: () =>
    apiRequest<TokenPair>(authPath("/auth/refresh/"), { method: "POST", body: {}, auth: false }),
  logout: () => apiRequest<DetailResponse>(authPath("/auth/logout/"), { method: "POST", body: {} }),
  me: () => apiRequest<User>(authPath("/auth/me/")),
  changePassword: (body: { old_password: string; new_password: string }) =>
    apiRequest<DetailResponse>(authPath("/auth/change-password/"), { method: "POST", body }),
  updateMe: (body: Partial<Pick<User, "email" | "phone" | "full_name">>) =>
    apiRequest<User>(authPath("/auth/me/"), { method: "PATCH", body }),
  passwordResetRequest: (body: { email: string }) =>
    apiRequest<DetailResponse>(authPath("/auth/password-reset/request/"), { method: "POST", body, auth: false }),
  passwordResetVerify: (body: { email: string; code: string }) =>
    apiRequest<PasswordResetVerifyResponse>(authPath("/auth/password-reset/verify/"), { method: "POST", body, auth: false }),
  passwordResetConfirm: (body: { reset_token: string; new_password: string; confirm_password: string }) =>
    apiRequest<DetailResponse>(authPath("/auth/password-reset/confirm/"), { method: "POST", body, auth: false }),
  providerSetupVerify: (body: { token: string }) =>
    apiRequest<ProviderSetupVerifyResponse>(authPath("/auth/provider-setup/verify/"), { method: "POST", body, auth: false }),
  providerSetupComplete: (body: { token: string; new_password: string; confirm_password: string }) =>
    apiRequest<DetailResponse>(authPath("/auth/provider-setup/complete/"), { method: "POST", body, auth: false }),
  otpRequest: (body: { email: string }) =>
    apiRequest<DetailResponse>(authPath("/auth/otp/request/"), { method: "POST", body, auth: false }),
  otpVerify: (body: { email: string; code: string }) =>
    apiRequest<DetailResponse>(authPath("/auth/otp/verify/"), { method: "POST", body, auth: false }),
  emailVerificationRequest: (body: { email: string }) =>
    apiRequest<DetailResponse>(authPath("/auth/otp/request/"), { method: "POST", body: body, auth: false }),
  emailVerificationConfirm: (body: { email: string; code: string }) =>
    apiRequest<DetailResponse>(authPath("/auth/otp/verify/"), { method: "POST", body, auth: false }),
};

export const profilesApi = {
  me: <T extends PatientProfile | DoctorProfile | NurseProfile>() => apiRequest<T>("/profiles/me/"),
  updateMe: <T extends PatientProfile | DoctorProfile | NurseProfile>(body: Partial<T>) =>
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
  carePlans: (query?: { page?: number; page_size?: number }) =>
    apiList<CarePlan>("/profiles/care-plans/", query),
  createCarePlan: (body: {
    patient: number;
    appointment: number;
    complaint_summary?: string;
    assessment_note?: string;
    care_steps?: string;
    medications?: string;
    lifestyle_advice?: string;
    referral_recommendation?: string;
    follow_up_date?: string | null;
    warning_signs?: string;
  }) => apiRequest<CarePlan>("/profiles/care-plans/", { method: "POST", body }),
  carePlan: (id: number) => apiRequest<CarePlan>(`/profiles/care-plans/${id}/`),
};

export const providersApi = {
  doctors: (query?: { page?: number; page_size?: number; specialty?: string; search?: string }) =>
    apiList<ProviderDoctor>("/providers/doctors/", query),
  nurses: (query?: { page?: number; page_size?: number; service_type?: string; zone?: string; search?: string }) =>
    apiList<ProviderNurse>("/providers/nurses/", query),
  myAvailability: () => apiRequest<ProviderAvailabilityState>("/providers/me/availability/"),
  updateAvailability: (body: { availability_status: ProviderAvailabilityStatus }) =>
    apiRequest<ProviderAvailabilityState>("/providers/me/availability/", { method: "PATCH", body }),
  heartbeat: () => apiRequest<ProviderAvailabilityState>("/providers/me/heartbeat/", { method: "POST", body: {} }),
};

export const appointmentsApi = {
  list: (query?: { page?: number; page_size?: number }) => apiList<Appointment>("/appointments/", query),
  availableDoctors: (query?: { page?: number; page_size?: number; specialty?: string; search?: string }) =>
    apiList<ProviderDoctor>("/appointments/available-doctors/", query),
  book: (body: { doctor: number; triage_session?: number; scheduled_at: string; reason?: string; notes?: string; callback_url: string }) =>
    apiRequest<AppointmentBookingResponse>("/appointments/book/", { method: "POST", body }),
  create: (body: { doctor: number; scheduled_at: string; status?: string; reason?: string; notes?: string }) =>
    apiRequest<Appointment>("/appointments/", { method: "POST", body }),
  detail: (id: number) => apiRequest<Appointment>(`/appointments/${id}/`),
  update: (id: number, body: Partial<Pick<Appointment, "doctor" | "scheduled_at" | "status" | "reason" | "notes">>) =>
    apiRequest<Appointment>(`/appointments/${id}/`, { method: "PATCH", body }),
  cancel: (id: number) => apiRequest<DetailResponse>(`/appointments/${id}/cancel/`, { method: "POST" }),
  submitRating: (id: number, body: { score: number; feedback?: string }) =>
    apiRequest<AppointmentRating>(`/appointments/${id}/rating/`, { method: "POST", body }),
  reschedule: (id: number, body: { scheduled_at: string }) =>
    apiRequest<DetailResponse>(`/appointments/${id}/reschedule/`, { method: "POST", body }),
  availability: (query?: { doctor_id?: number; page?: number; page_size?: number }) =>
    apiList<AvailabilitySlot>("/appointments/availability/", query),
};

export const messagingApi = {
  threads: (query?: { page?: number; page_size?: number }) => apiList<Thread>("/messages/threads/", query),
  createThread: (body: { patient?: number; doctor?: number; appointment_id?: number }) =>
    apiRequest<Thread>("/messages/threads/", { method: "POST", body }),
  messages: (threadId: number, query?: { page?: number; page_size?: number }) =>
    apiList<Message>(`/messages/threads/${threadId}/messages/`, query),
  createMessage: (threadId: number, body: { body: string; attachment_id?: number }) =>
    apiRequest<Message>(`/messages/threads/${threadId}/messages/`, { method: "POST", body }),
  endConsultation: (threadId: number) =>
    apiRequest<DetailResponse>(`/messages/threads/${threadId}/end/`, { method: "POST", body: {} }),
  createDispute: (threadId: number, body: { reason_category: string; explanation?: string }) =>
    apiRequest<ConsultationDispute>(`/messages/threads/${threadId}/dispute/`, { method: "POST", body }),
  initAttachmentUpload: (
    threadId: number,
    body: { filename: string; content_type?: string; size_bytes?: number; duration_seconds?: number },
  ) =>
    apiRequest<MessageAttachmentUploadInit>(`/messages/threads/${threadId}/attachments/init/`, {
      method: "POST",
      body,
    }),
  uploadAttachmentFile: (attachmentId: number, file: File) => {
    const body = new FormData();
    body.set("file", file);
    return apiRequest<DetailResponse>(`/messages/attachments/${attachmentId}/upload/`, {
      method: "POST",
      body,
    });
  },
};

export const homeCareApi = {
  services: (query?: { zone?: string; page?: number; page_size?: number }) =>
    apiList<HomeCareService>("/home-care/services/", query),
  availableNurses: (query?: { page?: number; page_size?: number; service_type?: string; service_id?: number; zone?: string; search?: string }) =>
    apiList<ProviderNurse>("/home-care/available-nurses/", query),
  availableSlots: (query: { nurse_id: number; date: string }) =>
    apiRequest<{ results: HomeCareAvailableSlot[] }>(`/home-care/available-slots/?${new URLSearchParams({ nurse_id: String(query.nurse_id), date: query.date }).toString()}`),
  requests: (query?: { page?: number; page_size?: number }) => apiList<HomeCareRequestListItem>("/home-care/requests/", query),
  bookRequest: (body: HomeCareRequestCreate & { callback_url: string }) =>
    apiRequest<HomeCareBookingResponse>("/home-care/requests/book/", { method: "POST", body }),
  createRequest: (body: HomeCareRequestCreate) =>
    apiRequest<HomeCareRequestDetail>("/home-care/requests/", { method: "POST", body }),
  requestDetail: (id: number) => apiRequest<HomeCareRequestDetail>(`/home-care/requests/${id}/`),
  requestEvents: (id: number) => apiList<HomeCareRequestEvent>(`/home-care/requests/${id}/events/`),
  requestTracking: (id: number) => apiList<HomeCareTrackingPoint>(`/home-care/requests/${id}/tracking/`),
  cancelRequest: (id: number, body: { reason: string }) =>
    apiRequest<DetailResponse>(`/home-care/requests/${id}/cancel/`, { method: "POST", body }),
  confirmCompletion: (id: number) =>
    apiRequest<DetailResponse>(`/home-care/requests/${id}/patient-confirm/`, { method: "POST" }),
  submitRating: (id: number, body: { score: number; feedback?: string }) =>
    apiRequest<HomeCareRating>(`/home-care/requests/${id}/rating/`, { method: "POST", body }),
  assignments: (query?: { page?: number; page_size?: number }) => apiList<HomeCareAssignment>("/home-care/assignments/", query),
  acceptAssignment: (id: number) => apiRequest<DetailResponse>(`/home-care/assignments/${id}/accept/`, { method: "POST" }),
  declineAssignment: (id: number, body: { reason: string }) =>
    apiRequest<DetailResponse>(`/home-care/assignments/${id}/decline/`, { method: "POST", body }),
  submitVerificationAttempt: (
    id: number,
    body: {
      patient_is_real: boolean;
      phone_number_active: boolean;
      address_is_clear: boolean;
      patient_available: boolean;
      request_still_valid: boolean;
      outcome: "confirmed" | "needs_clarification" | "no_answer" | "request_cancelled";
      notes?: string;
      call_started_at?: string;
      call_ended_at?: string;
    },
  ) => apiRequest<DetailResponse>(`/home-care/assignments/${id}/verification-attempts/`, { method: "POST", body }),
  startTrip: (id: number) => apiRequest<DetailResponse>(`/home-care/assignments/${id}/trip-start/`, { method: "POST" }),
  sendTracking: (
    id: number,
    body: { latitude: number; longitude: number; accuracy_meters?: number; source?: string },
  ) => apiRequest<DetailResponse & { tracking_point_id?: number }>(`/home-care/assignments/${id}/tracking/`, { method: "POST", body }),
  markArrived: (id: number) => apiRequest<DetailResponse>(`/home-care/assignments/${id}/arrive/`, { method: "POST" }),
  startCare: (id: number) => apiRequest<DetailResponse>(`/home-care/assignments/${id}/care-start/`, { method: "POST" }),
  completeCare: (id: number) => apiRequest<DetailResponse>(`/home-care/assignments/${id}/care-complete/`, { method: "POST" }),
};

export const paymentsApi = {
  list: (query?: { page?: number; page_size?: number }) => apiList<Payment>("/payments/", query),
  initiate: (body: {
    provider: PaymentProvider;
    amount?: number;
    currency?: string;
    appointment_id?: number;
    homecare_request_id?: number;
    callback_url: string;
  }) => apiRequest<PaymentInitiation>("/payments/initiate/", { method: "POST", body }),
  detail: (id: number) => apiRequest<Payment>(`/payments/${id}/`),
  retry: (id: number) => apiRequest<PaymentInitiation>(`/payments/${id}/retry/`, { method: "POST" }),
  submitTransfer: ({ paymentId, proofFile }: { paymentId: number; proofFile: File }) => {
    const body = new FormData();
    body.append("proof", proofFile);
    return apiRequest<PaymentInitiation>(`/payments/${paymentId}/submit-transfer/`, { method: "POST", body });
  },
  refund: (body: { payment: number; amount: string | number }) =>
    apiRequest<Refund>("/payments/refunds/", { method: "POST", body }),
};

export const providerLedgerApi = {
  wallet: () => apiRequest<ProviderWalletDashboard>("/provider-ledger/wallet/"),
  transactions: (query?: { page?: number; page_size?: number }) =>
    apiList<ProviderLedgerTransaction>("/provider-ledger/ledger-transactions/", query),
  payoutRequests: (query?: { page?: number; page_size?: number }) =>
    apiList<ProviderPayoutRequest>("/provider-ledger/payout-requests/", query),
};

export const referralsApi = {
  list: (query?: { page?: number; page_size?: number }) => apiList<Referral>("/referrals/", query),
  create: (body: { patient: number; appointment?: number | null; referred_to: string; notes?: string; status?: string }) =>
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

export const adminApi = {
  dashboard: () => apiRequest<AdminDashboardResponse>("/admin/dashboard/"),
  users: (query?: { page?: number; page_size?: number; role?: UserRole; search?: string; is_active?: "true" | "false" }) =>
    apiList<AdminUser>("/admin/users/", query),
  updateUser: (id: number, body: Partial<Pick<AdminUser, "is_active" | "is_email_verified">>) =>
    apiRequest<AdminUser>(`/admin/users/${id}/`, { method: "PATCH", body }),
  requestPasswordReset: (id: number) =>
    apiRequest<DetailResponse>(`/admin/users/${id}/password-reset/`, { method: "POST" }),
  providers: (query?: { page?: number; page_size?: number }) => apiList<AdminProvider>("/admin/providers/", query),
  createProvider: (body: {
    role: "doctor" | "nurse";
    name: string;
    email: string;
    phone?: string;
    specialty?: string;
    service_type?: string;
    service_zone?: string;
    base_address?: string;
    license_no?: string;
    availability_status: ProviderAvailabilityStatus;
    provider_status?: NurseProfile["onboarding_status"];
    active_for_dispatch?: boolean;
    is_active?: boolean;
    is_email_verified?: boolean;
  }) => apiRequest<AdminProviderCreateResponse>("/admin/providers/create/", { method: "POST", body }),
  resendProviderInvite: (providerType: "doctor" | "nurse", providerId: number) =>
    apiRequest<DetailResponse>(`/admin/providers/${providerType}/${providerId}/resend-invite/`, { method: "POST" }),
  updateProviderStatus: (
    providerType: "doctor" | "nurse",
    providerId: number,
    body: {
      availability_status?: ProviderAvailabilityStatus;
      is_active?: boolean;
      onboarding_status?: NurseProfile["onboarding_status"];
      active_for_dispatch?: boolean;
      service_zone?: string;
      base_address?: string;
      license_no?: string;
    },
  ) => apiRequest<DetailResponse>(`/admin/providers/${providerType}/${providerId}/status/`, { method: "PATCH", body }),
  pendingManualPayments: (query?: { page?: number; page_size?: number }) =>
    apiList<Payment>("/admin/payments/manual-verification/", query),
  confirmManualPayment: (paymentId: number, body?: { provider_reference?: string; note?: string }) =>
    apiRequest<DetailResponse & { payment: Payment }>(`/admin/payments/${paymentId}/confirm/`, {
      method: "POST",
      body: body || {},
    }),
  rejectManualPayment: (paymentId: number, body?: { note?: string }) =>
    apiRequest<DetailResponse & { payment: Payment }>(`/admin/payments/${paymentId}/reject/`, {
      method: "POST",
      body: body || {},
    }),
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

import type {
  Appointment,
  AppointmentStatus,
  BookAppointmentPayload,
  ChatHistoryResponse,
  Customer,
  DashboardStats,
  NotificationsResponse,
  PaginatedAppointments,
  PaginatedCustomers,
  Service,
  ServicePayload,
  SlotStatus,
  UpdateSlotPayload,
  WorkshopInfo,
  WorkshopSettings,
} from "./types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

function getAdminKey(): string {
  if (typeof window === "undefined") return "";
  return sessionStorage.getItem("admin_key") ?? "";
}

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "X-Admin-Key": getAdminKey(),
      ...(options.headers ?? {}),
    },
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => "Bilinmeyen hata");
    throw new Error(errorText || `HTTP ${res.status}`);
  }

  if (res.status === 204) return undefined as T;

  return res.json() as Promise<T>;
}

// ─── Workshop Identity ────────────────────────────────────────────────────────

export function getMe(): Promise<WorkshopInfo> {
  return apiFetch<WorkshopInfo>("/api/admin/me");
}

export function setAIEnabled(enabled: boolean): Promise<{ aiEnabled: boolean }> {
  return apiFetch<{ aiEnabled: boolean }>("/api/admin/ai-enabled", {
    method: "PUT",
    body: JSON.stringify({ enabled }),
  });
}

// ─── Workshop Profile (display name + bot name) ──────────────────────────────

export interface WorkshopProfile {
  name: string;
  botName: string | null;
  businessType: string;
}

export function getWorkshopProfile(): Promise<WorkshopProfile> {
  return apiFetch<WorkshopProfile>("/api/admin/workshop-profile");
}

export function updateWorkshopProfile(payload: {
  name: string;
  botName?: string | null;
}): Promise<WorkshopProfile> {
  return apiFetch<WorkshopProfile>("/api/admin/workshop-profile", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

// ─── Appointments ─────────────────────────────────────────────────────────────

export async function getTodayAppointments(): Promise<Appointment[]> {
  const res = await apiFetch<{ appointments: Appointment[] }>(
    "/api/admin/appointments/today",
  );
  return res.appointments;
}

export async function getAppointments(params?: {
  date?: string;
  status?: AppointmentStatus;
}): Promise<Appointment[]> {
  const query = new URLSearchParams();
  if (params?.date) query.set("date", params.date);
  if (params?.status) query.set("status", params.status);
  const qs = query.toString();
  const res = await apiFetch<{ appointments: Appointment[] }>(
    `/api/admin/appointments${qs ? `?${qs}` : ""}`,
  );
  return res.appointments;
}

export function createAppointment(
  payload: BookAppointmentPayload,
): Promise<Appointment> {
  return apiFetch<Appointment>("/api/admin/appointments", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateAppointmentStatus(
  id: string,
  status: AppointmentStatus,
): Promise<void> {
  return apiFetch<void>(`/api/admin/appointments/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export function deleteAppointment(id: string): Promise<void> {
  return apiFetch<void>(`/api/admin/appointments/${id}`, {
    method: "DELETE",
  });
}

// ─── Customers ────────────────────────────────────────────────────────────────

export async function getCustomers(search?: string): Promise<Customer[]> {
  const query = new URLSearchParams();
  if (search) query.set("search", search);
  const qs = query.toString();
  const res = await apiFetch<{ customers: Customer[] }>(
    `/api/admin/customers${qs ? `?${qs}` : ""}`,
  );
  return res.customers;
}

// ─── Services ─────────────────────────────────────────────────────────────────

export async function getServices(): Promise<Service[]> {
  const res = await apiFetch<{ services: Service[] }>("/api/admin/services");
  return res.services;
}

export function createService(payload: ServicePayload): Promise<Service> {
  return apiFetch<Service>("/api/admin/services", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateService(
  id: string,
  payload: ServicePayload,
): Promise<Service> {
  return apiFetch<Service>(`/api/admin/services/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteService(id: string): Promise<void> {
  return apiFetch<void>(`/api/admin/services/${id}`, { method: "DELETE" });
}

// ─── Notifications ────────────────────────────────────────────────────────────

export function getNotifications(): Promise<NotificationsResponse> {
  return apiFetch<NotificationsResponse>("/api/admin/notifications");
}

export function markNotificationRead(id: number): Promise<void> {
  return apiFetch<void>(`/api/admin/notifications/${id}/read`, {
    method: "PATCH",
  });
}

export function markAllNotificationsRead(): Promise<void> {
  return apiFetch<void>("/api/admin/notifications/read-all", {
    method: "PATCH",
  });
}

// ─── Workshop Settings ────────────────────────────────────────────────────────

export function getWorkshopSettings(): Promise<WorkshopSettings> {
  return apiFetch<WorkshopSettings>("/api/admin/settings");
}

export function updateWorkshopSettings(
  payload: Omit<WorkshopSettings, "id">,
): Promise<WorkshopSettings> {
  return apiFetch<WorkshopSettings>("/api/admin/settings", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function getSlotStatuses(dayOfWeek: number): Promise<SlotStatus[]> {
  return apiFetch<SlotStatus[]>(`/api/admin/settings/slots/${dayOfWeek}`);
}

export function updateSlot(payload: UpdateSlotPayload): Promise<void> {
  return apiFetch<void>("/api/admin/settings/slots", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

// ─── Availability (used by booking modal) ────────────────────────────────────

export async function getAvailableSlots(date: string): Promise<string[]> {
  // date: "yyyy-MM-dd"
  // Reuses CheckAvailability via a dedicated admin endpoint or workshop settings
  // We call the same slots endpoint filtered for a specific calendar date
  const res = await apiFetch<{ available: boolean; slots?: string[] }>(
    `/api/admin/appointments/availability?date=${date}`,
  );
  return res.slots ?? [];
}

// ─── Stats ────────────────────────────────────────────────────────────────────

export function getDashboardStats(): Promise<DashboardStats> {
  return apiFetch<DashboardStats>("/api/admin/stats");
}

// ─── Paginated Appointments ───────────────────────────────────────────────────

export async function getAppointmentsPaginated(params?: {
  date?: string;
  status?: AppointmentStatus;
  page?: number;
  limit?: number;
}): Promise<PaginatedAppointments> {
  const query = new URLSearchParams();
  if (params?.date) query.set("date", params.date);
  if (params?.status) query.set("status", params.status);
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  const qs = query.toString();
  return apiFetch<PaginatedAppointments>(
    `/api/admin/appointments${qs ? `?${qs}` : ""}`,
  );
}

// ─── Paginated Customers ──────────────────────────────────────────────────────

export async function getCustomersPaginated(params?: {
  search?: string;
  page?: number;
  limit?: number;
}): Promise<PaginatedCustomers> {
  const query = new URLSearchParams();
  if (params?.search) query.set("search", params.search);
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  const qs = query.toString();
  return apiFetch<PaginatedCustomers>(
    `/api/admin/customers${qs ? `?${qs}` : ""}`,
  );
}

// ─── Chat History ─────────────────────────────────────────────────────────────

export async function getChatHistory(params: {
  phone?: string;
  page?: number;
  limit?: number;
}): Promise<ChatHistoryResponse> {
  const query = new URLSearchParams();
  if (params.phone) query.set("phone", params.phone);
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));
  const qs = query.toString();
  return apiFetch<ChatHistoryResponse>(
    `/api/admin/chat-history${qs ? `?${qs}` : ""}`,
  );
}

export interface SentMessageResponse {
  id: string;
  phone: string;
  /** 0 = User, 1 = Assistant — matches the existing GET /chat-history response. */
  role: number;
  message: string;
  createdAt: string;
}

export function sendChatMessage(payload: {
  phone: string;
  message: string;
}): Promise<SentMessageResponse> {
  return apiFetch<SentMessageResponse>("/api/admin/chat-history/send", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// ─── Per-customer AI override ────────────────────────────────────────────────

export interface CustomerAiState {
  /** null = inherit from workshop, true/false = explicit override */
  customerOverride: boolean | null;
  workshopAiEnabled: boolean;
  /** What the bot will actually do for this customer */
  effectiveAiEnabled: boolean;
  customerExists?: boolean;
}

export function getCustomerAiEnabled(phone: string): Promise<CustomerAiState> {
  return apiFetch<CustomerAiState>(
    `/api/admin/customers/${encodeURIComponent(phone)}/ai-enabled`,
  );
}

export function setCustomerAiEnabled(
  phone: string,
  aiEnabled: boolean | null,
): Promise<CustomerAiState> {
  return apiFetch<CustomerAiState>(
    `/api/admin/customers/${encodeURIComponent(phone)}/ai-enabled`,
    {
      method: "PATCH",
      body: JSON.stringify({ aiEnabled }),
    },
  );
}

// ─── WhatsApp Business Profile (Meta-managed workshops only) ─────────────────

export interface WhatsAppProfileSupported {
  supported: true;
  provider: string;
  about: string | null;
  address: string | null;
  description: string | null;
  email: string | null;
  profilePictureUrl: string | null;
  websites: string[] | null;
  vertical: string | null;
  /** Read-only — verified display name. Changing requires Meta Business Manager. */
  verifiedName: string | null;
}

export interface WhatsAppProfileUnsupported {
  supported: false;
  provider: string;
}

export type WhatsAppProfileResponse =
  | WhatsAppProfileSupported
  | WhatsAppProfileUnsupported;

export function getWhatsAppProfile(): Promise<WhatsAppProfileResponse> {
  return apiFetch<WhatsAppProfileResponse>("/api/admin/whatsapp-profile");
}

export function updateWhatsAppProfile(payload: {
  about?: string | null;
  address?: string | null;
  description?: string | null;
  email?: string | null;
  websites?: string[] | null;
  vertical?: string | null;
}): Promise<WhatsAppProfileResponse> {
  return apiFetch<WhatsAppProfileResponse>("/api/admin/whatsapp-profile", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

/**
 * Uploads a profile picture. Multipart upload (cannot use apiFetch helper because
 * we don't set Content-Type — the browser sets it with the boundary).
 */
export async function uploadWhatsAppProfilePicture(
  file: File,
): Promise<{ profilePictureUrl: string | null; mediaId: string }> {
  const formData = new FormData();
  formData.append("file", file);

  const url = `${BASE_URL}/api/admin/whatsapp-profile/picture`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "X-Admin-Key": getAdminKey(),
    },
    body: formData,
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => "Bilinmeyen hata");
    throw new Error(errorText || `HTTP ${res.status}`);
  }

  return res.json();
}

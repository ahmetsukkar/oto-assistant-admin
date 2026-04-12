import type {
  Appointment,
  AppointmentStatus,
  BookAppointmentPayload,
  Customer,
  NotificationsResponse,
  Service,
  ServicePayload,
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

  // 204 No Content
  if (res.status === 204) return undefined as T;

  return res.json() as Promise<T>;
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
    `/api/admin/appointments${qs ? `?${qs}` : ""}`
  );
  return res.appointments;
}

export function createAppointment(
  payload: BookAppointmentPayload
): Promise<Appointment> {
  return apiFetch<Appointment>("/api/admin/appointments", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateAppointmentStatus(
  id: string,
  status: AppointmentStatus
): Promise<void> {
  return apiFetch<void>(`/api/admin/appointments/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }), // backend expects { "status": "Confirmed" }
  });
}

// ─── Customers ────────────────────────────────────────────────────────────────

export async function getCustomers(search?: string): Promise<Customer[]> {
  const query = new URLSearchParams();
  if (search) query.set("search", search);
  const qs = query.toString();
  const res = await apiFetch<{ customers: Customer[] }>(
    `/api/admin/customers${qs ? `?${qs}` : ""}`
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
  payload: ServicePayload
): Promise<Service> {
  return apiFetch<Service>(`/api/admin/services/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteService(id: string): Promise<void> {
  return apiFetch<void>(`/api/admin/services/${id}`, { method: "DELETE" });
}

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

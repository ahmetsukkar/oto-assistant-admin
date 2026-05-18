const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

function getPlatformKey(): string {
  if (typeof window === "undefined") return "";
  return sessionStorage.getItem("platform_key") ?? "";
}

async function platformFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "X-Platform-Key": getPlatformKey(),
      ...(options.headers ?? {}),
    },
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => "Unknown error");
    throw new Error(errorText || `HTTP ${res.status}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type WhatsAppProvider = "Meta" | "Twilio";
export type BusinessType = "CarWorkshop" | "Barber" | "Clinic" | "Restaurant";

export interface WorkshopListItem {
  id: string;
  name: string;
  botName: string | null;
  businessType: BusinessType;
  whatsAppProvider: WhatsAppProvider;
  whatsAppPhoneNumberId: string | null;
  whatsAppPhoneNumber: string | null;
  hasToken: boolean;
  hasTwilioSid: boolean;
  hasGeminiKey: boolean;
  aiEnabled: boolean;
  isActive: boolean;
  isTrial: boolean;
  createdAt: string;
  subscriptionExpiresAt: string | null;
  isExpired: boolean;
}

export interface WorkshopUpsertPayload {
  name: string;
  botName?: string;
  businessType?: BusinessType;
  whatsAppProvider?: WhatsAppProvider;
  whatsAppPhoneNumberId?: string;
  whatsAppPhoneNumber?: string;
  whatsAppToken?: string;
  whatsAppAppSecret?: string;
  whatsAppAppId?: string;
  twilioAccountSid?: string;
  twilioAuthToken?: string;
  geminiApiKey?: string;
  customPrompt?: string;
  aiEnabled?: boolean;
  apiKey?: string;
  subscriptionDays?: number;
  isTrial?: boolean;
}

export interface CreatedWorkshop {
  id: string;
  apiKey: string;
  name: string;
  botName: string | null;
  businessType: string;
  whatsAppProvider: string;
  isActive: boolean;
  isTrial: boolean;
  subscriptionExpiresAt: string | null;
}

// ─── API calls ────────────────────────────────────────────────────────────────

export function listWorkshops(): Promise<WorkshopListItem[]> {
  return platformFetch<WorkshopListItem[]>("/api/platform/workshops");
}

export function createWorkshop(
  payload: WorkshopUpsertPayload,
): Promise<CreatedWorkshop> {
  return platformFetch<CreatedWorkshop>("/api/platform/workshops", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateWorkshop(
  id: string,
  payload: WorkshopUpsertPayload,
): Promise<{ id: string; name: string; isActive: boolean }> {
  return platformFetch(`/api/platform/workshops/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deactivateWorkshop(
  id: string,
): Promise<{ id: string; isActive: boolean }> {
  return platformFetch(`/api/platform/workshops/${id}`, {
    method: "DELETE",
  });
}

export function extendSubscription(
  id: string,
  days: number,
): Promise<{ id: string; subscriptionExpiresAt: string }> {
  return platformFetch(`/api/platform/workshops/${id}/extend-subscription`, {
    method: "PATCH",
    body: JSON.stringify({ days }),
  });
}

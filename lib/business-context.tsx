"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { BusinessTypeConfig, WorkshopInfo } from "./types";
import { getMe, setAIEnabled as apiSetAIEnabled } from "./api";

const defaultConfig: BusinessTypeConfig = {
  appointmentLabel: "Randevu",
  customerLabel: "Müşteri",
  serviceLabel: "Hizmet",
  showServicePricing: true,
  hasVehicleInfo: false,
  hasStaffAssignment: false,
  requiresPartySize: false,
};

function fromInfo(info: WorkshopInfo) {
  return {
    workshopName: info.workshopName,
    businessType: info.businessType,
    config: info.businessTypeConfig,
    aiEnabled: info.aiEnabled ?? true,
    hasExpiry: info.hasExpiry ?? false,
    isExpired: info.isExpired ?? false,
    daysLeft: info.daysLeft ?? null,
    isTrial: info.isTrial ?? false,
  };
}

interface BusinessContextValue {
  workshopName: string;
  businessType: string;
  config: BusinessTypeConfig;
  aiEnabled: boolean;
  hasExpiry: boolean;
  isExpired: boolean;
  daysLeft: number | null;
  isTrial: boolean;
  /** Toggles AI on/off on the backend and updates local state. */
  setAIEnabled: (enabled: boolean) => Promise<void>;
  /** Re-fetches workshop info from the API (use after editing name/profile). */
  refreshWorkshopInfo: () => Promise<void>;
}

const BusinessContext = createContext<BusinessContextValue>({
  workshopName: "",
  businessType: "CarWorkshop",
  config: defaultConfig,
  aiEnabled: true,
  hasExpiry: false,
  isExpired: false,
  daysLeft: null,
  isTrial: false,
  setAIEnabled: async () => {},
  refreshWorkshopInfo: async () => {},
});

export function useBusinessContext() {
  return useContext(BusinessContext);
}

export function BusinessContextProvider({ children }: { children: ReactNode }) {
  const [value, setValue] = useState<
    Omit<BusinessContextValue, "setAIEnabled" | "refreshWorkshopInfo">
  >({
    workshopName: "",
    businessType: "CarWorkshop",
    config: defaultConfig,
    aiEnabled: true,
    hasExpiry: false,
    isExpired: false,
    daysLeft: null,
    isTrial: false,
  });

  const setAIEnabled = useCallback(async (enabled: boolean) => {
    const result = await apiSetAIEnabled(enabled);
    setValue((prev) => {
      const next = { ...prev, aiEnabled: result.aiEnabled };
      // keep sessionStorage in sync so a reload reflects the current state
      try {
        const stored = sessionStorage.getItem("workshop_info");
        if (stored) {
          const info = JSON.parse(stored) as WorkshopInfo;
          info.aiEnabled = result.aiEnabled;
          sessionStorage.setItem("workshop_info", JSON.stringify(info));
        }
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  const refreshWorkshopInfo = useCallback(async () => {
    const info = await getMe();
    sessionStorage.setItem("workshop_info", JSON.stringify(info));
    setValue(fromInfo(info));
  }, []);

  useEffect(() => {
    // Trial fields can change between requests (countdown, expiry, extension),
    // so always fetch fresh on mount. Use cached info only to avoid a flash
    // of empty state while the fetch is in flight.
    const stored = sessionStorage.getItem("workshop_info");
    if (stored) {
      try {
        const info: WorkshopInfo = JSON.parse(stored);
        setValue(fromInfo(info));
      } catch {
        // ignore parse errors; fall through to fetch
      }
    }

    getMe()
      .then((info) => {
        sessionStorage.setItem("workshop_info", JSON.stringify(info));
        setValue(fromInfo(info));
      })
      .catch(() => {
        // keep cached/defaults if fetch fails
      });
  }, []);

  return (
    <BusinessContext.Provider value={{ ...value, setAIEnabled, refreshWorkshopInfo }}>
      {children}
    </BusinessContext.Provider>
  );
}

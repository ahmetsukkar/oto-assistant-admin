"use client";

import { Hourglass, MessageCircle } from "lucide-react";
import { useBusinessContext } from "@/lib/business-context";

const CONTACT_URL = "https://wa.me/905393817760";
const DAYS_WARNING_THRESHOLD = 3;

/**
 * Renders one of three states:
 *   - Subscription within 3 days of expiry  → sticky yellow countdown banner.
 *   - Subscription expired                  → full-screen non-dismissable lockout overlay.
 *   - No expiry / plenty of time left       → nothing.
 *
 * Applies to all workshops (trial and paid) based on SubscriptionExpiresAt.
 * Trial-mode label is added to the banner when isTrial=true.
 */
export default function TrialBanner() {
  const { hasExpiry, isExpired, daysLeft, isTrial } = useBusinessContext();

  if (!hasExpiry) return null;

  if (isExpired) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-rose-50/95 px-6 backdrop-blur">
        <div className="max-w-sm rounded-2xl border border-rose-200 bg-white p-6 text-center shadow-xl">
          <Hourglass className="mx-auto mb-3 text-rose-600" size={40} />
          <h2 className="font-heading text-lg font-semibold text-rose-900">
            {isTrial ? "Deneme Süreniz Sona Erdi" : "Aboneliğiniz Sona Erdi"}
          </h2>
          <p className="mt-2 text-sm text-rose-800">
            Hizmetimize devam etmek için lütfen bizimle iletişime geçin.
          </p>
          <a
            href={CONTACT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-700"
          >
            <MessageCircle size={18} />
            WhatsApp ile İletişime Geç
          </a>
          <p className="mt-4 text-xs text-rose-700/80">
            Verileriniz güvende, iletişime geçtiğinizde hesabınız aktive edilecektir.
          </p>
        </div>
      </div>
    );
  }

  // Only show the countdown banner when within the warning threshold
  if (daysLeft === null || daysLeft > DAYS_WARNING_THRESHOLD) return null;

  return (
    <div className="sticky top-0 z-30 border-b border-amber-200 bg-amber-50 px-4 py-2 text-amber-800">
      <div className="flex items-center gap-2 text-xs sm:text-sm">
        <Hourglass size={16} className="shrink-0" />
        <p className="leading-tight">
          <span className="font-semibold">
            {isTrial ? "Deneme hesabınızda" : "Aboneliğinizde"} {daysLeft} gün kaldı.
          </span>{" "}
          {isTrial && (
            <span className="text-amber-700/80 text-[11px] sm:text-xs">
              (Demo hesabı — yapılandırma kısıtlı){" "}
            </span>
          )}
          <a
            href={CONTACT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-amber-900"
          >
            Devam etmek için iletişime geçin →
          </a>
        </p>
      </div>
    </div>
  );
}

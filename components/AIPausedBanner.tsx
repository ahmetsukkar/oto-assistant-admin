"use client";

import { BotOff } from "lucide-react";
import { useBusinessContext } from "@/lib/business-context";

/**
 * Sticky warning banner shown across all protected pages whenever the workshop's
 * AI auto-reply is paused. Reminds the owner to handle messages manually via
 * Meta Business Suite until they re-enable AI.
 */
export default function AIPausedBanner() {
  const { aiEnabled } = useBusinessContext();
  if (aiEnabled) return null;

  return (
    <div className="sticky top-0 z-30 border-b border-rose-200 bg-rose-50 px-4 py-2 text-rose-800">
      <div className="flex items-center gap-2 text-xs sm:text-sm">
        <BotOff size={16} className="shrink-0" />
        <p className="leading-tight">
          <span className="font-semibold">AI yanıtları duraklatıldı.</span>{" "}
          Mesajlara Meta Business Suite uygulamasından manuel olarak yanıt verin.
        </p>
      </div>
    </div>
  );
}

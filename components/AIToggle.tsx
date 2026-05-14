"use client";

import { useState } from "react";
import { Bot, BotOff, Loader2 } from "lucide-react";
import { useBusinessContext } from "@/lib/business-context";

type Size = "compact" | "full";

interface AIToggleProps {
  size?: Size;
  className?: string;
}

/**
 * Toggles the workshop's AI auto-reply on/off.
 *
 * - `compact` mode renders a small clickable pill ("AI: AÇIK" / "AI: KAPALI")
 *   meant for the dashboard header.
 * - `full` mode renders a card-style switch with explanatory text for the
 *   settings page.
 */
export default function AIToggle({ size = "compact", className }: AIToggleProps) {
  const { aiEnabled, setAIEnabled } = useBusinessContext();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleToggle = async () => {
    if (pending) return;
    setError(null);
    setPending(true);
    try {
      await setAIEnabled(!aiEnabled);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Bilinmeyen hata");
    } finally {
      setPending(false);
    }
  };

  if (size === "compact") {
    const base =
      "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-60";
    const tone = aiEnabled
      ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
      : "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100";
    return (
      <button
        type="button"
        onClick={handleToggle}
        disabled={pending}
        className={`${base} ${tone} ${className ?? ""}`}
        title={
          aiEnabled
            ? "AI otomatik yanıtları açık. Kapatmak için tıklayın."
            : "AI otomatik yanıtları kapalı. Açmak için tıklayın."
        }
      >
        {pending ? (
          <Loader2 size={14} className="animate-spin" />
        ) : aiEnabled ? (
          <Bot size={14} />
        ) : (
          <BotOff size={14} />
        )}
        <span>AI: {aiEnabled ? "AÇIK" : "KAPALI"}</span>
      </button>
    );
  }

  // size === "full"
  return (
    <div
      className={`rounded-2xl border bg-white p-4 ${
        aiEnabled ? "border-emerald-200" : "border-rose-200"
      } ${className ?? ""}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-full ${
              aiEnabled ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
            }`}
          >
            {aiEnabled ? <Bot size={18} /> : <BotOff size={18} />}
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">
              Otomatik Yanıt (AI)
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              {aiEnabled
                ? "Gelen WhatsApp mesajları otomatik olarak yanıtlanır."
                : "Otomatik yanıt durduruldu. Gelen mesajlar kayıt altına alınır, ancak yanıt verilmez. Manuel yanıt için Meta Business Suite uygulamasını kullanın."}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleToggle}
          disabled={pending}
          role="switch"
          aria-checked={aiEnabled}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors disabled:opacity-60 ${
            aiEnabled ? "bg-emerald-500" : "bg-slate-300"
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ${
              aiEnabled ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>
      {error && (
        <p className="mt-2 text-xs text-rose-600">Hata: {error}</p>
      )}
    </div>
  );
}

"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

/**
 * Route-level error boundary for the protected section.
 * Catches any uncaught exception thrown while rendering a protected page
 * (data-fetch failures, unexpected state, etc.) and shows a branded recovery
 * UI instead of Next.js's default error screen.
 */
export default function ProtectedError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to console — Sentry / Serilog-equivalent on the server picks up
    // network errors separately. This is for unexpected client-side crashes.
    console.error("Protected route error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-5 text-center">
        <div className="flex justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-600">
            <AlertTriangle size={22} />
          </div>
        </div>
        <div>
          <h1 className="text-base font-semibold text-slate-900">
            Bir hata oluştu
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Bu sayfa yüklenirken beklenmeyen bir sorun oluştu. Lütfen tekrar
            deneyin.
          </p>
        </div>
        <Button
          onClick={() => reset()}
          className="gap-2 bg-slate-900 hover:bg-slate-800"
        >
          <RefreshCw size={14} />
          Tekrar dene
        </Button>
        {error.digest && (
          <p className="text-[10px] text-slate-300 font-mono">
            ref: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}

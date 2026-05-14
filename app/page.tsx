"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [year, setYear] = useState("");
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setYear(String(new Date().getFullYear())); }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!pin.trim()) {
      setError("Lütfen erişim anahtarınızı giriniz.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Verify key with a real API call
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/appointments/today`,
        {
          headers: {
            "X-Admin-Key": pin.trim(),
            "Content-Type": "application/json",
          },
        }
      );

      if (!res.ok) {
        setError("Geçersiz erişim anahtarı. Lütfen tekrar deneyiniz.");
        setLoading(false);
        return;
      }

      // Store key in sessionStorage + cookie
      sessionStorage.setItem("admin_key", pin.trim());
      document.cookie = `admin_key=${pin.trim()}; path=/; SameSite=Strict`;

      // Fetch and cache workshop identity for BusinessContext
      try {
        const meRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/admin/me`,
          {
            headers: {
              "X-Admin-Key": pin.trim(),
              "Content-Type": "application/json",
            },
          }
        );
        if (meRes.ok) {
          const info = await meRes.json();
          sessionStorage.setItem("workshop_info", JSON.stringify(info));
        }
      } catch {
        // non-fatal — BusinessContextProvider will retry on mount
      }

      router.push("/dashboard");
    } catch {
      setError("Sunucuya bağlanılamadı. Lütfen tekrar deneyiniz.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Logo / Brand */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-slate-900 text-white">
            <MessageSquare size={28} strokeWidth={1.75} />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-semibold text-slate-900">
              Assistly
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">Yönetim Paneli</p>
          </div>
        </div>

        {/* Login Card */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-medium text-slate-700">
              Giriş Yap
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="pin"
                  className="text-sm font-medium text-slate-600"
                >
                  Erişim Anahtarı
                </label>
                <Input
                  id="pin"
                  type="password"
                  placeholder="Erişim anahtarınızı giriniz"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  autoComplete="current-password"
                  className="h-10"
                  disabled={loading}
                />
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                  {error}
                </p>
              )}

              <Button
                type="submit"
                className="w-full h-10 bg-slate-900 hover:bg-slate-800 text-white"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="mr-2 animate-spin" />
                    Giriş yapılıyor...
                  </>
                ) : (
                  "Giriş Yap"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-slate-400">
          Assistly © {year}
        </p>
      </div>
    </div>
  );
}
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getTodayAppointments, updateAppointmentStatus } from "@/lib/api";
import { subscribeToPush, sendSubscriptionToBackend } from "@/lib/push";
import type { Appointment, AppointmentStatus } from "@/lib/types";
import BottomNav from "@/components/BottomNav";
import NotificationBell from "@/components/NotificationBell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  CalendarClock,
  ChevronDown,
  Loader2,
  RefreshCw,
  LogOut,
  BellOff,
} from "lucide-react";

const STATUS_LABELS: Record<AppointmentStatus, string> = {
  Pending: "Bekliyor",
  Confirmed: "Onaylandı",
  Cancelled: "İptal",
};

const STATUS_BADGE_CLASS: Record<AppointmentStatus, string> = {
  Pending: "bg-yellow-50 text-yellow-700 border-yellow-200",
  Confirmed: "bg-green-50 text-green-700 border-green-200",
  Cancelled: "bg-red-50 text-red-600 border-red-200",
};

const ALL_STATUSES: AppointmentStatus[] = ["Pending", "Confirmed", "Cancelled"];

export default function DashboardPage() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [notifState, setNotifState] = useState<
    "idle" | "subscribed" | "denied"
  >("idle");

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission === "denied") {
      setNotifState("denied");
    }
  }, []);

  async function fetchAppointments() {
    setLoading(true);
    setError("");
    try {
      const data = await getTodayAppointments();
      setAppointments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Randevular yüklenemedi.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAppointments();
  }, []);

  async function handleStatusChange(id: string, status: AppointmentStatus) {
    setUpdatingId(id);
    try {
      await updateAppointmentStatus(id, status);
      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status } : a)),
      );
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleEnableNotifications() {
    console.log("🔔 Bell clicked");
    const sub = await subscribeToPush();
    console.log("📦 Subscription result:", sub);
    if (!sub) {
      console.error("❌ subscribeToPush() returned null");
      return;
    }
    try {
      console.log("📡 Sending to backend...", sub.toJSON());
      await sendSubscriptionToBackend(sub);
      console.log("✅ Subscription saved to backend!");
      setNotifState("subscribed");
    } catch (err) {
      console.error("❌ sendSubscriptionToBackend failed:", err);
      setNotifState("subscribed");
    }
  }

  function handleLogout() {
    sessionStorage.removeItem("admin_key");
    document.cookie = "admin_key=; Max-Age=0; path=/";
    router.push("/");
  }

  const today = new Date().toLocaleDateString("tr-TR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const activeCount = appointments.filter(
    (a) => a.status === "Confirmed",
  ).length;

  const cancelledCount = appointments.filter(
    (a) => a.status === "Cancelled",
  ).length;

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
        <div className="flex items-center justify-between px-4 h-14">
          <div>
            <h1 className="text-base font-semibold text-slate-900">
              Bugünkü Randevular
            </h1>
            <p className="text-xs text-slate-500 capitalize">{today}</p>
          </div>
          <div className="flex items-center gap-1">
            {/* Notification Bell — shows dropdown with unread count */}
            {notifState === "subscribed" ? (
              <NotificationBell />
            ) : (
              <Button
                variant="ghost"
                size="icon"
                onClick={
                  notifState === "denied"
                    ? undefined
                    : handleEnableNotifications
                }
                disabled={notifState === "denied"}
                aria-label={
                  notifState === "denied"
                    ? "Bildirimler engellendi"
                    : "Bildirimleri etkinleştir"
                }
                title={
                  notifState === "denied"
                    ? "Tarayıcı bildirim iznini engelledi"
                    : "Bildirimleri etkinleştirmek için tıklayın"
                }
              >
                {notifState === "denied" ? (
                  <BellOff size={17} className="text-slate-300" />
                ) : (
                  // Animated bell to attract attention
                  <span className="relative flex items-center justify-center">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-slate-200 opacity-75 animate-ping" />
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="17"
                      height="17"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.75"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="relative"
                    >
                      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                    </svg>
                  </span>
                )}
              </Button>
            )}

            {/* Refresh */}
            <Button
              variant="ghost"
              size="icon"
              onClick={fetchAppointments}
              disabled={loading}
              aria-label="Yenile"
            >
              <RefreshCw size={17} className={loading ? "animate-spin" : ""} />
            </Button>

            {/* Logout */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              aria-label="Çıkış yap"
            >
              <LogOut size={17} />
            </Button>
          </div>
        </div>
      </header>

      <main className="px-4 pt-4 space-y-3">
        {/* Stats */}
        {!loading && !error && (
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                ["Toplam", appointments.length, "text-slate-900"],
                ["Onaylı", activeCount, "text-green-600"],
                ["İptal", cancelledCount, "text-red-500"],
              ] as [string, number, string][]
            ).map(([label, count, color]) => (
              <Card key={label} className="border-slate-200">
                <CardContent className="pt-3 pb-3 text-center">
                  <p className={`text-2xl font-bold ${color}`}>{count}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-16 text-slate-500">
            <Loader2 size={24} className="animate-spin mr-2" />
            <span className="text-sm">Yükleniyor...</span>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        {/* Empty */}
        {!loading && !error && appointments.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <CalendarClock size={40} strokeWidth={1.25} className="mb-3" />
            <p className="text-sm font-medium text-slate-600">
              Bugün randevu yok
            </p>
            <p className="text-xs mt-1">Tüm müsait gün!</p>
          </div>
        )}

        {/* Appointment Cards */}
        {!loading &&
          !error &&
          appointments.map((appt) => (
            <AppointmentCard
              key={appt.id}
              appointment={appt}
              updating={updatingId === appt.id}
              onStatusChange={handleStatusChange}
            />
          ))}
      </main>

      <BottomNav />
    </div>
  );
}

function AppointmentCard({
  appointment: appt,
  updating,
  onStatusChange,
}: {
  appointment: Appointment;
  updating: boolean;
  onStatusChange: (id: string, status: AppointmentStatus) => void;
}) {
  return (
    <Card className="border-slate-200 shadow-sm">
      <CardContent className="pt-4 pb-3 space-y-2">
        {/* Top row: info + status badge */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-slate-900">
              {appt.customerName}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              {appt.appointmentNumber} · {appt.appointmentDate}
            </p>
          </div>
          <Badge
            variant="outline"
            className={`shrink-0 text-xs border ${STATUS_BADGE_CLASS[appt.status]}`}
          >
            {STATUS_LABELS[appt.status]}
          </Badge>
        </div>

        {/* Service info */}
        <p className="text-sm text-slate-700">
          {appt.serviceName} — {appt.durationMinutes} dk · {appt.servicePrice} ₺
        </p>

        {/* Bottom row: phone + status dropdown */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-100">
          <p className="text-xs text-slate-400">{appt.customerPhone}</p>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1"
                disabled={updating}
              >
                {updating ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <>
                    <ChevronDown size={12} />
                    Durum
                  </>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {ALL_STATUSES.map((s) => (
                <DropdownMenuItem
                  key={s}
                  onClick={() => onStatusChange(appt.id, s)}
                  className={appt.status === s ? "font-medium" : ""}
                >
                  {STATUS_LABELS[s]}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}

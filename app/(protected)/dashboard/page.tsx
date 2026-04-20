"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getTodayAppointments,
  updateAppointmentStatus,
  deleteAppointment,
} from "@/lib/api";
import { subscribeToPush, sendSubscriptionToBackend } from "@/lib/push";
import type { Appointment, AppointmentStatus } from "@/lib/types";
import BottomNav from "@/components/BottomNav";
import NotificationBell from "@/components/NotificationBell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  CalendarClock,
  Loader2,
  RefreshCw,
  LogOut,
  BellOff,
  Trash2,
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  CalendarCheck2,
  MinusCircle,
} from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<AppointmentStatus, string> = {
  Pending: "Bekliyor",
  Confirmed: "Onaylandı",
  Cancelled: "İptal",
  Done: "Geldi",
  NoShow: "Gelmedi",
};

const STATUS_BADGE_CLASS: Record<AppointmentStatus, string> = {
  Pending: "bg-yellow-50 text-yellow-700 border-yellow-200",
  Confirmed: "bg-green-50 text-green-700 border-green-200",
  Cancelled: "bg-red-50 text-red-600 border-red-200",
  Done: "bg-blue-50 text-blue-700 border-blue-200",
  NoShow: "bg-slate-100 text-slate-500 border-slate-200",
};

const ALL_STATUSES: AppointmentStatus[] = [
  "Pending",
  "Confirmed",
  "Cancelled",
  "Done",
  "NoShow",
];

// ─── Appointment Action Sheet ─────────────────────────────────────────────────

function AppointmentSheet({
  appointment,
  updating,
  deleting,
  onStatusChange,
  onDelete,
  onClose,
}: {
  appointment: Appointment | null;
  updating: boolean;
  deleting: boolean;
  onStatusChange: (id: string, status: AppointmentStatus) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}) {
  if (!appointment) return null;

  return (
    <Sheet open={!!appointment} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="bottom" className="rounded-t-2xl px-0 pb-8">
        <SheetHeader className="px-5 pb-3 border-b border-slate-100">
          <SheetTitle className="text-base text-left">
            {appointment.customerName}
          </SheetTitle>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge
              variant="outline"
              className={`text-xs border ${STATUS_BADGE_CLASS[appointment.status]}`}
            >
              {STATUS_LABELS[appointment.status]}
            </Badge>
            <span className="text-xs text-slate-400">
              {appointment.appointmentNumber} · {appointment.appointmentDate}
            </span>
          </div>
        </SheetHeader>

        <div className="px-5 pt-4 space-y-4">
          {/* Service info */}
          <div className="bg-slate-50 rounded-xl p-3 space-y-1">
            <p className="text-sm font-medium text-slate-900">
              {appointment.serviceName}
            </p>
            <p className="text-xs text-slate-500">
              {appointment.durationMinutes} dk · {appointment.servicePrice} ₺
            </p>
            <p className="text-xs text-slate-400">{appointment.customerPhone}</p>
          </div>

          {/* Status grid */}
          <div>
            <p className="text-xs font-medium text-slate-500 mb-2 uppercase tracking-wide">
              Durum Değiştir
            </p>
            <div className="grid grid-cols-2 gap-2">
              {ALL_STATUSES.map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    onStatusChange(appointment.id, s);
                    onClose();
                  }}
                  disabled={updating || appointment.status === s}
                  className={`py-2 px-3 rounded-xl text-xs font-medium border transition-all ${
                    appointment.status === s
                      ? STATUS_BADGE_CLASS[s] + " cursor-default"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 active:bg-slate-100"
                  } disabled:opacity-50`}
                >
                  {appointment.status === s
                    ? `✓ ${STATUS_LABELS[s]}`
                    : STATUS_LABELS[s]}
                </button>
              ))}
            </div>
          </div>

          {/* Delete */}
          <button
            onClick={() => {
              onDelete(appointment.id);
              onClose();
            }}
            disabled={deleting}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-red-200 bg-red-50 text-red-600 text-sm font-medium hover:bg-red-100 active:bg-red-200 transition-colors disabled:opacity-50"
          >
            {deleting ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Trash2 size={14} />
            )}
            Randevuyu Sil
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─── Appointment Card ─────────────────────────────────────────────────────────

function AppointmentCard({
  appointment: appt,
  isProcessing,
  onClick,
}: {
  appointment: Appointment;
  isProcessing: boolean;
  onClick: () => void;
}) {
  return (
    <Card
      className="border-slate-200 shadow-sm cursor-pointer active:scale-[0.99] transition-transform"
      onClick={onClick}
    >
      <CardContent className="pt-4 pb-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-slate-900">
              {appt.customerName}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              {appt.appointmentNumber} · {appt.appointmentDate}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {isProcessing && (
              <Loader2 size={13} className="animate-spin text-slate-400" />
            )}
            <Badge
              variant="outline"
              className={`text-xs border ${STATUS_BADGE_CLASS[appt.status]}`}
            >
              {STATUS_LABELS[appt.status]}
            </Badge>
          </div>
        </div>

        <p className="text-sm text-slate-700">
          {appt.serviceName} — {appt.durationMinutes} dk · {appt.servicePrice} ₺
        </p>

        <div className="flex items-center justify-between pt-1 border-t border-slate-100">
          <p className="text-xs text-slate-400">{appt.customerPhone}</p>
          <p className="text-xs text-slate-300">Detay için dokun →</p>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Dashboard Page ───────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);
  const [notifPermission, setNotifPermission] = useState<
    NotificationPermission | "unsupported"
  >("default");

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setNotifPermission("unsupported");
      return;
    }
    const perm = Notification.permission;
    setNotifPermission(perm);
    if (perm === "granted" && "serviceWorker" in navigator) {
      setTimeout(async () => {
        const adminKey = sessionStorage.getItem("admin_key");
        if (!adminKey) return;
        try {
          const reg = await navigator.serviceWorker.ready;
          const sub = await reg.pushManager.getSubscription();
          if (!sub) {
            const newSub = await subscribeToPush();
            if (newSub) await sendSubscriptionToBackend(newSub);
          }
        } catch (err) {
          console.error("Re-subscribe failed:", err);
        }
      }, 1000);
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
        prev.map((a) => (a.id === id ? { ...a, status } : a))
      );
      setSelectedAppt((prev) =>
        prev?.id === id ? { ...prev, status } : prev
      );
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Bu randevuyu kalıcı olarak silmek istiyor musunuz?")) return;
    setDeletingId(id);
    try {
      await deleteAppointment(id);
      setAppointments((prev) => prev.filter((a) => a.id !== id));
    } catch {
      alert("Randevu silinemedi.");
    } finally {
      setDeletingId(null);
    }
  }

  async function handleEnableNotifications() {
    const sub = await subscribeToPush();
    if (!sub) {
      setNotifPermission(
        "Notification" in window ? Notification.permission : "unsupported"
      );
      return;
    }
    try {
      await sendSubscriptionToBackend(sub);
      setNotifPermission("granted");
    } catch (err) {
      console.error("Saving push subscription failed:", err);
      setNotifPermission("default");
      alert("Bildirim izni verildi ama abonelik sunucuya kaydedilemedi.");
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

  // ── Stats ──
  const totalCustomers = new Set(appointments.map((a) => a.customerPhone)).size;
  const pendingCount   = appointments.filter((a) => a.status === "Pending").length;
  const confirmedCount = appointments.filter((a) => a.status === "Confirmed").length;
  const doneCount      = appointments.filter((a) => a.status === "Done").length;
  const cancelledCount = appointments.filter((a) => a.status === "Cancelled").length;
  const noShowCount    = appointments.filter((a) => a.status === "NoShow").length;

  const statCards = [
    {
      label: "Toplam Müşteri",
      value: totalCustomers,
      icon: Users,
      colorClass: "text-slate-700",
      bgClass: "bg-slate-50",
      borderClass: "border-slate-200",
    },
    {
      label: "Bekliyor",
      value: pendingCount,
      icon: Clock,
      colorClass: "text-yellow-700",
      bgClass: "bg-yellow-50",
      borderClass: "border-yellow-200",
    },
    {
      label: "Onaylandı",
      value: confirmedCount,
      icon: CheckCircle2,
      colorClass: "text-green-700",
      bgClass: "bg-green-50",
      borderClass: "border-green-200",
    },
    {
      label: "Tamamlandı",
      value: doneCount,
      icon: CalendarCheck2,
      colorClass: "text-blue-700",
      bgClass: "bg-blue-50",
      borderClass: "border-blue-200",
    },
    {
      label: "İptal",
      value: cancelledCount,
      icon: XCircle,
      colorClass: "text-red-600",
      bgClass: "bg-red-50",
      borderClass: "border-red-200",
    },
    {
      label: "Gelmedi",
      value: noShowCount,
      icon: MinusCircle,
      colorClass: "text-slate-400",
      bgClass: "bg-slate-50",
      borderClass: "border-slate-200",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* ── Header ── */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
        <div className="flex items-center justify-between px-4 h-14">
          <div>
            <h1 className="text-base font-semibold text-slate-900">
              Bugünkü Randevular
            </h1>
            <p className="text-xs text-slate-500 capitalize">{today}</p>
          </div>
          <div className="flex items-center gap-1">
            {notifPermission === "granted" ? (
              <NotificationBell />
            ) : notifPermission === "denied" ? (
              <Button
                variant="ghost"
                size="icon"
                disabled
                aria-label="Bildirimler engellendi"
                title="Tarayıcı bildirim iznini engelledi"
              >
                <BellOff size={17} className="text-slate-300" />
              </Button>
            ) : notifPermission === "unsupported" ? null : (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleEnableNotifications}
                aria-label="Bildirimleri etkinleştir"
                title="Bildirimleri etkinleştirmek için tıklayın"
              >
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
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={fetchAppointments}
              disabled={loading}
              aria-label="Yenile"
            >
              <RefreshCw size={17} className={loading ? "animate-spin" : ""} />
            </Button>
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

      <main className="px-4 pt-4 space-y-4">
        {/* ── Stats Grid ── */}
        {!loading && !error && (
          <div className="grid grid-cols-2 gap-2">
            {statCards.map(({ label, value, icon: Icon, colorClass, bgClass, borderClass }) => (
              <div
                key={label}
                className={`rounded-2xl border p-3 flex items-center justify-between ${bgClass} ${borderClass}`}
              >
                <div>
                  <p className="text-xs text-slate-500 mb-0.5">{label}</p>
                  <p className={`text-2xl font-bold ${colorClass}`}>{value}</p>
                </div>
                <Icon size={22} className={`${colorClass} opacity-60`} />
              </div>
            ))}
          </div>
        )}

        {/* ── Section label ── */}
        {!loading && !error && appointments.length > 0 && (
          <p className="text-xs text-slate-400 text-center pt-1">
            Bugünün Randevuları
          </p>
        )}

        {/* ── Loading ── */}
        {loading && (
          <div className="flex items-center justify-center py-16 text-slate-500">
            <Loader2 size={24} className="animate-spin mr-2" />
            <span className="text-sm">Yükleniyor...</span>
          </div>
        )}

        {/* ── Error ── */}
        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        {/* ── Empty ── */}
        {!loading && !error && appointments.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <CalendarClock size={40} strokeWidth={1.25} className="mb-3" />
            <p className="text-sm font-medium text-slate-600">
              Bugün randevu yok
            </p>
            <p className="text-xs mt-1">Tüm müsait gün!</p>
          </div>
        )}

        {/* ── Cards ── */}
        {!loading &&
          !error &&
          appointments.map((appt) => (
            <AppointmentCard
              key={appt.id}
              appointment={appt}
              isProcessing={updatingId === appt.id || deletingId === appt.id}
              onClick={() => setSelectedAppt(appt)}
            />
          ))}
      </main>

      {/* ── Shared Action Sheet ── */}
      <AppointmentSheet
        appointment={selectedAppt}
        updating={updatingId === selectedAppt?.id}
        deleting={deletingId === selectedAppt?.id}
        onStatusChange={handleStatusChange}
        onDelete={handleDelete}
        onClose={() => setSelectedAppt(null)}
      />

      <BottomNav />
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getTodayAppointments,
  updateAppointmentStatus,
  deleteAppointment,
  getServices,
  getAvailableSlots,
  createAppointment,
} from "@/lib/api";
import { subscribeToPush, sendSubscriptionToBackend } from "@/lib/push";
import type { Appointment, AppointmentStatus, Service } from "@/lib/types";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CalendarClock,
  ChevronDown,
  Loader2,
  RefreshCw,
  LogOut,
  BellOff,
  Plus,
  Trash2,
} from "lucide-react";

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

// ─── Booking Modal ────────────────────────────────────────────────────────────

function BookingModal({
  open,
  onClose,
  onBooked,
}: {
  open: boolean;
  onClose: () => void;
  onBooked: () => void;
}) {
  const [step, setStep] = useState<"form" | "slots" | "confirm" | "loading">(
    "form",
  );
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [services, setServices] = useState<Service[]>([]);
  const [serviceId, setServiceId] = useState("");
  const [date, setDate] = useState("");
  const [slots, setSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setStep("form");
    setPhone("");
    setName("");
    setServiceId("");
    setDate("");
    setSlots([]);
    setSelectedSlot("");
    setError("");
    getServices()
      .then(setServices)
      .catch(() => {});
  }, [open]);

  const todayStr = new Date().toISOString().split("T")[0];

  async function handleCheckSlots() {
    if (!phone || !serviceId || !date) {
      setError("Telefon, hizmet ve tarih zorunludur.");
      return;
    }
    setError("");
    setLoadingSlots(true);
    try {
      const available = await getAvailableSlots(date);
      if (available.length === 0) {
        setError("Bu tarihte müsait saat bulunmamaktadır.");
        setLoadingSlots(false);
        return;
      }
      setSlots(available);
      setSelectedSlot(available[0]);
      setStep("slots");
    } catch {
      setError("Müsait saatler yüklenemedi.");
    } finally {
      setLoadingSlots(false);
    }
  }

  async function handleBook() {
    if (!selectedSlot) return;
    setStep("loading");
    setError("");
    try {
      const dateTime = `${date}T${selectedSlot}:00`;
      await createAppointment({
        customerPhone: phone,
        customerName: name || undefined,
        serviceId,
        appointmentDate: dateTime,
      });
      onBooked();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Randevu oluşturulamadı.");
      setStep("slots");
    }
  }

  const selectedService = services.find((s) => s.id === serviceId);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm mx-auto">
        <DialogHeader>
          <DialogTitle>Yeni Randevu</DialogTitle>
        </DialogHeader>

        {step === "form" && (
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="phone">Telefon *</Label>
              <Input
                id="phone"
                placeholder="905XXXXXXXXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="name">İsim (opsiyonel)</Label>
              <Input
                id="name"
                placeholder="Müşteri adı"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Hizmet *</Label>
              <Select value={serviceId} onValueChange={setServiceId}>
                <SelectTrigger>
                  <SelectValue placeholder="Hizmet seçin" />
                </SelectTrigger>
                <SelectContent>
                  {services.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.serviceName} — {s.price} ₺
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="date">Tarih *</Label>
              <Input
                id="date"
                type="date"
                min={todayStr}
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            {error && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
                {error}
              </p>
            )}
            <Button
              className="w-full"
              onClick={handleCheckSlots}
              disabled={loadingSlots}
            >
              {loadingSlots ? (
                <Loader2 size={16} className="animate-spin mr-2" />
              ) : null}
              Müsait Saatleri Göster
            </Button>
          </div>
        )}

        {step === "slots" && (
          <div className="space-y-4 pt-2">
            <p className="text-sm text-slate-600">
              <span className="font-medium">{date}</span> tarihinde müsait
              saatler:
            </p>
            <div className="grid grid-cols-3 gap-2">
              {slots.map((slot) => (
                <button
                  key={slot}
                  onClick={() => setSelectedSlot(slot)}
                  className={`py-2 rounded-lg text-sm font-medium border transition-colors ${
                    selectedSlot === slot
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-white text-slate-700 border-slate-200 hover:border-slate-400"
                  }`}
                >
                  {slot}
                </button>
              ))}
            </div>
            {error && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
                {error}
              </p>
            )}
            <div className="pt-2 border-t border-slate-100 space-y-1 text-sm text-slate-600">
              <p>
                <span className="font-medium">Müşteri:</span> {phone}{" "}
                {name && `(${name})`}
              </p>
              <p>
                <span className="font-medium">Hizmet:</span>{" "}
                {selectedService?.serviceName}
              </p>
              <p>
                <span className="font-medium">Saat:</span> {selectedSlot}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setStep("form")}
              >
                Geri
              </Button>
              <Button
                className="flex-1"
                onClick={handleBook}
                disabled={!selectedSlot}
              >
                Randevuyu Onayla
              </Button>
            </div>
          </div>
        )}

        {step === "loading" && (
          <div className="flex flex-col items-center justify-center py-10 gap-3 text-slate-500">
            <Loader2 size={28} className="animate-spin" />
            <p className="text-sm">Randevu oluşturuluyor...</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
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
  const [bookingOpen, setBookingOpen] = useState(false);
  const [notifPermission, setNotifPermission] = useState<
    NotificationPermission | "unsupported"
  >("default");

  // ── Read actual browser permission + check existing subscription on mount ──
  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setNotifPermission("unsupported");
      return;
    }

    const perm = Notification.permission;
    setNotifPermission(perm);

    if (perm === "granted" && "serviceWorker" in navigator) {
      // Small delay to ensure sessionStorage is ready
      setTimeout(async () => {
        const adminKey = sessionStorage.getItem("admin_key");
        if (!adminKey) return; // Not logged in yet

        try {
          const reg = await navigator.serviceWorker.ready;
          const sub = await reg.pushManager.getSubscription();
          if (!sub) {
            console.log("🔔 No subscription found, re-subscribing...");
            const newSub = await subscribeToPush();
            if (newSub) {
              await sendSubscriptionToBackend(newSub);
              console.log("✅ Re-subscribed successfully");
            }
          }
        } catch (err) {
          console.error("Re-subscribe failed:", err);
        }
      }, 1000); // 1 second delay
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
        "Notification" in window ? Notification.permission : "unsupported",
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
            {/* Notification Bell */}
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
              deleting={deletingId === appt.id}
              onStatusChange={handleStatusChange}
              onDelete={handleDelete}
            />
          ))}
      </main>

      {/* FAB — New Appointment */}
      <button
        onClick={() => setBookingOpen(true)}
        className="fixed bottom-24 right-4 z-50 w-14 h-14 bg-slate-900 text-white rounded-full shadow-lg flex items-center justify-center active:scale-95 transition-transform"
        aria-label="Yeni randevu ekle"
      >
        <Plus size={24} />
      </button>

      <BookingModal
        open={bookingOpen}
        onClose={() => setBookingOpen(false)}
        onBooked={fetchAppointments}
      />

      <BottomNav />
    </div>
  );
}

// ─── Appointment Card ─────────────────────────────────────────────────────────

function AppointmentCard({
  appointment: appt,
  updating,
  deleting,
  onStatusChange,
  onDelete,
}: {
  appointment: Appointment;
  updating: boolean;
  deleting: boolean;
  onStatusChange: (id: string, status: AppointmentStatus) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <Card className="border-slate-200 shadow-sm">
      <CardContent className="pt-4 pb-3 space-y-2">
        {/* Top row */}
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

        {/* Bottom row */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-100">
          <p className="text-xs text-slate-400">{appt.customerPhone}</p>
          <div className="flex items-center gap-1.5">
            {/* Delete button */}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-slate-400 hover:text-red-500"
              onClick={() => onDelete(appt.id)}
              disabled={deleting}
              aria-label="Randevuyu sil"
            >
              {deleting ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <Trash2 size={13} />
              )}
            </Button>

            {/* Status dropdown */}
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
        </div>
      </CardContent>
    </Card>
  );
}

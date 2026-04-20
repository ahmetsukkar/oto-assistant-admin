"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getAppointments,
  updateAppointmentStatus,
  deleteAppointment,
  getServices,
  getAvailableSlots,
  createAppointment,
} from "@/lib/api";
import type { Appointment, AppointmentStatus, Service } from "@/lib/types";
import BottomNav from "@/components/BottomNav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw,
  Trash2,
  CalendarDays,
  List,
  Calendar,
  Plus,
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

const STATUS_BLOCK_CLASS: Record<AppointmentStatus, string> = {
  Pending: "bg-yellow-100 border-yellow-300 text-yellow-800",
  Confirmed: "bg-green-100 border-green-300 text-green-800",
  Cancelled: "bg-red-100 border-red-300 text-red-700 opacity-60",
  Done: "bg-blue-100 border-blue-300 text-blue-800",
  NoShow: "bg-slate-100 border-slate-300 text-slate-500 opacity-60",
};

const ALL_STATUSES: AppointmentStatus[] = [
  "Pending",
  "Confirmed",
  "Cancelled",
  "Done",
  "NoShow",
];

const DAY_NAMES_SHORT = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toDateStr(d: Date): string {
  return d.toISOString().split("T")[0];
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function getWeekStart(d: Date): Date {
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  return addDays(d, diff);
}

function parseHour(appointmentDate: string): number {
  const timePart = appointmentDate.split(" ")[1] ?? "00:00";
  const [h, m] = timePart.split(":").map(Number);
  return h + m / 60;
}

function formatTime(appointmentDate: string): string {
  return appointmentDate.split(" ")[1] ?? "";
}

function getDateStr(offset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return toDateStr(d);
}

// ─── Types ────────────────────────────────────────────────────────────────────

type ViewMode = "list" | "calendar";
type QuickFilter = "today" | "tomorrow" | "week" | "all";

// ─── Booking Modal ────────────────────────────────────────────────────────────

// ─── Booking Bottom Sheet ─────────────────────────────────────────────────────

function BookingModal({
  open,
  onClose,
  onBooked,
}: {
  open: boolean;
  onClose: () => void;
  onBooked: () => void;
}) {
  const [step, setStep] = useState<"form" | "slots" | "loading">("form");
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
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      {/*
        rounded-t-2xl + max-h-[92dvh] + overflow-y-auto:
        - Sheet slides up ABOVE the keyboard on mobile
        - Content is scrollable if keyboard shrinks the visible area
        - 92dvh leaves a small top gap so users know they can dismiss
      */}
      <SheetContent
        side="bottom"
        className="rounded-t-2xl px-0 pb-0 max-h-[92dvh] flex flex-col"
      >
        <SheetHeader className="px-5 pt-5 pb-3 border-b border-slate-100 shrink-0">
          <SheetTitle className="text-base text-left">Yeni Randevu</SheetTitle>
        </SheetHeader>

        <div className="overflow-y-auto flex-1 px-5 pb-8">

          {/* ── Step: form ── */}
          {step === "form" && (
            <div className="space-y-4 pt-4">
              <div className="space-y-1.5">
                <Label htmlFor="bk-phone" className="text-xs font-medium text-slate-700">
                  Telefon *
                </Label>
                <Input
                  id="bk-phone"
                  type="tel"
                  inputMode="numeric"
                  placeholder="905XXXXXXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="h-11 text-base" /* text-base prevents iOS zoom */
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="bk-name" className="text-xs font-medium text-slate-700">
                  İsim (opsiyonel)
                </Label>
                <Input
                  id="bk-name"
                  placeholder="Müşteri adı"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-11 text-base"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="bk-service" className="text-xs font-medium text-slate-700">
                  Hizmet *
                </Label>
                {/*
                  Native <select> instead of shadcn Select:
                  - On iOS → opens native wheel picker (full screen)
                  - On Android → opens native dialog (full screen)
                  - No floating dropdown that covers the form
                */}
                <select
                  id="bk-service"
                  value={serviceId}
                  onChange={(e) => setServiceId(e.target.value)}
                  className={`w-full h-11 rounded-md border px-3 text-base bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-1 ${
                    serviceId
                      ? "border-slate-300 text-slate-900"
                      : "border-slate-200 text-slate-400"
                  }`}
                >
                  <option value="" disabled>
                    Hizmet seçin
                  </option>
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.serviceName} — {s.price} ₺
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="bk-date" className="text-xs font-medium text-slate-700">
                  Tarih *
                </Label>
                <Input
                  id="bk-date"
                  type="date"
                  min={todayStr}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="h-11 text-base"
                />
              </div>

              {error && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
                  {error}
                </p>
              )}

              <Button
                className="w-full h-11 text-sm"
                onClick={handleCheckSlots}
                disabled={loadingSlots}
              >
                {loadingSlots && (
                  <Loader2 size={16} className="animate-spin mr-2" />
                )}
                Müsait Saatleri Göster
              </Button>
            </div>
          )}

          {/* ── Step: slots ── */}
          {step === "slots" && (
            <div className="space-y-4 pt-4">
              <p className="text-sm text-slate-600">
                <span className="font-medium">{date}</span> tarihinde müsait saatler:
              </p>

              <div className="grid grid-cols-3 gap-2">
                {slots.map((slot) => (
                  <button
                    key={slot}
                    onClick={() => setSelectedSlot(slot)}
                    className={`py-3 rounded-xl text-sm font-medium border transition-colors ${
                      selectedSlot === slot
                        ? "bg-slate-900 text-white border-slate-900"
                        : "bg-white text-slate-700 border-slate-200 hover:border-slate-400 active:bg-slate-50"
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>

              {error && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
                  {error}
                </p>
              )}

              <div className="pt-2 border-t border-slate-100 space-y-1.5 text-sm text-slate-600">
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

              <div className="flex gap-2 pt-1">
                <Button
                  variant="outline"
                  className="flex-1 h-11"
                  onClick={() => setStep("form")}
                >
                  Geri
                </Button>
                <Button
                  className="flex-1 h-11"
                  onClick={handleBook}
                  disabled={!selectedSlot}
                >
                  Randevuyu Onayla
                </Button>
              </div>
            </div>
          )}

          {/* ── Step: loading ── */}
          {step === "loading" && (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-500">
              <Loader2 size={28} className="animate-spin" />
              <p className="text-sm">Randevu oluşturuluyor...</p>
            </div>
          )}

        </div>
      </SheetContent>
    </Sheet>
  );
}

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
          <div className="bg-slate-50 rounded-xl p-3 space-y-1">
            <p className="text-sm font-medium text-slate-900">
              {appointment.serviceName}
            </p>
            <p className="text-xs text-slate-500">
              {appointment.durationMinutes} dk · {appointment.servicePrice} ₺
            </p>
            <p className="text-xs text-slate-400">
              {appointment.customerPhone}
            </p>
          </div>

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

// ─── AppointmentCard (list view) ──────────────────────────────────────────────

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

// ─── Calendar Week Strip ──────────────────────────────────────────────────────

function WeekStrip({
  weekStart,
  selectedDate,
  appointmentDates,
  onSelectDay,
  onPrevWeek,
  onNextWeek,
}: {
  weekStart: Date;
  selectedDate: Date;
  appointmentDates: Set<string>;
  onSelectDay: (d: Date) => void;
  onPrevWeek: () => void;
  onNextWeek: () => void;
}) {
  const todayStr = toDateStr(new Date());
  const weekEnd = addDays(weekStart, 6);
  const monthName = weekEnd.toLocaleDateString("tr-TR", {
    month: "long",
    year: "numeric",
  });
  const weekLabel = `${weekStart.getDate()} – ${weekEnd.getDate()} ${monthName}`;

  return (
    <div className="bg-white border-b border-slate-200 px-2 pt-2 pb-3">
      <div className="flex items-center justify-between mb-2 px-2">
        <button
          onClick={onPrevWeek}
          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 active:bg-slate-200 transition-colors text-slate-500"
          aria-label="Önceki hafta"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="text-xs font-medium text-slate-500 capitalize">
          {weekLabel}
        </span>
        <button
          onClick={onNextWeek}
          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 active:bg-slate-200 transition-colors text-slate-500"
          aria-label="Sonraki hafta"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: 7 }, (_, i) => {
          const day = addDays(weekStart, i);
          const dayStr = toDateStr(day);
          const isToday = dayStr === todayStr;
          const isSelected = dayStr === toDateStr(selectedDate);
          const hasAppts = appointmentDates.has(dayStr);

          return (
            <button
              key={dayStr}
              onClick={() => onSelectDay(day)}
              className={`flex flex-col items-center gap-1 py-1.5 rounded-xl transition-colors ${
                isSelected
                  ? "bg-slate-900 text-white"
                  : isToday
                    ? "bg-slate-100 text-slate-900"
                    : "hover:bg-slate-50 text-slate-600"
              }`}
            >
              <span
                className={`text-[10px] font-medium uppercase tracking-wide ${
                  isSelected ? "text-slate-300" : "text-slate-400"
                }`}
              >
                {DAY_NAMES_SHORT[day.getDay()]}
              </span>
              <span className="text-sm font-semibold leading-none">
                {day.getDate()}
              </span>
              <span
                className={`w-1 h-1 rounded-full ${
                  hasAppts
                    ? isSelected
                      ? "bg-white"
                      : "bg-slate-400"
                    : "bg-transparent"
                }`}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Calendar Timeline ────────────────────────────────────────────────────────

function CalendarTimeline({
  appointments,
  loading,
  updatingId,
  deletingId,
  selectedDate,
  onAppointmentClick,
}: {
  appointments: Appointment[];
  loading: boolean;
  updatingId: string | null;
  deletingId: string | null;
  selectedDate: Date;
  onAppointmentClick: (appt: Appointment) => void;
}) {
  const HOUR_START = 7;
  const HOUR_END = 21;
  const HOUR_HEIGHT = 64;
  const totalHeight = (HOUR_END - HOUR_START) * HOUR_HEIGHT;

  const dayLabel = selectedDate.toLocaleDateString("tr-TR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const now = new Date();
  const currentHour = now.getHours() + now.getMinutes() / 60;
  const isToday = toDateStr(selectedDate) === toDateStr(now);
  const nowTopPx = isToday
    ? Math.max(0, (currentHour - HOUR_START) * HOUR_HEIGHT)
    : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-slate-500">
        <Loader2 size={22} className="animate-spin mr-2" />
        <span className="text-sm">Yükleniyor...</span>
      </div>
    );
  }

  return (
    <div className="px-4 pt-3 pb-4">
      <p className="text-xs font-medium text-slate-500 capitalize mb-3">
        {dayLabel}
        {appointments.length > 0 && (
          <span className="ml-2 text-slate-400">
            · {appointments.length} randevu
          </span>
        )}
      </p>

      {appointments.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-slate-400">
          <CalendarClock size={36} strokeWidth={1.25} className="mb-3" />
          <p className="text-sm font-medium text-slate-600">
            Bu gün randevu yok
          </p>
          <p className="text-xs mt-1">Başka bir gün seçin</p>
        </div>
      )}

      {appointments.length > 0 && (
        <div className="relative" style={{ height: totalHeight }}>
          {Array.from({ length: HOUR_END - HOUR_START + 1 }, (_, i) => {
            const hour = HOUR_START + i;
            return (
              <div
                key={hour}
                className="absolute left-0 right-0 flex items-start"
                style={{ top: i * HOUR_HEIGHT }}
              >
                <span className="text-[10px] text-slate-300 w-10 shrink-0 leading-none -mt-px">
                  {String(hour).padStart(2, "0")}:00
                </span>
                <div className="flex-1 border-t border-slate-100 mt-[1px]" />
              </div>
            );
          })}

          {nowTopPx !== null && nowTopPx < totalHeight && (
            <div
              className="absolute left-10 right-0 flex items-center z-10 pointer-events-none"
              style={{ top: nowTopPx }}
            >
              <div className="w-2 h-2 rounded-full bg-red-500 shrink-0 -ml-1" />
              <div className="flex-1 border-t-2 border-red-400" />
            </div>
          )}

          {appointments.map((appt) => {
            const startHour = parseHour(appt.appointmentDate);
            const durationHours = appt.durationMinutes / 60;
            const topPx = (startHour - HOUR_START) * HOUR_HEIGHT;
            const heightPx = Math.max(durationHours * HOUR_HEIGHT, 36);
            const isProcessing =
              updatingId === appt.id || deletingId === appt.id;

            return (
              <button
                key={appt.id}
                onClick={() => onAppointmentClick(appt)}
                className={`absolute left-11 right-0 rounded-lg border px-2.5 py-1.5 text-left transition-all active:scale-[0.98] ${
                  STATUS_BLOCK_CLASS[appt.status]
                } ${isProcessing ? "opacity-50" : ""}`}
                style={{ top: topPx, height: heightPx }}
                aria-label={`${appt.customerName} – ${appt.serviceName}`}
              >
                <div className="flex items-start justify-between gap-1 h-full overflow-hidden">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold leading-tight truncate">
                      {formatTime(appt.appointmentDate)} {appt.customerName}
                    </p>
                    {heightPx >= 44 && (
                      <p className="text-[11px] leading-tight truncate opacity-75 mt-0.5">
                        {appt.serviceName}
                      </p>
                    )}
                    {heightPx >= 56 && (
                      <p className="text-[10px] leading-tight opacity-60 mt-0.5">
                        {appt.durationMinutes} dk · {appt.servicePrice} ₺
                      </p>
                    )}
                  </div>
                  {isProcessing && (
                    <Loader2
                      size={12}
                      className="animate-spin shrink-0 mt-0.5"
                    />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AppointmentsPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  // ── Shared ──
  const [allAppointments, setAllAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);
  const [bookingOpen, setBookingOpen] = useState(false);

  // ── List state ──
  const [quickFilter, setQuickFilter] = useState<QuickFilter>("today");
  const [customDate, setCustomDate] = useState("");
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | "">("");

  // ── Calendar state ──
  const [calSelectedDate, setCalSelectedDate] = useState<Date>(new Date());
  const [calWeekStart, setCalWeekStart] = useState<Date>(() =>
    getWeekStart(new Date()),
  );

  // ── Fetch all ──
  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getAppointments();
      setAllAppointments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Randevular yüklenemedi.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // ── Derived: list appointments ──
  const listAppointments = (() => {
    let filtered = [...allAppointments];

    if (customDate) {
      filtered = filtered.filter((a) =>
        a.appointmentDate.startsWith(customDate),
      );
    } else if (quickFilter === "today") {
      const d = getDateStr(0);
      filtered = filtered.filter((a) => a.appointmentDate.startsWith(d));
    } else if (quickFilter === "tomorrow") {
      const d = getDateStr(1);
      filtered = filtered.filter((a) => a.appointmentDate.startsWith(d));
    } else if (quickFilter === "week") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const weekEnd = addDays(today, 7);
      filtered = filtered.filter((a) => {
        const d = new Date(a.appointmentDate);
        return d >= today && d <= weekEnd;
      });
    }

    if (statusFilter) {
      filtered = filtered.filter((a) => a.status === statusFilter);
    }

    filtered.sort((a, b) => a.appointmentDate.localeCompare(b.appointmentDate));

    return filtered;
  })();

  // ── Derived: calendar day appointments ──
  const calDayStr = toDateStr(calSelectedDate);
  const calAppointments = allAppointments
    .filter((a) => a.appointmentDate.startsWith(calDayStr))
    .sort((a, b) => a.appointmentDate.localeCompare(b.appointmentDate));

  // ── Derived: week dots ──
  const calWeekDates = new Set<string>(
    allAppointments.map((a) => a.appointmentDate.split(" ")[0]),
  );

  // ── Status change ──
  async function handleStatusChange(id: string, status: AppointmentStatus) {
    setUpdatingId(id);
    try {
      await updateAppointmentStatus(id, status);
      setAllAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status } : a)),
      );
      setSelectedAppt((prev) => (prev?.id === id ? { ...prev, status } : prev));
    } finally {
      setUpdatingId(null);
    }
  }

  // ── Delete ──
  async function handleDelete(id: string) {
    if (!confirm("Bu randevuyu kalıcı olarak silmek istiyor musunuz?")) return;
    setDeletingId(id);
    try {
      await deleteAppointment(id);
      setAllAppointments((prev) => prev.filter((a) => a.id !== id));
    } catch {
      alert("Randevu silinemedi.");
    } finally {
      setDeletingId(null);
    }
  }

  const quickButtons: { key: QuickFilter; label: string }[] = [
    { key: "today", label: "Bugün" },
    { key: "tomorrow", label: "Yarın" },
    { key: "week", label: "Bu Hafta" },
    { key: "all", label: "Tümü" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* ── Header ── */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2">
            <CalendarDays size={18} className="text-slate-600" />
            <h1 className="text-base font-semibold text-slate-900">
              Randevular
            </h1>
          </div>
          <div className="flex items-center gap-1">
            {/* View toggle */}
            <div className="flex items-center bg-slate-100 rounded-lg p-0.5 mr-1">
              <button
                onClick={() => setViewMode("list")}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                  viewMode === "list"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
                aria-label="Liste görünümü"
              >
                <List size={13} />
                Liste
              </button>
              <button
                onClick={() => setViewMode("calendar")}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                  viewMode === "calendar"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
                aria-label="Takvim görünümü"
              >
                <Calendar size={13} />
                Takvim
              </button>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={fetchAll}
              disabled={loading}
              aria-label="Yenile"
            >
              <RefreshCw size={17} className={loading ? "animate-spin" : ""} />
            </Button>
          </div>
        </div>

        {/* ── List filters ── */}
        {viewMode === "list" && (
          <div className="px-4 pb-3 space-y-2">
            {/* Row 1: Quick date filters + date picker */}
            <div className="flex flex-wrap gap-1.5">
              {quickButtons.map((btn) => (
                <button
                  key={btn.key}
                  onClick={() => {
                    setQuickFilter(btn.key);
                    setCustomDate("");
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    quickFilter === btn.key && !customDate
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {btn.label}
                </button>
              ))}
              <input
                type="date"
                value={customDate}
                onChange={(e) => {
                  setCustomDate(e.target.value);
                  setQuickFilter("all");
                }}
                className={`h-7 px-2 rounded-full text-xs border transition-colors cursor-pointer ${
                  customDate
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 bg-slate-100 text-slate-600"
                }`}
              />
            </div>

            {/* Row 2: Status filters */}
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setStatusFilter("")}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  statusFilter === ""
                    ? "bg-slate-700 text-white"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                }`}
              >
                Tümü
              </button>
              {ALL_STATUSES.map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border ${
                    statusFilter === s
                      ? STATUS_BADGE_CLASS[s]
                      : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {STATUS_LABELS[s]}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Calendar week strip ── */}
        {viewMode === "calendar" && (
          <WeekStrip
            weekStart={calWeekStart}
            selectedDate={calSelectedDate}
            appointmentDates={calWeekDates}
            onSelectDay={setCalSelectedDate}
            onPrevWeek={() => setCalWeekStart((d) => addDays(d, -7))}
            onNextWeek={() => setCalWeekStart((d) => addDays(d, 7))}
          />
        )}
      </header>

      {/* ── List View ── */}
      {viewMode === "list" && (
        <main className="px-4 pt-4 space-y-3">
          {!loading && !error && listAppointments.length > 0 && (
            <p className="text-xs text-slate-400 px-1">
              {listAppointments.length} randevu listeleniyor
            </p>
          )}
          {loading && (
            <div className="flex items-center justify-center py-16 text-slate-500">
              <Loader2 size={24} className="animate-spin mr-2" />
              <span className="text-sm">Yükleniyor...</span>
            </div>
          )}
          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              {error}
            </div>
          )}
          {!loading && !error && listAppointments.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <CalendarClock size={40} strokeWidth={1.25} className="mb-3" />
              <p className="text-sm font-medium text-slate-600">
                Randevu bulunamadı
              </p>
              <p className="text-xs mt-1">Seçilen filtre için randevu yok</p>
            </div>
          )}
          {!loading &&
            !error &&
            listAppointments.map((appt) => (
              <AppointmentCard
                key={appt.id}
                appointment={appt}
                isProcessing={updatingId === appt.id || deletingId === appt.id}
                onClick={() => setSelectedAppt(appt)}
              />
            ))}
        </main>
      )}

      {/* ── Calendar View ── */}
      {viewMode === "calendar" && (
        <div className="overflow-y-auto">
          <CalendarTimeline
            appointments={calAppointments}
            loading={loading}
            updatingId={updatingId}
            deletingId={deletingId}
            selectedDate={calSelectedDate}
            onAppointmentClick={setSelectedAppt}
          />
        </div>
      )}

      {/* ── FAB ── */}
      <button
        onClick={() => setBookingOpen(true)}
        className="fixed bottom-24 right-4 z-50 w-14 h-14 bg-slate-900 text-white rounded-full shadow-lg flex items-center justify-center active:scale-95 transition-transform"
        aria-label="Yeni randevu ekle"
      >
        <Plus size={24} />
      </button>

      {/* ── Booking Modal ── */}
      <BookingModal
        open={bookingOpen}
        onClose={() => setBookingOpen(false)}
        onBooked={fetchAll}
      />

      {/* ── Action Sheet ── */}
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

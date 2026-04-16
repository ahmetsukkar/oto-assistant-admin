"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getAppointments,
  updateAppointmentStatus,
  deleteAppointment,
} from "@/lib/api";
import type { Appointment, AppointmentStatus } from "@/lib/types";
import BottomNav from "@/components/BottomNav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  CalendarClock,
  ChevronDown,
  Loader2,
  RefreshCw,
  Trash2,
  CalendarDays,
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

type QuickFilter = "today" | "tomorrow" | "week" | "all";

function getDateStr(offset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().split("T")[0];
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [quickFilter, setQuickFilter] = useState<QuickFilter>("today");
  const [customDate, setCustomDate] = useState("");
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | "">("");

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      let date: string | undefined;

      if (quickFilter === "today") date = getDateStr(0);
      else if (quickFilter === "tomorrow") date = getDateStr(1);
      else if (quickFilter === "week") date = undefined; // fetch all, filter client-side
      else if (quickFilter === "all") date = undefined;
      else date = customDate || undefined;

      const data = await getAppointments({
        date: quickFilter === "week" || quickFilter === "all" ? undefined : date,
        status: statusFilter || undefined,
      });

      // Client-side week filter
      if (quickFilter === "week") {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const weekEnd = new Date(today);
        weekEnd.setDate(weekEnd.getDate() + 7);
        setAppointments(
          data.filter((a) => {
            const d = new Date(a.appointmentDate);
            return d >= today && d <= weekEnd;
          }),
        );
      } else {
        setAppointments(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Randevular yüklenemedi.");
    } finally {
      setLoading(false);
    }
  }, [quickFilter, customDate, statusFilter]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

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

  const quickButtons: { key: QuickFilter; label: string }[] = [
    { key: "today", label: "Bugün" },
    { key: "tomorrow", label: "Yarın" },
    { key: "week", label: "Bu Hafta" },
    { key: "all", label: "Tümü" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2">
            <CalendarDays size={18} className="text-slate-600" />
            <h1 className="text-base font-semibold text-slate-900">Randevular</h1>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={fetchAppointments}
            disabled={loading}
            aria-label="Yenile"
          >
            <RefreshCw size={17} className={loading ? "animate-spin" : ""} />
          </Button>
        </div>

        {/* Quick filter tabs */}
        <div className="flex items-center gap-1.5 px-4 pb-3 overflow-x-auto">
          {quickButtons.map((btn) => (
            <button
              key={btn.key}
              onClick={() => {
                setQuickFilter(btn.key);
                setCustomDate("");
              }}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                quickFilter === btn.key && !customDate
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {btn.label}
            </button>
          ))}

          {/* Custom date picker */}
          <input
            type="date"
            value={customDate}
            onChange={(e) => {
              setCustomDate(e.target.value);
              setQuickFilter("all");
            }}
            className={`shrink-0 h-7 px-2 rounded-full text-xs border transition-colors cursor-pointer ${
              customDate
                ? "border-slate-900 bg-slate-900 text-white"
                : "border-slate-200 bg-slate-100 text-slate-600"
            }`}
          />
        </div>

        {/* Status filter */}
        <div className="flex items-center gap-1.5 px-4 pb-3 overflow-x-auto">
          <button
            onClick={() => setStatusFilter("")}
            className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
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
              className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors border ${
                statusFilter === s
                  ? STATUS_BADGE_CLASS[s]
                  : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"
              }`}
            >
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </header>

      <main className="px-4 pt-4 space-y-3">
        {/* Summary */}
        {!loading && !error && appointments.length > 0 && (
          <p className="text-xs text-slate-400 px-1">
            {appointments.length} randevu listeleniyor
          </p>
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
            <p className="text-sm font-medium text-slate-600">Randevu bulunamadı</p>
            <p className="text-xs mt-1">Seçilen filtre için randevu yok</p>
          </div>
        )}

        {/* Cards */}
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

      <BottomNav />
    </div>
  );
}

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

        <p className="text-sm text-slate-700">
          {appt.serviceName} — {appt.durationMinutes} dk · {appt.servicePrice} ₺
        </p>

        <div className="flex items-center justify-between pt-1 border-t border-slate-100">
          <p className="text-xs text-slate-400">{appt.customerPhone}</p>
          <div className="flex items-center gap-1.5">
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
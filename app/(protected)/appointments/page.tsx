// app/(protected)/appointments/page.tsx
"use client";

import { useEffect, useState } from "react";
import {
  getAppointments,
  updateAppointmentStatus,
  getServices,
  createAppointment,
} from "@/lib/api";
import type {
  Appointment,
  AppointmentStatus,
  Service,
  BookAppointmentPayload,
} from "@/lib/types";
import BottomNav from "@/components/BottomNav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  Plus,
  RefreshCw,
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

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [filterDate, setFilterDate] = useState("");
  const [filterStatus, setFilterStatus] = useState<AppointmentStatus | "">("");
  const [dialogOpen, setDialogOpen] = useState(false);

  async function fetchAppointments() {
    setLoading(true);
    setError("");
    try {
      const data = await getAppointments({
        date: filterDate || undefined,
        status: filterStatus || undefined,
      });
      setAppointments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Randevular yüklenemedi.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAppointments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
        <div className="flex items-center justify-between px-4 h-14">
          <h1 className="text-base font-semibold text-slate-900">Randevular</h1>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={fetchAppointments}
              disabled={loading}
              aria-label="Yenile"
            >
              <RefreshCw size={17} className={loading ? "animate-spin" : ""} />
            </Button>
            <NewAppointmentDialog
              open={dialogOpen}
              onOpenChange={setDialogOpen}
              onCreated={() => {
                setDialogOpen(false);
                fetchAppointments();
              }}
            />
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 px-4 pb-3">
          <Input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="h-8 text-sm flex-1"
          />
          <Select
            value={filterStatus || "all"}
            onValueChange={(v) =>
              setFilterStatus(v === "all" ? "" : (v as AppointmentStatus))
            }
          >
            <SelectTrigger className="h-8 text-sm w-36">
              <SelectValue placeholder="Tüm durumlar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm durumlar</SelectItem>
              {ALL_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {STATUS_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            size="sm"
            className="h-8 px-3 bg-slate-900 hover:bg-slate-800 text-white"
            onClick={fetchAppointments}
          >
            Filtrele
          </Button>
        </div>
      </header>

      <main className="px-4 pt-4 space-y-3">
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
        {!loading && !error && appointments.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <CalendarClock size={40} strokeWidth={1.25} className="mb-3" />
            <p className="text-sm font-medium text-slate-600">
              Randevu bulunamadı
            </p>
            <p className="text-xs mt-1">Filtre değiştirmeyi deneyin</p>
          </div>
        )}
        {!loading &&
          !error &&
          appointments.map((appt) => (
            <Card key={appt.id} className="border-slate-200 shadow-sm">
              <CardContent className="pt-4 pb-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {appt.customerName}
                    </p>
                    <p className="text-xs text-slate-500">
                      {appt.appointmentNumber} · {appt.appointmentDate}
                    </p>
                  </div>
                  <Badge
                    className={`shrink-0 text-xs border ${STATUS_BADGE_CLASS[appt.status]}`}
                    variant="outline"
                  >
                    {STATUS_LABELS[appt.status]}
                  </Badge>
                </div>
                <p className="text-sm text-slate-700">
                  {appt.serviceName} — {appt.durationMinutes} dk ·{" "}
                  {appt.servicePrice} ₺
                </p>
                <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                  <p className="text-xs text-slate-400">{appt.customerPhone}</p>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs gap-1"
                        disabled={updatingId === appt.id}
                      >
                        {updatingId === appt.id ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <>
                            <ChevronDown size={12} /> Durum
                          </>
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {ALL_STATUSES.map((s) => (
                        <DropdownMenuItem
                          key={s}
                          onClick={() => handleStatusChange(appt.id, s)}
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
          ))}
      </main>
      <BottomNav />
    </div>
  );
}

function NewAppointmentDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated: () => void;
}) {
  const [services, setServices] = useState<Service[]>([]);
  const [form, setForm] = useState<BookAppointmentPayload>({
    customerPhone: "",
    customerName: "",
    serviceId: "",
    appointmentDate: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      getServices()
        .then(setServices)
        .catch(() => {});
    }
  }, [open]);

  function handleChange(field: keyof BookAppointmentPayload, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.customerPhone || !form.serviceId || !form.appointmentDate) {
      setError("Lütfen zorunlu alanları doldurun.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      // Convert datetime-local value to ISO format
      const isoDate = new Date(form.appointmentDate).toISOString().slice(0, 19);
      await createAppointment({ ...form, appointmentDate: isoDate });
      setForm({
        customerPhone: "",
        customerName: "",
        serviceId: "",
        appointmentDate: "",
      });
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Randevu oluşturulamadı.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          className="h-8 bg-slate-900 hover:bg-slate-800 text-white gap-1"
        >
          <Plus size={15} /> Yeni
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Yeni Randevu</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="phone">Telefon *</Label>
            <Input
              id="phone"
              placeholder="05xx xxx xx xx"
              value={form.customerPhone}
              onChange={(e) => handleChange("customerPhone", e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="name">Ad Soyad</Label>
            <Input
              id="name"
              placeholder="Müşteri adı (opsiyonel)"
              value={form.customerName}
              onChange={(e) => handleChange("customerName", e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="service">Hizmet *</Label>
            <Select
              value={form.serviceId}
              onValueChange={(v) => handleChange("serviceId", v)}
            >
              <SelectTrigger id="service">
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
            <Label htmlFor="date">Tarih & Saat *</Label>
            <Input
              id="date"
              type="datetime-local"
              value={form.appointmentDate}
              onChange={(e) => handleChange("appointmentDate", e.target.value)}
            />
          </div>
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {error}
            </p>
          )}
          <Button
            type="submit"
            className="w-full bg-slate-900 hover:bg-slate-800 text-white"
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader2 size={15} className="animate-spin mr-2" />
                Kaydediliyor...
              </>
            ) : (
              "Randevu Oluştur"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useEffect, useState, useCallback } from "react";
import { getCustomers, getAppointments } from "@/lib/api";
import type { Appointment, AppointmentStatus, Customer } from "@/lib/types";
import BottomNav from "@/components/BottomNav";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Loader2,
  Search,
  Users,
  Phone,
  CalendarClock,
  ChevronRight,
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

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // History sheet state
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [history, setHistory] = useState<Appointment[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getCustomers(debouncedSearch || undefined);
      setCustomers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Müşteriler yüklenemedi.");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  async function handleOpenHistory(customer: Customer) {
    setSelectedCustomer(customer);
    setHistory([]);
    setHistoryError("");
    setHistoryLoading(true);
    try {
      // Fetch all appointments for this customer's phone number
      const data = await getAppointments();
      const filtered = data.filter(
        (a) => a.customerPhone === customer.phone,
      );
      // Sort newest first
      filtered.sort(
        (a, b) =>
          new Date(b.appointmentDate).getTime() -
          new Date(a.appointmentDate).getTime(),
      );
      setHistory(filtered);
    } catch (err) {
      setHistoryError(
        err instanceof Error ? err.message : "Geçmiş yüklenemedi.",
      );
    } finally {
      setHistoryLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
        <div className="flex items-center gap-2 px-4 h-14">
          <Users size={18} className="text-slate-600 shrink-0" />
          <h1 className="text-base font-semibold text-slate-900">Müşteriler</h1>
        </div>
        <div className="px-4 pb-3">
          <div className="relative">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <Input
              placeholder="İsim veya telefon ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>
        </div>
      </header>

      <main className="px-4 pt-4 space-y-2">
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

        {!loading && !error && customers.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <Users size={40} strokeWidth={1.25} className="mb-3" />
            <p className="text-sm font-medium text-slate-600">Müşteri bulunamadı</p>
          </div>
        )}

        {!loading &&
          !error &&
          customers.map((customer) => (
            <Card
              key={customer.id}
              className="border-slate-200 shadow-sm cursor-pointer active:scale-[0.99] transition-transform"
              onClick={() => handleOpenHistory(customer)}
            >
              <CardContent className="pt-3 pb-3">
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">
                      {customer.name || "—"}
                    </p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Phone size={11} className="text-slate-400 shrink-0" />
                      <p className="text-xs text-slate-500">{customer.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      <CalendarClock size={12} className="text-slate-400" />
                      {customer.totalAppointments}
                    </div>
                    <ChevronRight size={15} className="text-slate-300" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
      </main>

      {/* Customer History Sheet */}
      <Sheet
        open={!!selectedCustomer}
        onOpenChange={(v) => !v && setSelectedCustomer(null)}
      >
        <SheetContent side="bottom" className="h-[80vh] rounded-t-2xl px-0">
          <SheetHeader className="px-5 pb-3 border-b border-slate-100">
            <SheetTitle className="text-base">
              {selectedCustomer?.name || selectedCustomer?.phone}
            </SheetTitle>
            <p className="text-xs text-slate-500">{selectedCustomer?.phone}</p>
          </SheetHeader>

          <div className="overflow-y-auto h-[calc(100%-70px)] px-4 pt-4 space-y-3">
            {historyLoading && (
              <div className="flex items-center justify-center py-10 text-slate-500">
                <Loader2 size={22} className="animate-spin mr-2" />
                <span className="text-sm">Yükleniyor...</span>
              </div>
            )}

            {historyError && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                {historyError}
              </div>
            )}

            {!historyLoading && !historyError && history.length === 0 && (
              <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                <CalendarClock size={32} strokeWidth={1.25} className="mb-2" />
                <p className="text-sm">Randevu geçmişi bulunamadı</p>
              </div>
            )}

            {!historyLoading &&
              !historyError &&
              history.map((appt) => (
                <Card key={appt.id} className="border-slate-200">
                  <CardContent className="pt-3 pb-3 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs font-medium text-slate-700">
                          {appt.serviceName}
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
                    <p className="text-xs text-slate-400">
                      {appt.durationMinutes} dk · {appt.servicePrice} ₺
                    </p>
                  </CardContent>
                </Card>
              ))}
          </div>
        </SheetContent>
      </Sheet>

      <BottomNav />
    </div>
  );
}
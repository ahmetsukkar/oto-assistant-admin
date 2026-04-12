// app/(protected)/customers/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { getCustomers } from "@/lib/api";
import type { Customer } from "@/lib/types";
import BottomNav from "@/components/BottomNav";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Users, Loader2, Search } from "lucide-react";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const fetchCustomers = useCallback(async (q?: string) => {
    setLoading(true);
    setError("");
    try {
      const data = await getCustomers(q);
      setCustomers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Müşteriler yüklenemedi.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCustomers(search || undefined);
    }, 400);
    return () => clearTimeout(timer);
  }, [search, fetchCustomers]);

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
        <div className="flex items-center px-4 h-14">
          <h1 className="text-base font-semibold text-slate-900">Müşteriler</h1>
        </div>
        <div className="px-4 pb-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="İsim veya telefon ile ara..."
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
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">{error}</div>
        )}
        {!loading && !error && customers.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <Users size={40} strokeWidth={1.25} className="mb-3" />
            <p className="text-sm font-medium text-slate-600">
              {search ? "Müşteri bulunamadı" : "Henüz müşteri yok"}
            </p>
          </div>
        )}
        {!loading && !error && customers.map((c) => (
          <Card key={c.id} className="border-slate-200 shadow-sm">
            <CardContent className="py-3 px-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-900">{c.name}</p>
                <p className="text-xs text-slate-500 mt-0.5">{c.phone}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-slate-900">{c.totalAppointments}</p>
                <p className="text-xs text-slate-400">randevu</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </main>
      <BottomNav />
    </div>
  );
}
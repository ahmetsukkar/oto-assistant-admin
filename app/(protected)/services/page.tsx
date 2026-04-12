// app/(protected)/services/page.tsx
"use client";

import { useEffect, useState } from "react";
import { getServices, createService, updateService, deleteService } from "@/lib/api";
import type { Service, ServicePayload } from "@/lib/types";
import BottomNav from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, Pencil, Plus, Trash2, Wrench } from "lucide-react";

const EMPTY_FORM: ServicePayload = { serviceName: "", price: 0, durationMinutes: 30 };

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Service | null>(null);
  const [form, setForm] = useState<ServicePayload>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  async function fetchServices() {
    setLoading(true);
    setError("");
    try {
      const data = await getServices();
      setServices(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Hizmetler yüklenemedi.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchServices(); }, []);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setDialogOpen(true);
  }

  function openEdit(service: Service) {
    setEditing(service);
    setForm({
      serviceName: service.serviceName,
      price: service.price,
      durationMinutes: service.durationMinutes,
    });
    setFormError("");
    setDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.serviceName.trim()) {
      setFormError("Hizmet adı zorunludur.");
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      if (editing) {
        const updated = await updateService(editing.id, form);
        setServices((prev) => prev.map((s) => s.id === updated.id ? updated : s));
      } else {
        const created = await createService(form);
        setServices((prev) => [...prev, created]);
      }
      setDialogOpen(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "İşlem başarısız.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteService(deleteTarget.id);
      setServices((prev) => prev.filter((s) => s.id !== deleteTarget.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Silme işlemi başarısız.");
    } finally {
      setDeleteTarget(null);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
        <div className="flex items-center justify-between px-4 h-14">
          <h1 className="text-base font-semibold text-slate-900">Hizmetler</h1>
          <Button size="sm" className="h-8 bg-slate-900 hover:bg-slate-800 text-white gap-1" onClick={openCreate}>
            <Plus size={15} /> Yeni Hizmet
          </Button>
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
        {!loading && !error && services.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <Wrench size={40} strokeWidth={1.25} className="mb-3" />
            <p className="text-sm font-medium text-slate-600">Henüz hizmet yok</p>
            <p className="text-xs mt-1">Yeni hizmet eklemek için butona tıklayın</p>
          </div>
        )}
        {!loading && !error && services.map((s) => (
          <Card key={s.id} className="border-slate-200 shadow-sm">
            <CardContent className="py-3 px-4 flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">{s.serviceName}</p>
                <p className="text-xs text-slate-500 mt-0.5">{s.durationMinutes} dk · {s.price} ₺</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500" onClick={() => openEdit(s)} aria-label="Düzenle">
                  <Pencil size={15} />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                  onClick={() => setDeleteTarget(s)} aria-label="Sil">
                  <Trash2 size={15} />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </main>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editing ? "Hizmeti Düzenle" : "Yeni Hizmet"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="serviceName">Hizmet Adı *</Label>
              <Input id="serviceName" placeholder="Örn: Yağ Değişimi"
                value={form.serviceName}
                onChange={(e) => setForm((p) => ({ ...p, serviceName: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="price">Fiyat (₺) *</Label>
                <Input id="price" type="number" min="0" step="0.01" placeholder="500"
                  value={form.price || ""}
                  onChange={(e) => setForm((p) => ({ ...p, price: parseFloat(e.target.value) || 0 }))} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="duration">Süre (dk) *</Label>
                <Input id="duration" type="number" min="5" step="5" placeholder="30"
                  value={form.durationMinutes || ""}
                  onChange={(e) => setForm((p) => ({ ...p, durationMinutes: parseInt(e.target.value) || 0 }))} />
              </div>
            </div>
            {formError && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">{formError}</p>
            )}
            <Button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white" disabled={saving}>
              {saving ? <><Loader2 size={15} className="animate-spin mr-2" />Kaydediliyor...</> : (editing ? "Güncelle" : "Hizmet Ekle")}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hizmeti sil?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{deleteTarget?.serviceName}</strong> hizmetini silmek istediğinize emin misiniz?
              Aktif randevusu olan hizmetler silinemez.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white">
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <BottomNav />
    </div>
  );
}
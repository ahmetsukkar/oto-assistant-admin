"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getWorkshopSettings,
  updateWorkshopSettings,
  getSlotStatuses,
  updateSlot,
} from "@/lib/api";
import type { SlotStatus, WorkshopSettings } from "@/lib/types";
import BottomNav from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Settings, Save, Clock } from "lucide-react";

const DAYS = [
  { key: "mondayOpen" as keyof WorkshopSettings, label: "Pazartesi", dow: 1 },
  { key: "tuesdayOpen" as keyof WorkshopSettings, label: "Salı", dow: 2 },
  { key: "wednesdayOpen" as keyof WorkshopSettings, label: "Çarşamba", dow: 3 },
  { key: "thursdayOpen" as keyof WorkshopSettings, label: "Perşembe", dow: 4 },
  { key: "fridayOpen" as keyof WorkshopSettings, label: "Cuma", dow: 5 },
  { key: "saturdayOpen" as keyof WorkshopSettings, label: "Cumartesi", dow: 6 },
  { key: "sundayOpen" as keyof WorkshopSettings, label: "Pazar", dow: 0 },
];

const anyDayOpen = (s: WorkshopSettings) =>
  DAYS.some((d) => s[d.key] as boolean);

export default function SettingsPage() {
  const [settings, setSettings] = useState<WorkshopSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState("");

  // Slot editor state
  const [selectedDow, setSelectedDow] = useState<number>(1);
  const [slots, setSlots] = useState<SlotStatus[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [togglingSlot, setTogglingSlot] = useState<string | null>(null);

  // ── Load settings on mount ─────────────────────────────────────────────────
  useEffect(() => {
    getWorkshopSettings()
      .then(setSettings)
      .catch(() => setError("Ayarlar yüklenemedi."))
      .finally(() => setLoading(false));
  }, []);

  // ── Load slots for selected day ────────────────────────────────────────────
  const loadSlots = useCallback(async (dow: number) => {
    setSlotsLoading(true);
    try {
      const data = await getSlotStatuses(dow);
      setSlots(data);
    } catch {
      setSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSlots(selectedDow);
  }, [selectedDow, loadSlots]);

  // ── Save settings → backend syncs slots → reload slot grid ────────────────
  async function handleSaveSettings() {
    if (!settings) return;
    setSaving(true);
    setError("");
    setSaveSuccess(false);
    try {
      const updated = await updateWorkshopSettings({
        workStartTime: settings.workStartTime,
        workEndTime: settings.workEndTime,
        slotDurationMinutes: settings.slotDurationMinutes,
        sundayOpen: settings.sundayOpen,
        mondayOpen: settings.mondayOpen,
        tuesdayOpen: settings.tuesdayOpen,
        wednesdayOpen: settings.wednesdayOpen,
        thursdayOpen: settings.thursdayOpen,
        fridayOpen: settings.fridayOpen,
        saturdayOpen: settings.saturdayOpen,
      });
      setSettings(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
      // Backend ran SyncSlotsAsync — reload the slot grid so UI reflects new state
      await loadSlots(selectedDow);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ayarlar kaydedilemedi.");
    } finally {
      setSaving(false);
    }
  }

  // ── Toggle a single slot ───────────────────────────────────────────────────
  async function handleToggleSlot(slot: SlotStatus) {
    setTogglingSlot(slot.slotTime);
    try {
      await updateSlot({
        dayOfWeek: selectedDow,
        slotTime: slot.slotTime,
        isEnabled: !slot.isEnabled,
      });
      // Optimistic update
      setSlots((prev) =>
        prev.map((s) =>
          s.slotTime === slot.slotTime ? { ...s, isEnabled: !s.isEnabled } : s,
        ),
      );
    } catch {
      // Revert on error
      loadSlots(selectedDow);
    } finally {
      setTogglingSlot(null);
    }
  }

  // ── Toggle open/closed for a day (local only — saved on Kaydet) ───────────
  function handleDayToggle(key: keyof WorkshopSettings) {
    if (!settings) return;
    setSettings({ ...settings, [key]: !settings[key] });
  }

  // ── Time helpers ───────────────────────────────────────────────────────────
  // "HH:mm:ss" → "HH:mm" for <input type="time">
  function toTimeInput(val: string): string {
    return val?.slice(0, 5) ?? "";
  }
  // "HH:mm" → "HH:mm:00" for API
  function fromTimeInput(val: string): string {
    return val + ":00";
  }

  const selectedDay = DAYS.find((d) => d.dow === selectedDow);
  const isDayOpen = settings
    ? (settings[selectedDay?.key ?? "mondayOpen"] as boolean)
    : false;

  // ── Loading screen ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center pb-20">
        <Loader2 size={28} className="animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2">
            <Settings size={18} className="text-slate-600" />
            <h1 className="text-base font-semibold text-slate-900">
              Çalışma Saatleri
            </h1>
          </div>
          <Button
            size="sm"
            className="gap-1.5 h-8 text-xs"
            onClick={handleSaveSettings}
            disabled={saving || !settings}
          >
            {saving ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <Save size={13} />
            )}
            {saveSuccess ? "Kaydedildi ✓" : "Kaydet"}
          </Button>
        </div>
      </header>

      <main className="px-4 pt-4 space-y-4">
        {/* Error */}
        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        {settings && (
          <>
            {/* ── Genel Ayarlar ─────────────────────────────────────────────── */}
            <Card className="border-slate-200">
              <CardHeader className="pb-3 pt-4">
                <CardTitle className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                  <Clock size={15} />
                  Genel Ayarlar
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pb-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Açılış Saati</Label>
                    <Input
                      type="time"
                      value={toTimeInput(settings.workStartTime)}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          workStartTime: fromTimeInput(e.target.value),
                        })
                      }
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Kapanış Saati</Label>
                    <Input
                      type="time"
                      value={toTimeInput(settings.workEndTime)}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          workEndTime: fromTimeInput(e.target.value),
                        })
                      }
                      className="h-9 text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Slot Süresi (dakika)</Label>
                  <div className="flex gap-2">
                    {[30, 60, 90, 120].map((m) => (
                      <button
                        key={m}
                        onClick={() =>
                          setSettings({ ...settings, slotDurationMinutes: m })
                        }
                        className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-colors ${
                          settings.slotDurationMinutes === m
                            ? "bg-slate-900 text-white border-slate-900"
                            : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
                        }`}
                      >
                        {m} dk
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ── Günler ────────────────────────────────────────────────────── */}
            <Card className="border-slate-200">
              <CardHeader className="pb-3 pt-4">
                <CardTitle className="text-sm font-semibold text-slate-800">
                  Günler
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-4 space-y-3">
                <div className="grid grid-cols-7 gap-1.5">
                  {DAYS.map((day) => {
                    const isOpen = settings[day.key] as boolean;
                    return (
                      <button
                        key={day.key}
                        onClick={() => handleDayToggle(day.key)}
                        className={`flex flex-col items-center py-2.5 rounded-lg text-xs font-medium border transition-colors ${
                          isOpen
                            ? "bg-green-50 text-green-700 border-green-200"
                            : "bg-slate-50 text-slate-400 border-slate-200"
                        }`}
                      >
                        <span>{day.label.slice(0, 3)}</span>
                        <span className="mt-1 text-[10px]">
                          {isOpen ? "Açık" : "Kapalı"}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-slate-400">
                  Günleri değiştirdikten sonra <strong>Kaydet</strong>&apos;e
                  basın.
                </p>
              </CardContent>
            </Card>

            {/* ── Saat Slotları ─────────────────────────────────────────────── */}
            <Card className="border-slate-200">
              <CardHeader className="pb-3 pt-4">
                <CardTitle className="text-sm font-semibold text-slate-800">
                  Saat Slotları
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-4 space-y-3">

                {/* Case 1: No days open at all → first setup notice */}
                {!anyDayOpen(settings) && (
                  <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-3 leading-relaxed">
                    ⚠️ Henüz hiçbir gün açık değil. Yukarıdan çalışma günlerini
                    seçin, ardından{" "}
                    <strong>Kaydet</strong>&apos;e basın — slotlar otomatik
                    oluşturulacak.
                  </div>
                )}

                {/* Case 2: At least one day is open → show day selector + grid */}
                {anyDayOpen(settings) && (
                  <>
                    {/* Day tab selector — only open days shown */}
                    <div className="flex gap-1.5 overflow-x-auto pb-1">
                      {DAYS.filter((d) => settings[d.key] as boolean).map(
                        (day) => (
                          <button
                            key={day.dow}
                            onClick={() => setSelectedDow(day.dow)}
                            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                              selectedDow === day.dow
                                ? "bg-slate-900 text-white"
                                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            }`}
                          >
                            {day.label.slice(0, 3)}
                          </button>
                        ),
                      )}
                    </div>

                    {/* Selected day is closed (user toggled it off but hasn't saved) */}
                    {!isDayOpen && (
                      <div className="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5">
                        {selectedDay?.label} kapalı olarak işaretlenmiş.
                        Kaydettiğinizde slotlar kaldırılacak.
                      </div>
                    )}

                    {/* Slot grid */}
                    {isDayOpen && (
                      <>
                        {slotsLoading ? (
                          <div className="flex items-center justify-center py-8 text-slate-400">
                            <Loader2 size={20} className="animate-spin" />
                          </div>
                        ) : slots.length === 0 ? (
                          <div className="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-3 py-3">
                            Henüz slot yok. <strong>Kaydet</strong>&apos;e
                            basın — slotlar otomatik oluşturulacak.
                          </div>
                        ) : (
                          <>
                            <p className="text-xs text-slate-400">
                              Slota tıklayarak açık / kapalı yapabilirsiniz.
                            </p>
                            <div className="grid grid-cols-4 gap-2">
                              {slots.map((slot) => (
                                <button
                                  key={slot.slotTime}
                                  onClick={() => handleToggleSlot(slot)}
                                  disabled={togglingSlot === slot.slotTime}
                                  className={`relative py-2.5 rounded-lg text-xs font-medium border transition-colors ${
                                    slot.isEnabled
                                      ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                                      : "bg-red-50 text-red-500 border-red-200 hover:bg-red-100 line-through"
                                  }`}
                                >
                                  {togglingSlot === slot.slotTime ? (
                                    <Loader2
                                      size={12}
                                      className="animate-spin mx-auto"
                                    />
                                  ) : (
                                    slot.slotTime
                                  )}
                                </button>
                              ))}
                            </div>
                            {/* Legend */}
                            <div className="flex items-center gap-4 pt-1">
                              <div className="flex items-center gap-1.5">
                                <span className="w-3 h-3 rounded bg-green-100 border border-green-200 inline-block" />
                                <span className="text-xs text-slate-500">
                                  Açık
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="w-3 h-3 rounded bg-red-50 border border-red-200 inline-block" />
                                <span className="text-xs text-slate-500">
                                  Kapalı
                                </span>
                              </div>
                            </div>
                          </>
                        )}
                      </>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import {
  getWhatsAppProfile,
  updateWhatsAppProfile,
  uploadWhatsAppProfilePicture,
  type WhatsAppProfileResponse,
  type WhatsAppProfileSupported,
} from "@/lib/api";
import BottomNav from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  Save,
  ChevronLeft,
  MessageCircle,
  Upload,
  Plus,
  Trash2,
  Info,
  Lock,
} from "lucide-react";

// Meta's documented business verticals
const VERTICALS = [
  { value: "", label: "—" },
  { value: "AUTO", label: "Otomotiv" },
  { value: "BEAUTY", label: "Güzellik" },
  { value: "APPAREL", label: "Giyim" },
  { value: "EDU", label: "Eğitim" },
  { value: "ENTERTAIN", label: "Eğlence" },
  { value: "EVENT_PLAN", label: "Etkinlik Planlama" },
  { value: "FINANCE", label: "Finans" },
  { value: "GROCERY", label: "Market" },
  { value: "GOVT", label: "Devlet" },
  { value: "HOTEL", label: "Otel" },
  { value: "HEALTH", label: "Sağlık" },
  { value: "NONPROFIT", label: "Kar Amacı Gütmeyen" },
  { value: "PROF_SERVICES", label: "Profesyonel Hizmetler" },
  { value: "RETAIL", label: "Perakende" },
  { value: "TRAVEL", label: "Seyahat" },
  { value: "RESTAURANT", label: "Restoran" },
  { value: "OTHER", label: "Diğer" },
];

interface FormState {
  about: string;
  address: string;
  description: string;
  email: string;
  websites: string[];
  vertical: string;
}

export default function WhatsAppProfilePage() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<WhatsAppProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [form, setForm] = useState<FormState>({
    about: "",
    address: "",
    description: "",
    email: "",
    websites: [],
    vertical: "",
  });

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  // ── Load profile ──────────────────────────────────────────────────────────
  useEffect(() => {
    getWhatsAppProfile()
      .then((p) => {
        setProfile(p);
        if (p.supported) {
          setForm({
            about: p.about ?? "",
            address: p.address ?? "",
            description: p.description ?? "",
            email: p.email ?? "",
            websites: p.websites ?? [],
            vertical: p.vertical ?? "",
          });
        }
      })
      .catch((e) =>
        setError(e instanceof Error ? e.message : "Profil yüklenemedi."),
      )
      .finally(() => setLoading(false));
  }, []);

  // ── Save text fields ──────────────────────────────────────────────────────
  async function handleSave() {
    setSaving(true);
    setError("");
    setSaveSuccess(false);
    try {
      const updated = await updateWhatsAppProfile({
        about: form.about.trim() || null,
        address: form.address.trim() || null,
        description: form.description.trim() || null,
        email: form.email.trim() || null,
        websites: form.websites.filter((w) => w.trim().length > 0),
        vertical: form.vertical || null,
      });
      setProfile(updated);
      if (updated.supported) {
        setForm({
          about: updated.about ?? "",
          address: updated.address ?? "",
          description: updated.description ?? "",
          email: updated.email ?? "",
          websites: updated.websites ?? [],
          vertical: updated.vertical ?? "",
        });
      }
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Kaydedilemedi.");
    } finally {
      setSaving(false);
    }
  }

  // ── Upload profile picture ────────────────────────────────────────────────
  async function handlePictureSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError("");
    try {
      const result = await uploadWhatsAppProfilePicture(file);
      // Refresh the profile so the new picture URL is reflected
      const fresh = await getWhatsAppProfile();
      setProfile(fresh);
      // Clear the file input so the same file can be re-uploaded if needed
      if (fileInputRef.current) fileInputRef.current.value = "";
      // Show the new URL even if backend returned it
      void result;
    } catch (e) {
      setUploadError(
        e instanceof Error ? e.message : "Fotoğraf yüklenemedi.",
      );
    } finally {
      setUploading(false);
    }
  }

  // ── Website helpers ───────────────────────────────────────────────────────
  function addWebsite() {
    if (form.websites.length >= 2) return;
    setForm({ ...form, websites: [...form.websites, ""] });
  }
  function removeWebsite(i: number) {
    setForm({
      ...form,
      websites: form.websites.filter((_, idx) => idx !== i),
    });
  }
  function updateWebsite(i: number, value: string) {
    setForm({
      ...form,
      websites: form.websites.map((w, idx) => (idx === i ? value : w)),
    });
  }

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center pb-20">
        <Loader2 size={28} className="animate-spin text-slate-400" />
      </div>
    );
  }

  // ── Unsupported (Meta credentials missing) ───────────────────────────────
  if (profile && !profile.supported) {
    return (
      <div className="min-h-screen bg-slate-50 pb-20">
        <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
          <div className="flex items-center gap-2 px-4 h-14">
            <Link
              href="/settings"
              className="text-slate-600 hover:text-slate-900 -ml-1 p-1"
              aria-label="Geri"
            >
              <ChevronLeft size={20} />
            </Link>
            <MessageCircle size={18} className="text-slate-600" />
            <h1 className="text-base font-semibold text-slate-900">
              WhatsApp Profili
            </h1>
          </div>
        </header>

        <main className="px-4 pt-4 space-y-4">
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="py-5 px-4 flex items-start gap-3">
              <Info size={18} className="text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-2">
                <p className="text-sm font-medium text-amber-900">
                  WhatsApp Profil yönetimi için Meta kimlik bilgileri eksik
                </p>
                <p className="text-xs text-amber-800 leading-relaxed">
                  Bu özelliği kullanmak için Meta&apos;nın Business Profile API&apos;sine
                  erişim gerekir. Atölyenizde aşağıdaki bilgilerin tanımlı olması
                  gerekiyor:
                </p>
                <ul className="text-xs text-amber-800 list-disc list-inside space-y-0.5 leading-relaxed">
                  <li>
                    <strong>Phone Number ID</strong> (Meta Business → WhatsApp →
                    Phone numbers)
                  </li>
                  <li>
                    <strong>Access Token</strong> (Meta Business → System Users
                    veya Meta App → WhatsApp → Generate token)
                  </li>
                  <li>
                    <strong>App ID</strong> (profil fotoğrafı yüklemek için
                    gerekli — opsiyonel diğer alanlar için)
                  </li>
                </ul>
                <p className="text-xs text-amber-800 leading-relaxed pt-1">
                  <strong>Platform admin</strong> ekranından atölyeyi düzenleyip
                  Meta Credentials bölümünü doldurun.
                </p>
                {profile.provider === "Twilio" && (
                  <p className="text-xs text-amber-700 leading-relaxed pt-1 border-t border-amber-200 mt-2">
                    <em>Not:</em> Twilio sağlayıcısı kullanan atölyeler için
                    profil yönetimi şu anda Meta üzerinden çalışıyor. Twilio
                    konsolundan Meta Access Token alabilir veya Twilio&apos;nun
                    kendi Senders API entegrasyonu için bekleyebilirsiniz
                    (planlanan özellik).
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </main>

        <BottomNav />
      </div>
    );
  }

  const p = profile as WhatsAppProfileSupported | null;

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2">
            <Link
              href="/settings"
              className="text-slate-600 hover:text-slate-900 -ml-1 p-1"
              aria-label="Geri"
            >
              <ChevronLeft size={20} />
            </Link>
            <MessageCircle size={18} className="text-slate-600" />
            <h1 className="text-base font-semibold text-slate-900">
              WhatsApp Profili
            </h1>
          </div>
          <Button
            size="sm"
            className="gap-1.5 h-8 text-xs"
            onClick={handleSave}
            disabled={saving}
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
        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        {/* ── Profile Picture ─────────────────────────────────────────────── */}
        <Card className="border-slate-200">
          <CardHeader className="pb-3 pt-4">
            <CardTitle className="text-sm font-semibold text-slate-800">
              Profil Fotoğrafı
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="flex items-center gap-4">
              {p?.profilePictureUrl ? (
                <img
                  src={p.profilePictureUrl}
                  alt="Profil fotoğrafı"
                  className="w-20 h-20 rounded-full object-cover border border-slate-200"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200">
                  <MessageCircle size={28} strokeWidth={1.25} />
                </div>
              )}
              <div className="flex-1 space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png"
                  onChange={handlePictureSelected}
                  className="hidden"
                />
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 h-8 text-xs"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <Upload size={13} />
                  )}
                  Fotoğraf Seç
                </Button>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  JPEG veya PNG, en fazla 5 MB. Yükledikten sonra otomatik olarak
                  uygulanır.
                </p>
                {uploadError && (
                  <p className="text-[11px] text-red-600">{uploadError}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Verified Name (read-only) ───────────────────────────────────── */}
        <Card className="border-slate-200">
          <CardHeader className="pb-3 pt-4">
            <CardTitle className="text-sm font-semibold text-slate-800 flex items-center gap-2">
              <Lock size={14} className="text-slate-500" />
              Görünen Ad
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pb-4">
            <Input
              value={p?.verifiedName ?? ""}
              disabled
              className="h-9 text-sm bg-slate-50 cursor-not-allowed"
              placeholder="(Atanmamış)"
            />
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Görünen adı değiştirmek için Meta Business Manager üzerinden talepte
              bulunmanız gerekir. Bu alan API ile değiştirilemez.
            </p>
          </CardContent>
        </Card>

        {/* ── Editable Fields ─────────────────────────────────────────────── */}
        <Card className="border-slate-200">
          <CardHeader className="pb-3 pt-4">
            <CardTitle className="text-sm font-semibold text-slate-800">
              İşletme Bilgileri
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pb-4">
            {/* About — short tagline shown under the contact name in WhatsApp.
                Note: not visible on every WhatsApp client (e.g. mobile may hide it),
                but it IS shown in WhatsApp Web and in some app versions. */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Hakkında (Kısa Açıklama)</Label>
                <span className="text-[10px] text-slate-400">
                  {form.about.length}/139
                </span>
              </div>
              <Input
                value={form.about}
                onChange={(e) =>
                  setForm({ ...form, about: e.target.value.slice(0, 139) })
                }
                placeholder='Örn. "Her zaman çevrimiçi" — WhatsApp Web ve bazı sürümlerde görünür'
                maxLength={139}
                className="h-9 text-sm"
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Açıklama</Label>
                <span className="text-[10px] text-slate-400">
                  {form.description.length}/512
                </span>
              </div>
              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm({
                    ...form,
                    description: e.target.value.slice(0, 512),
                  })
                }
                placeholder="İşletmeniz hakkında daha detaylı bilgi"
                maxLength={512}
                rows={4}
                className="w-full resize-none rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
              />
            </div>

            {/* Address */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Adres</Label>
                <span className="text-[10px] text-slate-400">
                  {form.address.length}/256
                </span>
              </div>
              <Input
                value={form.address}
                onChange={(e) =>
                  setForm({ ...form, address: e.target.value.slice(0, 256) })
                }
                placeholder="Örn. Atatürk Cad. No:42, Ankara"
                maxLength={256}
                className="h-9 text-sm"
              />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs">E-posta</Label>
                <span className="text-[10px] text-slate-400">
                  {form.email.length}/128
                </span>
              </div>
              <Input
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm({ ...form, email: e.target.value.slice(0, 128) })
                }
                placeholder="ornek@atolye.com"
                maxLength={128}
                className="h-9 text-sm"
              />
            </div>

            {/* Vertical */}
            <div className="space-y-1.5">
              <Label className="text-xs">Sektör</Label>
              <select
                value={form.vertical}
                onChange={(e) =>
                  setForm({ ...form, vertical: e.target.value })
                }
                className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
              >
                {VERTICALS.map((v) => (
                  <option key={v.value} value={v.value}>
                    {v.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Websites */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Web Siteleri</Label>
                <span className="text-[10px] text-slate-400">
                  {form.websites.length}/2
                </span>
              </div>
              {form.websites.map((site, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    type="url"
                    value={site}
                    onChange={(e) => updateWebsite(i, e.target.value)}
                    placeholder="https://ornek.com"
                    className="h-9 text-sm flex-1"
                  />
                  <button
                    type="button"
                    onClick={() => removeWebsite(i)}
                    className="text-slate-400 hover:text-red-600 p-1.5"
                    aria-label="Web sitesini sil"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              {form.websites.length < 2 && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="gap-1.5 h-8 text-xs"
                  onClick={addWebsite}
                >
                  <Plus size={13} />
                  Web Sitesi Ekle
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <p className="text-[11px] text-slate-500 leading-relaxed px-1">
          <Info size={11} className="inline mr-1 -mt-0.5" />
          Değişiklikler Meta tarafına gönderildikten sonra WhatsApp profilinizde
          birkaç dakika içinde görünür.
        </p>
      </main>

      <BottomNav />
    </div>
  );
}

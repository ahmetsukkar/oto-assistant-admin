"use client";

import { useEffect, useState, useCallback } from "react";
import {
  listWorkshops,
  createWorkshop,
  updateWorkshop,
  deactivateWorkshop,
  type WorkshopListItem,
  type WorkshopUpsertPayload,
  type BusinessType,
  type WhatsAppProvider,
} from "@/lib/platform-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Plus, Pencil, PowerOff, X, Copy, Check } from "lucide-react";

const BUSINESS_TYPES: BusinessType[] = [
  "CarWorkshop",
  "Barber",
  "Clinic",
  "Restaurant",
];

const emptyForm = (): WorkshopUpsertPayload => ({
  name: "",
  businessType: "CarWorkshop",
  whatsAppProvider: "Meta",
  whatsAppPhoneNumberId: "",
  whatsAppPhoneNumber: "",
  whatsAppToken: "",
  whatsAppAppSecret: "",
  twilioAccountSid: "",
  twilioAuthToken: "",
  geminiApiKey: "",
  customPrompt: "",
  aiEnabled: true,
});

// ── Platform login guard ────────────────────────────────────────────────────

function usePlatformAuth() {
  const [authed, setAuthed] = useState(false);
  const [key, setKey] = useState("");
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const stored = sessionStorage.getItem("platform_key");
    if (stored) setAuthed(true);
  }, []);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    if (!key.trim()) return;
    setChecking(true);
    setError("");
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/platform/workshops`,
        { headers: { "X-Platform-Key": key.trim() } },
      );
      if (!res.ok) throw new Error("Invalid key");
      sessionStorage.setItem("platform_key", key.trim());
      setAuthed(true);
    } catch {
      setError("Invalid platform key.");
    } finally {
      setChecking(false);
    }
  }

  function logout() {
    sessionStorage.removeItem("platform_key");
    setAuthed(false);
    setKey("");
  }

  return { authed, key, setKey, checking, error, login, logout };
}

// ── Copy-to-clipboard helper ────────────────────────────────────────────────

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="ml-1 text-slate-400 hover:text-slate-600"
      title="Copy"
    >
      {copied ? <Check size={13} className="text-green-500" /> : <Copy size={13} />}
    </button>
  );
}

// ── Main page ───────────────────────────────────────────────────────────────

export default function PlatformPage() {
  const auth = usePlatformAuth();
  const [workshops, setWorkshops] = useState<WorkshopListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<WorkshopListItem | null>(null);
  const [form, setForm] = useState<WorkshopUpsertPayload>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [lastCreatedKey, setLastCreatedKey] = useState<string | null>(null);
  const [error, setError] = useState("");

  const loadWorkshops = useCallback(async () => {
    setLoading(true);
    try {
      setWorkshops(await listWorkshops());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (auth.authed) loadWorkshops();
  }, [auth.authed, loadWorkshops]);

  function openCreate() {
    setEditTarget(null);
    setForm(emptyForm());
    setLastCreatedKey(null);
    setFormOpen(true);
  }

  function openEdit(w: WorkshopListItem) {
    setEditTarget(w);
    setLastCreatedKey(null);
    setForm({
      name: w.name,
      businessType: w.businessType,
      whatsAppProvider: w.whatsAppProvider,
      whatsAppPhoneNumberId: w.whatsAppPhoneNumberId ?? "",
      whatsAppPhoneNumber: w.whatsAppPhoneNumber ?? "",
      whatsAppToken: "",
      whatsAppAppSecret: "",
      twilioAccountSid: "",
      twilioAuthToken: "",
      geminiApiKey: "",
      customPrompt: "",
      aiEnabled: w.aiEnabled,
    });
    setFormOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload: WorkshopUpsertPayload = {
        ...form,
        whatsAppToken: form.whatsAppToken || undefined,
        whatsAppAppSecret: form.whatsAppAppSecret || undefined,
        twilioAccountSid: form.twilioAccountSid || undefined,
        twilioAuthToken: form.twilioAuthToken || undefined,
        geminiApiKey: form.geminiApiKey || undefined,
        customPrompt: form.customPrompt || undefined,
        whatsAppPhoneNumberId: form.whatsAppPhoneNumberId || undefined,
        whatsAppPhoneNumber: form.whatsAppPhoneNumber || undefined,
      };

      if (editTarget) {
        await updateWorkshop(editTarget.id, payload);
      } else {
        const created = await createWorkshop(payload);
        setLastCreatedKey(created.apiKey);
      }

      await loadWorkshops();
      if (!editTarget) setFormOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeactivate(w: WorkshopListItem) {
    if (!confirm(`Deactivate "${w.name}"? The API key will stop working.`))
      return;
    try {
      await deactivateWorkshop(w.id);
      await loadWorkshops();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Deactivate failed");
    }
  }

  // ── Login screen ─────────────────────────────────────────────────────────
  if (!auth.authed) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center text-white">
            <h1 className="text-xl font-bold">Platform Admin</h1>
            <p className="text-sm text-slate-400 mt-1">Workshop management</p>
          </div>
          <Card className="border-slate-700 bg-slate-800">
            <CardContent className="pt-6">
              <form onSubmit={auth.login} className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-slate-300 text-sm">Platform Key</Label>
                  <Input
                    type="password"
                    value={auth.key}
                    onChange={(e) => auth.setKey(e.target.value)}
                    placeholder="Enter platform owner key"
                    className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
                    disabled={auth.checking}
                    autoFocus
                  />
                </div>
                {auth.error && (
                  <p className="text-xs text-red-400">{auth.error}</p>
                )}
                <Button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-500"
                  disabled={auth.checking}
                >
                  {auth.checking ? (
                    <Loader2 size={16} className="animate-spin mr-2" />
                  ) : null}
                  Sign In
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ── Upsert form (drawer-style overlay) ────────────────────────────────────
  const isMeta = form.whatsAppProvider === "Meta";

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 px-4 h-14 flex items-center justify-between">
        <h1 className="text-base font-semibold text-slate-900">
          Platform — Workshops
        </h1>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={openCreate} className="gap-1.5 h-8 text-xs">
            <Plus size={13} /> Add Workshop
          </Button>
          <button
            type="button"
            onClick={auth.logout}
            className="text-xs text-slate-400 hover:text-slate-700 px-2 py-1"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="px-4 pt-4 pb-20 max-w-4xl mx-auto space-y-3">
        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        {/* Workshop list */}
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 size={28} className="animate-spin text-slate-400" />
          </div>
        ) : (
          <div className="space-y-2">
            {workshops.map((w) => (
              <Card
                key={w.id}
                className={`border-slate-200 ${!w.isActive ? "opacity-50" : ""}`}
              >
                <CardContent className="py-3 px-4 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm text-slate-900">
                        {w.name}
                      </span>
                      <span className="text-[10px] bg-slate-100 text-slate-500 rounded px-1.5 py-0.5">
                        {w.businessType}
                      </span>
                      <span className="text-[10px] bg-indigo-50 text-indigo-600 rounded px-1.5 py-0.5">
                        {w.whatsAppProvider}
                      </span>
                      {!w.isActive && (
                        <span className="text-[10px] bg-red-50 text-red-600 rounded px-1.5 py-0.5">
                          INACTIVE
                        </span>
                      )}
                      {!w.aiEnabled && (
                        <span className="text-[10px] bg-amber-50 text-amber-600 rounded px-1.5 py-0.5">
                          AI OFF
                        </span>
                      )}
                    </div>
                    <div className="mt-1 text-[11px] text-slate-400 flex flex-wrap gap-x-3 gap-y-0.5">
                      {w.whatsAppPhoneNumber && <span>📱 {w.whatsAppPhoneNumber}</span>}
                      {w.hasToken && <span>✓ Token</span>}
                      {w.hasTwilioSid && <span>✓ Twilio</span>}
                      {w.hasGeminiKey && <span>✓ Gemini</span>}
                      <span className="text-slate-300">
                        {new Date(w.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => openEdit(w)}
                      className="p-1.5 rounded hover:bg-slate-100 text-slate-500"
                      title="Edit"
                    >
                      <Pencil size={14} />
                    </button>
                    {w.isActive && (
                      <button
                        type="button"
                        onClick={() => handleDeactivate(w)}
                        className="p-1.5 rounded hover:bg-red-50 text-slate-400 hover:text-red-600"
                        title="Deactivate"
                      >
                        <PowerOff size={14} />
                      </button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
            {workshops.length === 0 && (
              <div className="text-center py-16 text-slate-400 text-sm">
                No workshops yet. Click &quot;Add Workshop&quot; to create the first one.
              </div>
            )}
          </div>
        )}
      </main>

      {/* Upsert overlay */}
      {formOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-4">
          <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between pb-3 pt-4">
              <CardTitle className="text-sm font-semibold text-slate-800">
                {editTarget ? `Edit: ${editTarget.name}` : "New Workshop"}
              </CardTitle>
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            </CardHeader>
            <CardContent className="pb-6">
              {/* Show new API key after creation */}
              {lastCreatedKey && (
                <div className="mb-4 rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm">
                  <p className="font-semibold text-emerald-800 mb-1">
                    Workshop created! Save this API key — it won&apos;t be shown again:
                  </p>
                  <div className="flex items-center gap-1 font-mono text-xs text-emerald-700 break-all">
                    {lastCreatedKey}
                    <CopyButton value={lastCreatedKey} />
                  </div>
                </div>
              )}

              <form onSubmit={handleSave} className="space-y-4">
                {/* Name */}
                <div className="space-y-1.5">
                  <Label className="text-xs">Workshop Name *</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Ahmed's Auto Workshop"
                    className="h-9 text-sm"
                    required
                  />
                </div>

                {/* Business type */}
                <div className="space-y-1.5">
                  <Label className="text-xs">Business Type</Label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {BUSINESS_TYPES.map((bt) => (
                      <button
                        key={bt}
                        type="button"
                        onClick={() =>
                          setForm({ ...form, businessType: bt })
                        }
                        className={`py-2 rounded-lg text-xs font-medium border transition-colors ${
                          form.businessType === bt
                            ? "bg-slate-900 text-white border-slate-900"
                            : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
                        }`}
                      >
                        {bt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* WhatsApp provider */}
                <div className="space-y-1.5">
                  <Label className="text-xs">WhatsApp Provider</Label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {(["Meta", "Twilio"] as WhatsAppProvider[]).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() =>
                          setForm({ ...form, whatsAppProvider: p })
                        }
                        className={`py-2 rounded-lg text-xs font-medium border transition-colors ${
                          form.whatsAppProvider === p
                            ? "bg-indigo-600 text-white border-indigo-600"
                            : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Meta credentials */}
                {isMeta && (
                  <div className="space-y-3 rounded-lg border border-slate-100 bg-slate-50 p-3">
                    <p className="text-xs font-medium text-slate-600">
                      Meta Credentials
                    </p>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Phone Number ID</Label>
                      <Input
                        value={form.whatsAppPhoneNumberId}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            whatsAppPhoneNumberId: e.target.value,
                          })
                        }
                        placeholder="123456789"
                        className="h-9 text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">
                        Phone Number (E.164, no +)
                      </Label>
                      <Input
                        value={form.whatsAppPhoneNumber}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            whatsAppPhoneNumber: e.target.value,
                          })
                        }
                        placeholder="905321234567"
                        className="h-9 text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">
                        Access Token {editTarget && "(leave blank to keep existing)"}
                      </Label>
                      <Input
                        value={form.whatsAppToken}
                        onChange={(e) =>
                          setForm({ ...form, whatsAppToken: e.target.value })
                        }
                        placeholder={editTarget ? "••••••••" : "EAAxxxxxxxx…"}
                        className="h-9 text-sm"
                        type="password"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">
                        App Secret{" "}
                        {editTarget
                          ? "(leave blank to keep existing)"
                          : "— Meta App Dashboard → Settings → Basic"}
                      </Label>
                      <Input
                        value={form.whatsAppAppSecret}
                        onChange={(e) =>
                          setForm({ ...form, whatsAppAppSecret: e.target.value })
                        }
                        placeholder={editTarget ? "••••••••" : "abc123…"}
                        className="h-9 text-sm"
                        type="password"
                      />
                    </div>
                  </div>
                )}

                {/* Twilio credentials */}
                {!isMeta && (
                  <div className="space-y-3 rounded-lg border border-indigo-100 bg-indigo-50 p-3">
                    <p className="text-xs font-medium text-indigo-700">
                      Twilio Credentials
                    </p>
                    <div className="space-y-1.5">
                      <Label className="text-xs">
                        Phone Number (E.164, no +)
                      </Label>
                      <Input
                        value={form.whatsAppPhoneNumber}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            whatsAppPhoneNumber: e.target.value,
                          })
                        }
                        placeholder="14155238886"
                        className="h-9 text-sm"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">
                          Account SID{" "}
                          {editTarget && "(blank = keep)"}
                        </Label>
                        <Input
                          value={form.twilioAccountSid}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              twilioAccountSid: e.target.value,
                            })
                          }
                          placeholder="ACxxxxxxx"
                          className="h-9 text-sm"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">
                          Auth Token{" "}
                          {editTarget && "(blank = keep)"}
                        </Label>
                        <Input
                          value={form.twilioAuthToken}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              twilioAuthToken: e.target.value,
                            })
                          }
                          placeholder="••••••••"
                          className="h-9 text-sm"
                          type="password"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Gemini API key */}
                <div className="space-y-1.5">
                  <Label className="text-xs">
                    Gemini API Key{" "}
                    {editTarget && "(blank = keep existing)"}
                  </Label>
                  <Input
                    value={form.geminiApiKey}
                    onChange={(e) =>
                      setForm({ ...form, geminiApiKey: e.target.value })
                    }
                    placeholder={editTarget ? "••••••••" : "AIzaSy…"}
                    className="h-9 text-sm"
                    type="password"
                  />
                </div>

                {/* Custom prompt */}
                <div className="space-y-1.5">
                  <Label className="text-xs">
                    Custom Prompt{" "}
                    <span className="text-slate-400">(optional override)</span>
                  </Label>
                  <textarea
                    value={form.customPrompt}
                    onChange={(e) =>
                      setForm({ ...form, customPrompt: e.target.value })
                    }
                    placeholder="Leave empty to use the default business-type prompt…"
                    rows={4}
                    className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-slate-400"
                  />
                </div>

                {/* AI enabled */}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={form.aiEnabled}
                    onClick={() =>
                      setForm({ ...form, aiEnabled: !form.aiEnabled })
                    }
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                      form.aiEnabled ? "bg-emerald-500" : "bg-slate-300"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ${
                        form.aiEnabled ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                  <Label className="text-xs">AI auto-reply enabled</Label>
                </div>

                {error && (
                  <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
                    {error}
                  </p>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={saving || !form.name.trim()}
                >
                  {saving ? (
                    <Loader2 size={14} className="animate-spin mr-2" />
                  ) : null}
                  {editTarget ? "Save Changes" : "Create Workshop"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { getCustomersPaginated, getChatHistory } from "@/lib/api";
import {
  Appointment,
  AppointmentStatus,
  Customer,
  ChatMessage,
  MessageRole,
} from "@/lib/types";
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
  MessageCircle,
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

const PAGE_LIMIT = 20;

// ─── Avatars ──────────────────────────────────────────────────────────────────

function CustomerAvatar({ name }: { name?: string }) {
  const initials = (name ?? "?")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div
      className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 shadow-sm"
      style={{ backgroundColor: "#128C7E" }}
    >
      <span className="text-[10px] font-bold text-white leading-none">
        {initials}
      </span>
    </div>
  );
}

// ─── Date Separator ───────────────────────────────────────────────────────────

function DateSeparator({ dateStr }: { dateStr: string }) {
  const label = (() => {
    try {
      const d = new Date(dateStr.replace(" ", "T"));
      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      if (d.toDateString() === today.toDateString()) return "Bugün";
      if (d.toDateString() === yesterday.toDateString()) return "Dün";
      return d.toLocaleDateString("tr-TR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return dateStr.slice(0, 10);
    }
  })();

  return (
    <div className="flex items-center justify-center py-2">
      <span
        className="text-[11px] text-slate-700 font-medium px-3 py-1 rounded-full shadow-sm"
        style={{ backgroundColor: "#d1f4cc" }}
      >
        {label}
      </span>
    </div>
  );
}

// ─── Chat Bubble ──────────────────────────────────────────────────────────────

function ChatBubble({
  msg,
  customerName,
}: {
  msg: ChatMessage;
  customerName?: string;
}) {
  const isBot = msg.role === MessageRole.Assistant;

  const timeStr = (() => {
    try {
      const raw = msg.createdAt ?? "";
      const d = new Date(raw.replace(" ", "T"));
      if (isNaN(d.getTime())) return raw.slice(11, 16);
      return d.toLocaleTimeString("tr-TR", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  })();

  // ── BOT → RIGHT side, green balloon, NO avatar ───────────────────────────
  if (isBot) {
    return (
      <div className="flex justify-end items-end px-3">
        <div className="max-w-[78%]">
          <div
            className="relative px-3 pt-2 pb-1 rounded-2xl rounded-tr-sm shadow-sm"
            style={{ backgroundColor: "#dcf8c6" }}
          >
            <svg
              className="absolute -right-[7px] top-0"
              width="10"
              height="13"
              viewBox="0 0 10 13"
              fill="none"
            >
              <path
                d="M10 0 C5 0 0 5 0 13 C2 9 6 6.5 10 6.5 Z"
                fill="#dcf8c6"
              />
            </svg>

            <p className="text-[13px] leading-[1.45] text-slate-900 break-words whitespace-pre-wrap">
              {msg.message}
            </p>

            <div className="flex items-center justify-end gap-1 mt-0.5">
              <span className="text-[10px] text-slate-500">{timeStr}</span>
              <svg width="16" height="10" viewBox="0 0 16 10" fill="none">
                <path
                  d="M1 5L4.5 8.5L10 2"
                  stroke="#53BDEB"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M6 5L9.5 8.5L15 2"
                  stroke="#53BDEB"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── CUSTOMER → LEFT side, white balloon, initials avatar ─────────────────
  return (
    <div className="flex justify-start items-end gap-2 px-3">
      <CustomerAvatar name={customerName} />
      <div className="max-w-[78%]">
        <div
          className="relative px-3 pt-2 pb-1 rounded-2xl rounded-tl-sm shadow-sm"
          style={{ backgroundColor: "#ffffff" }}
        >
          <svg
            className="absolute -left-[7px] top-0"
            width="10"
            height="13"
            viewBox="0 0 10 13"
            fill="none"
          >
            <path d="M10 0 C5 0 0 5 0 13 C2 9 6 6.5 10 6.5 Z" fill="#ffffff" />
          </svg>

          <p className="text-[13px] leading-[1.45] text-slate-900 break-words whitespace-pre-wrap">
            {msg.message}
          </p>
          <div className="flex items-center justify-end mt-0.5">
            <span className="text-[10px] text-slate-500">{timeStr}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Customer Detail Sheet ────────────────────────────────────────────────────

type DetailTab = "appointments" | "chat";

function CustomerSheet({
  customer,
  onClose,
}: {
  customer: Customer | null;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<DetailTab>("appointments");

  const [appts, setAppts] = useState<Appointment[]>([]);
  const [apptsLoading, setApptsLoading] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatPage, setChatPage] = useState(1);
  const [chatHasMore, setChatHasMore] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Reset on customer change
  useEffect(() => {
    if (!customer) return;
    setTab("appointments");
    setAppts([]);
    setMessages([]);
    setChatPage(1);
    setChatHasMore(false);
  }, [customer]);

  // Load appointments
  useEffect(() => {
    if (!customer || tab !== "appointments") return;
    setApptsLoading(true);
    import("@/lib/api").then(({ getAppointments }) =>
      getAppointments()
        .then((data) => {
          const filtered = data
            .filter((a: Appointment) => a.customerPhone === customer.phone)
            .sort(
              (a: Appointment, b: Appointment) =>
                new Date(b.appointmentDate).getTime() -
                new Date(a.appointmentDate).getTime(),
            );
          setAppts(filtered);
        })
        .finally(() => setApptsLoading(false)),
    );
  }, [customer, tab]);

  // Load chat page 1
  useEffect(() => {
    if (!customer || tab !== "chat") return;
    setMessages([]);
    setChatPage(1);
    setChatLoading(true);
    getChatHistory({ phone: customer.phone, page: 1, limit: 30 })
      .then((res) => {
        setMessages([...res.messages].reverse());
        setChatHasMore(res.hasMore);
        setChatPage(1);
      })
      .catch(() => {})
      .finally(() => setChatLoading(false));
  }, [customer, tab]);

  // Load older messages
  async function loadMoreChat() {
    if (!customer || chatLoading || !chatHasMore) return;
    setChatLoading(true);
    const nextPage = chatPage + 1;
    try {
      const res = await getChatHistory({
        phone: customer.phone,
        page: nextPage,
        limit: 30,
      });
      setMessages((prev) => [...[...res.messages].reverse(), ...prev]);
      setChatHasMore(res.hasMore);
      setChatPage(nextPage);
    } finally {
      setChatLoading(false);
    }
  }

  // Auto-scroll to bottom on first load
  useEffect(() => {
    if (tab === "chat" && messages.length > 0 && chatPage === 1) {
      setTimeout(
        () => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }),
        100,
      );
    }
  }, [messages, tab, chatPage]);

  // Group messages by date + split bot messages on --- into separate bubbles
  const groupedMessages = (() => {
    const items: Array<
      { type: "date"; date: string } | { type: "msg"; msg: ChatMessage }
    > = [];
    let lastDate = "";

    for (const msg of messages) {
      const msgDate = (msg.createdAt ?? "").slice(0, 10);
      if (msgDate && msgDate !== lastDate) {
        items.push({ type: "date", date: msg.createdAt });
        lastDate = msgDate;
      }

      if (msg.role === MessageRole.Assistant) {
        const parts = msg.message
          .split(/\n?---\n?/)
          .map((p) => p.trim())
          .filter((p) => p.length > 0);

        if (parts.length > 1) {
          parts.forEach((part, i) => {
            items.push({
              type: "msg",
              msg: { ...msg, id: `${msg.id}-part-${i}`, message: part },
            });
          });
          continue;
        }
      }

      items.push({ type: "msg", msg });
    }

    return items;
  })();

  if (!customer) return null;

  return (
    <Sheet open={!!customer} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="bottom"
        className="rounded-t-2xl px-0 pb-0 max-h-[90dvh] flex flex-col overflow-hidden"
      >
        {/* ── Header ── */}
        <SheetHeader className="px-5 pt-5 pb-3 border-b border-slate-100 shrink-0">
          <SheetTitle className="text-base text-left">
            {customer.name || "Bilinmiyor"}
          </SheetTitle>
          <div className="flex items-center gap-2">
            <Phone size={11} className="text-slate-400" />
            <p className="text-xs text-slate-500">{customer.phone}</p>
            <span className="text-slate-200">·</span>
            <CalendarClock size={11} className="text-slate-400" />
            <p className="text-xs text-slate-500">
              {customer.totalAppointments} randevu
            </p>
          </div>
        </SheetHeader>

        {/* ── Tabs ── */}
        <div className="flex border-b border-slate-100 shrink-0 px-5">
          {(["appointments", "chat"] as DetailTab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex items-center gap-1.5 px-1 pb-3 pt-3 mr-5 text-xs font-medium border-b-2 transition-colors ${
                tab === t
                  ? "border-slate-900 text-slate-900"
                  : "border-transparent text-slate-400 hover:text-slate-600"
              }`}
            >
              {t === "appointments" ? (
                <>
                  <CalendarClock size={13} /> Randevular
                  {appts.length > 0 && (
                    <span className="ml-1 text-[10px] bg-slate-200 text-slate-600 rounded-full px-1.5 py-0.5 leading-none">
                      {appts.length}
                    </span>
                  )}
                </>
              ) : (
                <>
                  <MessageCircle size={13} /> WhatsApp Geçmişi
                  {messages.length > 0 && (
                    <span className="ml-1 text-[10px] bg-green-100 text-green-700 rounded-full px-1.5 py-0.5 leading-none">
                      {messages.length}
                    </span>
                  )}
                </>
              )}
            </button>
          ))}
        </div>

        {/* ── Appointments Tab ── */}
        {tab === "appointments" && (
          <div className="flex-1 overflow-y-auto px-4 pt-3 pb-6 space-y-2">
            {apptsLoading && (
              <div className="flex items-center justify-center py-10 text-slate-400">
                <Loader2 size={20} className="animate-spin mr-2" />
                <span className="text-sm">Yükleniyor...</span>
              </div>
            )}
            {!apptsLoading && appts.length === 0 && (
              <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                <CalendarClock size={32} strokeWidth={1.25} className="mb-2" />
                <p className="text-sm">Randevu geçmişi yok</p>
              </div>
            )}
            {!apptsLoading &&
              appts.map((appt) => (
                <Card key={appt.id} className="border-slate-200">
                  <CardContent className="pt-3 pb-3 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-slate-700 truncate">
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
        )}

        {/* ── Chat Tab — WhatsApp Style ── */}
        {tab === "chat" && (
          <div
            className="flex-1 overflow-y-auto"
            style={{
              backgroundColor: "#e5ddd5",
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23c4b8ae' fill-opacity='0.18'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          >
            {chatHasMore && (
              <div className="flex justify-center pt-3 pb-1">
                <button
                  onClick={loadMoreChat}
                  disabled={chatLoading}
                  className="text-xs text-slate-600 bg-white/80 backdrop-blur-sm border border-white/60 rounded-full px-4 py-1.5 shadow-sm disabled:opacity-50"
                >
                  {chatLoading && (
                    <Loader2 size={11} className="animate-spin inline mr-1" />
                  )}
                  Daha eski mesajlar
                </button>
              </div>
            )}

            {chatLoading && messages.length === 0 && (
              <div className="flex items-center justify-center py-16">
                <Loader2 size={20} className="animate-spin text-slate-500 mr-2" />
                <span className="text-sm text-slate-500">Yükleniyor...</span>
              </div>
            )}

            {!chatLoading && messages.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center mb-3"
                  style={{ backgroundColor: "#075E54" }}
                >
                  <MessageCircle size={24} className="text-white" />
                </div>
                <p className="text-sm font-medium text-slate-600">
                  WhatsApp sohbeti bulunamadı
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Bu müşteriye ait mesaj yok
                </p>
              </div>
            )}

            {messages.length > 0 && (
              <div className="flex flex-col gap-1.5 py-3">
                {groupedMessages.map((item, idx) =>
                  item.type === "date" ? (
                    <DateSeparator key={`sep-${idx}`} dateStr={item.date} />
                  ) : (
                    <ChatBubble
                      key={item.msg.id}
                      msg={item.msg}
                      customerName={customer.name}
                    />
                  ),
                )}
                <div ref={chatEndRef} className="h-3" />
              </div>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const searchRef = useRef("");
  const isFetchingRef = useRef(false);
  const isFirstMount = useRef(true);

  const fetchPage = useCallback(async (p: number, reset: boolean) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    if (p === 1) setLoading(true);
    else setLoadingMore(true);
    setError("");

    try {
      const res = await getCustomersPaginated({
        search: searchRef.current || undefined,
        page: p,
        limit: PAGE_LIMIT,
      });
      setCustomers((prev) =>
        reset ? res.customers : [...prev, ...res.customers],
      );
      setHasMore(res.hasMore);
      setTotalCount(res.totalCount);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Müşteriler yüklenemedi.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
      isFetchingRef.current = false;
    }
  }, []);

  // Single effect handles both initial load (0ms) and debounced search (350ms)
  useEffect(() => {
    const delay = isFirstMount.current ? 0 : 350;
    isFirstMount.current = false;

    const t = setTimeout(() => {
      searchRef.current = search;
      setPage(1);
      if (delay > 0) setCustomers([]);
      fetchPage(1, true);
    }, delay);

    return () => clearTimeout(t);
  }, [search, fetchPage]);

  function loadMore() {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchPage(nextPage, false);
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
        <div className="flex items-center justify-between px-4 h-12">
          <div className="flex items-center gap-2">
            <Users size={17} className="text-slate-600 shrink-0" />
            <h1 className="text-sm font-semibold text-slate-900">Müşteriler</h1>
          </div>
          {!loading && (
            <span className="text-xs text-slate-400">{totalCount} müşteri</span>
          )}
        </div>
        <div className="px-4 pb-3">
          <div className="relative">
            <Search
              size={14}
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
            <Loader2 size={22} className="animate-spin mr-2" />
            <span className="text-sm">Yükleniyor...</span>
          </div>
        )}
        {!loading && error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            {error}
          </div>
        )}
        {!loading && !error && customers.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <Users size={40} strokeWidth={1.25} className="mb-3" />
            <p className="text-sm font-medium text-slate-600">
              Müşteri bulunamadı
            </p>
          </div>
        )}

        {!loading &&
          !error &&
          customers.map((customer) => (
            <Card
              key={customer.id}
              className="border-slate-200 shadow-sm cursor-pointer active:scale-[0.99] transition-transform"
              onClick={() => setSelectedCustomer(customer)}
            >
              <CardContent className="pt-3 pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-slate-600">
                        {(customer.name ?? customer.phone)
                          .split(" ")
                          .map((w: string) => w[0])
                          .slice(0, 2)
                          .join("")
                          .toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">
                        {customer.name || "—"}
                      </p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Phone size={11} className="text-slate-400 shrink-0" />
                        <p className="text-xs text-slate-500">
                          {customer.phone}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center gap-1 text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                      <CalendarClock size={11} className="text-slate-400" />
                      {customer.totalAppointments}
                    </div>
                    <ChevronRight size={15} className="text-slate-300" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

        {!loading && hasMore && (
          <div className="flex justify-center pt-2 pb-4">
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="flex items-center gap-2 px-6 py-2.5 rounded-full border border-slate-200 bg-white text-xs font-medium text-slate-600 hover:bg-slate-50 active:bg-slate-100 disabled:opacity-50 transition-colors shadow-sm"
            >
              {loadingMore && <Loader2 size={13} className="animate-spin" />}
              Daha fazla yükle
            </button>
          </div>
        )}
      </main>

      <CustomerSheet
        customer={selectedCustomer}
        onClose={() => setSelectedCustomer(null)}
      />

      <BottomNav />
    </div>
  );
}
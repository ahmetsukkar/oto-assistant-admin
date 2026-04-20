"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Bell, ArrowLeft, CheckCheck } from "lucide-react";
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "@/lib/api";
import type { AppNotification, NotificationsResponse } from "@/lib/types";
import { cn } from "@/lib/utils";

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return `${diff} sn önce`;
  if (diff < 3600) return `${Math.floor(diff / 60)} dk önce`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} sa önce`;
  return `${Math.floor(diff / 86400)} gün önce`;
}

// Map notification URL → Next.js route
function resolveRoute(url: string): string {
  if (!url || url === "/") return "/dashboard";
  // e.g. "/dashboard" → "/dashboard", "/appointments" → "/appointments"
  return url.startsWith("/") ? url : `/${url}`;
}

export default function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<NotificationsResponse>({
    notifications: [],
    unreadCount: 0,
  });
  const [loading, setLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const result = await getNotifications();
      setData(result);
    } catch {
      // silent
    }
  }, []);

  // Poll every 30 seconds
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30_000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Prevent body scroll when full-page panel is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      fetchNotifications();
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open, fetchNotifications]);

  async function handleMarkAllRead() {
    setLoading(true);
    try {
      await markAllNotificationsRead();
      setData((prev) => ({
        notifications: prev.notifications.map((n) => ({ ...n, isRead: true })),
        unreadCount: 0,
      }));
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  async function handleNotificationClick(n: AppNotification) {
    // Mark as read
    if (!n.isRead) {
      try {
        await markNotificationRead(n.id);
        setData((prev) => ({
          notifications: prev.notifications.map((item) =>
            item.id === n.id ? { ...item, isRead: true } : item
          ),
          unreadCount: Math.max(0, prev.unreadCount - 1),
        }));
      } catch {
        // silent
      }
    }

    // Navigate
    const route = resolveRoute(n.url);
    setOpen(false);
    router.push(route);
  }

  return (
    <>
      {/* Bell Button */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Bildirimler"
        className="relative flex items-center justify-center w-9 h-9 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 active:bg-slate-200 transition-colors"
      >
        <Bell size={18} strokeWidth={1.75} />
        {data.unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold leading-none">
            {data.unreadCount > 99 ? "99+" : data.unreadCount}
          </span>
        )}
      </button>

      {/* Full-page overlay */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-slate-50 flex flex-col"
          role="dialog"
          aria-label="Bildirimler"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 h-14 bg-white border-b border-slate-200 shrink-0">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setOpen(false)}
                aria-label="Geri"
                className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-500 hover:bg-slate-100 active:bg-slate-200 transition-colors"
              >
                <ArrowLeft size={18} />
              </button>
              <div>
                <h1 className="text-base font-semibold text-slate-900">
                  Bildirimler
                </h1>
                {data.unreadCount > 0 && (
                  <p className="text-xs text-slate-400">
                    {data.unreadCount} okunmamış
                  </p>
                )}
              </div>
            </div>
            {data.unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                disabled={loading}
                className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 transition-colors disabled:opacity-50 px-2 py-1 rounded-lg hover:bg-slate-100"
              >
                <CheckCheck size={14} />
                Tümünü oku
              </button>
            )}
          </div>

          {/* Notification List */}
          <div className="flex-1 overflow-y-auto">
            {data.notifications.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full pb-20 text-slate-400">
                <Bell size={40} strokeWidth={1.25} className="mb-3" />
                <p className="text-sm font-medium text-slate-600">
                  Henüz bildirim yok
                </p>
                <p className="text-xs mt-1">
                  Yeni randevular burada görünecek
                </p>
              </div>
            )}

            <ul role="list" className="divide-y divide-slate-100">
              {data.notifications.map((n: AppNotification) => (
                <li
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={cn(
                    "flex items-start gap-3 px-4 py-4 cursor-pointer transition-colors active:bg-slate-100",
                    n.isRead ? "bg-white" : "bg-blue-50"
                  )}
                >
                  {/* Unread dot */}
                  <div className="mt-1 shrink-0 w-2">
                    {!n.isRead && (
                      <span className="block w-2 h-2 rounded-full bg-blue-500" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        "text-sm leading-snug",
                        n.isRead
                          ? "text-slate-600"
                          : "text-slate-900 font-semibold"
                      )}
                    >
                      {n.title}
                    </p>
                    <p className="text-sm text-slate-500 mt-0.5">{n.body}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {timeAgo(n.createdAt)}
                    </p>
                  </div>

                  {/* Chevron hint */}
                  <div className="shrink-0 text-slate-300 mt-0.5">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}

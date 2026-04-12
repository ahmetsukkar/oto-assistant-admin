"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Bell } from "lucide-react";
import { getNotifications, markNotificationRead, markAllNotificationsRead } from "@/lib/api";
import type { AppNotification, NotificationsResponse } from "@/lib/types";
import { cn } from "@/lib/utils";

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return `${diff} sn önce`;
  if (diff < 3600) return `${Math.floor(diff / 60)} dk önce`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} sa önce`;
  return `${Math.floor(diff / 86400)} gün önce`;
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<NotificationsResponse>({
    notifications: [],
    unreadCount: 0,
  });
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const result = await getNotifications();
      setData(result);
    } catch {
      // silent
    }
  }, []);

  // Poll every 30 seconds for new notifications
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30_000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleOpen() {
    setOpen((prev) => !prev);
    if (!open) {
      await fetchNotifications();
    }
  }

  async function handleMarkRead(id: number) {
    try {
      await markNotificationRead(id);
      setData((prev) => ({
        notifications: prev.notifications.map((n) =>
          n.id === id ? { ...n, isRead: true } : n
        ),
        unreadCount: Math.max(0, prev.unreadCount - 1),
      }));
    } catch {
      // silent
    }
  }

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

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={handleOpen}
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

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-11 z-50 w-80 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-900">
              Bildirimler
              {data.unreadCount > 0 && (
                <span className="ml-2 inline-flex items-center justify-center px-1.5 py-0.5 rounded-full bg-red-100 text-red-600 text-xs font-bold">
                  {data.unreadCount}
                </span>
              )}
            </h3>
            {data.unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                disabled={loading}
                className="text-xs text-slate-500 hover:text-slate-900 transition-colors disabled:opacity-50"
              >
                Tümünü okundu işaretle
              </button>
            )}
          </div>

          {/* List */}
          <ul
            role="list"
            className="max-h-96 overflow-y-auto divide-y divide-slate-50"
          >
            {data.notifications.length === 0 && (
              <li className="flex flex-col items-center justify-center py-10 text-slate-400">
                <Bell size={28} strokeWidth={1.25} className="mb-2" />
                <p className="text-sm">Henüz bildirim yok</p>
              </li>
            )}

            {data.notifications.map((n: AppNotification) => (
              <li
                key={n.id}
                onClick={() => !n.isRead && handleMarkRead(n.id)}
                className={cn(
                  "flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors",
                  n.isRead
                    ? "bg-white hover:bg-slate-50"
                    : "bg-blue-50 hover:bg-blue-100"
                )}
              >
                {/* Unread dot */}
                <div className="mt-1.5 shrink-0">
                  {!n.isRead ? (
                    <span className="block w-2 h-2 rounded-full bg-blue-500" />
                  ) : (
                    <span className="block w-2 h-2 rounded-full bg-transparent" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p
                    className={cn(
                      "text-sm",
                      n.isRead ? "text-slate-600" : "text-slate-900 font-medium"
                    )}
                  >
                    {n.title}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">
                    {n.body}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {timeAgo(n.createdAt)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
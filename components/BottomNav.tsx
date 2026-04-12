// components/BottomNav.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarCheck,
  Users,
  Wrench,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  {
    href: "/dashboard",
    label: "Panel",
    icon: LayoutDashboard,
  },
  {
    href: "/appointments",
    label: "Randevular",
    icon: CalendarCheck,
  },
  {
    href: "/customers",
    label: "Müşteriler",
    icon: Users,
  },
  {
    href: "/services",
    label: "Hizmetler",
    icon: Wrench,
  },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 safe-area-inset-bottom">
      <ul className="flex items-stretch h-16" role="list">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 h-full w-full text-xs font-medium transition-colors",
                  isActive
                    ? "text-slate-900"
                    : "text-slate-400 hover:text-slate-600 active:text-slate-900"
                )}
                aria-current={isActive ? "page" : undefined}
              >
                <item.icon
                  size={22}
                  strokeWidth={isActive ? 2 : 1.75}
                  className={cn(
                    "transition-colors",
                    isActive ? "text-slate-900" : "text-slate-400"
                  )}
                />
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
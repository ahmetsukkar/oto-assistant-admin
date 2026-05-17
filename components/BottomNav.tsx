"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  Wrench,
  Settings,
} from "lucide-react";
import { useBusinessContext } from "@/lib/business-context";

export default function BottomNav() {
  const pathname = usePathname();
  const { config } = useBusinessContext();

  const navItems = [
    { href: "/dashboard", icon: LayoutDashboard, label: "Ana Sayfa" },
    { href: "/appointments", icon: CalendarDays, label: config.appointmentLabel + "lar" },
    { href: "/customers", icon: Users, label: config.customerLabel + "ler" },
    ...(config.showServicePricing
      ? [{ href: "/services", icon: Wrench, label: config.serviceLabel + "ler" }]
      : []),
    { href: "/settings", icon: Settings, label: "Ayarlar" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 safe-area-pb">
      <div className="flex items-stretch">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center justify-center flex-1 py-2.5 gap-1 transition-colors ${
                active
                  ? "text-slate-900"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <Icon size={20} strokeWidth={active ? 2 : 1.5} />
              <span
                className={`text-[10px] font-medium ${
                  active ? "text-slate-900" : "text-slate-400"
                }`}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

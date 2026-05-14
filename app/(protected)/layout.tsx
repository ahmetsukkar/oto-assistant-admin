"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { BusinessContextProvider } from "@/lib/business-context";
import AIPausedBanner from "@/components/AIPausedBanner";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  useEffect(() => {
    const key = sessionStorage.getItem("admin_key");
    if (!key) {
      router.replace("/");
    }
  }, [router]);

  return (
    <BusinessContextProvider>
      <AIPausedBanner />
      {children}
    </BusinessContextProvider>
  );
}

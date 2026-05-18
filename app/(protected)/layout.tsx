"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { BusinessContextProvider } from "@/lib/business-context";
import AIPausedBanner from "@/components/AIPausedBanner";
import TrialBanner from "@/components/TrialBanner";

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
      <TrialBanner />
      {children}
    </BusinessContextProvider>
  );
}

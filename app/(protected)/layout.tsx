"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

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

  return <>{children}</>;
}
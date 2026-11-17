"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function ContinueToSettings() {
  const router = useRouter();
  useEffect(() => {
    const timer = window.setTimeout(() => router.push("/settings"), 2500);
    return () => window.clearTimeout(timer);
  }, [router]);
  return <p className="note">Settings open in a moment.</p>;
}

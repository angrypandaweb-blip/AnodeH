"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { syncSpamMailboxIfStaleAction } from "@/app/actions";

/** Keeps the connected mailbox polling while this page is open. */
export function SpamAutoSync({ intervalSec = 60 }: { intervalSec?: number }) {
  const router = useRouter();
  const busy = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function tick() {
      if (busy.current || cancelled) return;
      busy.current = true;
      try {
        const result = await syncSpamMailboxIfStaleAction();
        if (!cancelled && result.ok && !result.skipped) router.refresh();
      } catch {
        /* leave last synced / last error as shown */
      } finally {
        busy.current = false;
      }
    }

    void tick();
    const id = window.setInterval(() => void tick(), intervalSec * 1000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [intervalSec, router]);

  return null;
}

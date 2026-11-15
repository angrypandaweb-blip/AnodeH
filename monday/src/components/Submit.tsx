"use client";

import { useFormStatus } from "react-dom";

export function Submit({ children, tone = "solid" }: { children: string; tone?: "solid" | "quiet" | "danger" }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={tone} disabled={pending}>
      {pending ? "Saving…" : children}
    </button>
  );
}

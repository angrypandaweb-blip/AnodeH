"use client";

import { useState } from "react";
import { beginCheckout } from "@/app/actions";

export function PayPalCheckout({ plan, label }: { plan: "month" | "year" | "sites10" | "sites20"; label: string }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  return (
    <form
      action={async (formData) => {
        setPending(true);
        setError("");
        try {
          const result = await beginCheckout(formData);
          if (result.url) {
            window.location.assign(result.url);
            return;
          }
          setError(result.error || "PayPal could not start the payment.");
        } catch {
          setError("PayPal could not start the payment.");
        }
        setPending(false);
      }}
    >
      <input type="hidden" name="plan" value={plan} />
      <button className="btn" type="submit" disabled={pending}>
        {pending ? "Opening PayPal…" : label}
      </button>
      {error ? <p className="note">{error}</p> : null}
    </form>
  );
}

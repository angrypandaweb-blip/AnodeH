"use client";

import Script from "next/script";
import { useRef } from "react";

type Grecaptcha = { render: (el: HTMLElement, options: { sitekey: string }) => number };

export function Recaptcha({ siteKey }: { siteKey: string }) {
  const box = useRef<HTMLDivElement>(null);
  const painted = useRef(false);

  function paint() {
    const grecaptcha = (window as Window & { grecaptcha?: Grecaptcha }).grecaptcha;
    if (!box.current || painted.current || !grecaptcha) return;
    grecaptcha.render(box.current, { sitekey: siteKey });
    painted.current = true;
  }

  if (!siteKey) return null;
  if (typeof window !== "undefined") {
    (window as Window & { onAnodehRecaptcha?: () => void }).onAnodehRecaptcha = paint;
  }
  return (
    <div className="recaptcha">
      <Script src="https://www.google.com/recaptcha/api.js?onload=onAnodehRecaptcha&render=explicit" strategy="afterInteractive" />
      <div ref={box} />
    </div>
  );
}

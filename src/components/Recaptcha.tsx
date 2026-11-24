"use client";

import Script from "next/script";
import { useEffect, useRef } from "react";

type Grecaptcha = {
  render: (el: HTMLElement, options: { sitekey: string }) => number;
  ready: (cb: () => void) => void;
};

export function Recaptcha({ siteKey }: { siteKey: string }) {
  const box = useRef<HTMLDivElement>(null);
  const painted = useRef(false);

  function paint() {
    const grecaptcha = (window as Window & { grecaptcha?: Grecaptcha }).grecaptcha;
    if (!siteKey || !box.current || !grecaptcha || painted.current) return;
    const container = box.current;
    grecaptcha.ready(() => {
      if (painted.current || !container.isConnected || container.childElementCount > 0) return;
      try {
        grecaptcha.render(container, { sitekey: siteKey });
        painted.current = true;
      } catch {
        // Already rendered (e.g. React Strict Mode remount).
      }
    });
  }

  useEffect(() => {
    painted.current = false;
    paint();
  }, [siteKey]);

  if (!siteKey) return null;

  return (
    <div className="recaptcha">
      <Script
        id="anodeh-recaptcha"
        src="https://www.google.com/recaptcha/api.js?render=explicit"
        strategy="afterInteractive"
        onReady={paint}
      />
      <div ref={box} />
    </div>
  );
}

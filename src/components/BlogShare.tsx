"use client";

import { useEffect, useState } from "react";

export function BlogShare({
  url,
  title,
  whatsappUrl,
}: {
  url: string;
  title: string;
  whatsappUrl?: string;
}) {
  const [copied, setCopied] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);
  const facebook = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
  const whatsapp =
    whatsappUrl || `https://wa.me/?text=${encodeURIComponent(`${title}\n\n${url}`)}`;

  useEffect(() => {
    setCanNativeShare(typeof navigator !== "undefined" && typeof navigator.share === "function");
  }, []);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  async function nativeShare() {
    if (!navigator.share) return;
    try {
      await navigator.share({ title, url, text: title });
    } catch {
      // User cancelled or share failed; leave the other buttons available.
    }
  }

  return (
    <div className="blog-share">
      <span className="blog-share-label">Share</span>
      <div className="blog-share-actions">
        <a className="btn ghost" href={facebook} target="_blank" rel="noopener noreferrer">
          Facebook
        </a>
        <a className="btn ghost" href={whatsapp} target="_blank" rel="noopener noreferrer">
          WhatsApp
        </a>
        <button type="button" className="btn ghost" onClick={copyLink}>
          {copied ? "Copied" : "Copy link"}
        </button>
        {canNativeShare ? (
          <button type="button" className="btn ghost" onClick={nativeShare}>
            More
          </button>
        ) : null}
      </div>
    </div>
  );
}

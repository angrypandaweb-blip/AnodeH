"use client";

import { useState } from "react";

export function WhatsAppStatusPack({
  caption,
  imageUrl,
  imageAlt,
  chatShareUrl,
  heading = "WhatsApp Status",
  note = "WhatsApp does not allow websites to auto-post Status. Use this pack after the post is live.",
}: {
  caption: string;
  imageUrl: string;
  imageAlt: string;
  chatShareUrl: string;
  heading?: string;
  note?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copyCaption() {
    try {
      await navigator.clipboard.writeText(caption);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <aside className="wa-status-pack">
      <div className="wa-status-pack-copy">
        <p className="wa-status-pack-kicker">{heading}</p>
        <p className="wa-status-pack-note">{note}</p>
        <ol className="wa-status-pack-steps">
          <li>Save the Status image.</li>
          <li>In WhatsApp: Updates → My status → photo.</li>
          <li>Paste the caption and post.</li>
        </ol>
        <div className="wa-status-pack-actions">
          <a className="btn" href={imageUrl} target="_blank" rel="noopener noreferrer">
            Open Status image
          </a>
          <button type="button" className="btn ghost" onClick={copyCaption}>
            {copied ? "Caption copied" : "Copy caption"}
          </button>
          <a className="btn ghost" href={chatShareUrl} target="_blank" rel="noopener noreferrer">
            Share in WhatsApp chat
          </a>
        </div>
        <pre className="wa-status-caption">{caption}</pre>
      </div>
      <a className="wa-status-pack-image" href={imageUrl} target="_blank" rel="noopener noreferrer">
        <img src={imageUrl} alt={imageAlt} width={640} height={360} />
      </a>
    </aside>
  );
}

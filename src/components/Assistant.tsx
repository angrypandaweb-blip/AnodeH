"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Mark } from "@/components/Mark";
import { assistantReply, type AssistantLink, type AssistantPrices } from "@/lib/assistant";

type Message = { id: number; from: "assistant" | "you"; text: string; links: AssistantLink[] };

const GREETING: Message = {
  id: 0,
  from: "assistant",
  text: "Hi, I’m the AnodeH assistant. Ask about blocking, plans, or the dashboard.",
  links: [],
};

export function Assistant({ prices }: { prices?: AssistantPrices }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<Message[]>([GREETING]);
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    const log = logRef.current;
    if (!log) return;
    log.scrollTop = log.scrollHeight;
  }, [messages, open]);

  function ask(text: string) {
    const question = text.trim();
    if (!question) return;
    const answer = assistantReply(question, prices);
    setMessages((current) => [
      ...current,
      { id: current.length, from: "you", text: question, links: [] },
      { id: current.length + 1, from: "assistant", text: answer.text, links: answer.links },
    ]);
    setDraft("");
  }

  return (
    <div className="assistant">
      {open ? (
        <section className="assistant-panel" role="dialog" aria-labelledby={`${listId}-title`}>
          <header className="assistant-head">
            <Mark />
            <span>
              <strong id={`${listId}-title`}>AnodeH assistant</strong>
              <small>Answers about this site</small>
            </span>
            <button type="button" className="assistant-close" onClick={() => setOpen(false)} aria-label="Close assistant">
              ×
            </button>
          </header>
          <div className="assistant-log" id={listId} ref={logRef}>
            {messages.map((message) => (
              <div className={`assistant-msg from-${message.from}`} key={message.id}>
                <p>{message.text}</p>
                {message.links.length > 0 ? (
                  <p className="assistant-links">
                    {message.links.map((link) => (
                      <a key={link.href} href={link.href}>{link.label}</a>
                    ))}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
          <form
            className="assistant-form"
            onSubmit={(event) => {
              event.preventDefault();
              ask(draft);
            }}
          >
            <input
              ref={inputRef}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Ask a question..."
              aria-label="Ask a question"
              maxLength={240}
            />
            <button type="submit" aria-label="Send" disabled={!draft.trim()}>↑</button>
          </form>
        </section>
      ) : null}
      <button
        type="button"
        className="assistant-launch"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="assistant-launch-mark" aria-hidden>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M5 6.5A3.5 3.5 0 0 1 8.5 3h7A3.5 3.5 0 0 1 19 6.5v6A3.5 3.5 0 0 1 15.5 16H12l-4.2 3.2c-.7.5-1.8 0-1.8-.9V16A3.5 3.5 0 0 1 5 12.5v-6Z" fill="white" />
          </svg>
        </span>
        <span className="sr-only">{open ? "Close assistant" : "Open assistant"}</span>
      </button>
    </div>
  );
}

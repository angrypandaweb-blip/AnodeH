"use client";

import { useEffect, useState } from "react";
import { Mark } from "@/components/Mark";
import { APP_URL } from "@/lib/site";

export function TopBar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`topbar${scrolled ? " is-scrolled" : ""}`}>
      <div className="shell topbar-inner">
        <a className="brand" href="/">
          <Mark />
          WorkLyft
        </a>
        <nav className="nav-links" aria-label="Primary">
          <a href="#product">Product</a>
          <a href="#company">Company</a>
          <a href="#pricing">Pricing</a>
        </nav>
        <a className="btn btn-primary" href={APP_URL} target="_blank" rel="noreferrer">
          Open Crewlyft
        </a>
      </div>
    </header>
  );
}

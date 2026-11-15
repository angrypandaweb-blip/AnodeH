"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "Ideas" },
  { href: "/monday", label: "Monday" },
  { href: "/timeline", label: "Launch" },
];

export function TabBar({ name }: { name: string }) {
  const pathname = usePathname();
  return (
    <nav className="tabs" aria-label="Sections">
      {TABS.map((tab) => {
        const active = tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
        return (
          <Link key={tab.href} href={tab.href} aria-current={active ? "page" : undefined}>
            {tab.label}
          </Link>
        );
      })}
      <p className="who">Signed in as {name}</p>
    </nav>
  );
}

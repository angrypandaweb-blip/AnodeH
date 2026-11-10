"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/dashboard", label: "Overview" },
  { href: "/activity", label: "Activity" },
  { href: "/protection", label: "Protection" },
  { href: "/threats", label: "Threats" },
  { href: "/settings", label: "Settings" },
  { href: "/billing", label: "Plan" },
];

export function Nav({ unread }: { unread: number }) {
  const pathname = usePathname();
  return (
    <nav className="nav">
      {LINKS.map((link) => {
        const active = pathname === link.href || (link.href !== "/dashboard" && pathname.startsWith(link.href));
        return (
          <Link key={link.href} href={link.href} className={active ? "active" : undefined}>
            {link.label}
            {link.href === "/dashboard" && unread > 0 ? <span className="badge">{unread}</span> : null}
          </Link>
        );
      })}
    </nav>
  );
}

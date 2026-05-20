"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";

const NAV = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/projects", label: "Projects" },
  { href: "/logs", label: "Monthly logs" },
  { href: "/evidence", label: "Evidence" },
  { href: "/competencies", label: "Competencies" },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Primary"
      className="flex h-full w-56 shrink-0 flex-col gap-1 border-r border-border bg-surface px-3 py-4"
    >
      <div className="mb-4 px-2 text-xs uppercase tracking-wide text-text-secondary">
        Pr Logbook Tracker
      </div>
      {NAV.map((item) => {
        const active = pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-card text-text-primary"
                : "text-text-secondary hover:bg-card hover:text-text-primary",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

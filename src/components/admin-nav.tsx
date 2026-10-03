"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Wordmark } from "./brand";

export type NavItem = { href: string; label: string; badge?: number };

export function AdminNav({
  items,
  admin,
  logOut,
}: {
  items: NavItem[];
  admin: { name: string; role: string };
  logOut: () => Promise<void>;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isActive = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));

  const links = (
    <nav className="flex flex-col gap-1">
      {items.map((i) => (
        <Link
          key={i.href}
          href={i.href}
          onClick={() => setOpen(false)}
          className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
            isActive(i.href) ? "bg-cream text-ink" : "text-cream/85 hover:bg-ink-card hover:text-cream"
          }`}
        >
          {i.label}
          {!!i.badge && (
            <span className="rounded-full bg-amber px-2 py-0.5 text-xs font-bold text-ink">{i.badge}</span>
          )}
        </Link>
      ))}
    </nav>
  );

  const footer = (
    <div className="mt-auto border-t border-ink-line pt-4 text-sm">
      <p className="font-semibold text-cream">{admin.name}</p>
      <p className="text-xs text-muted-dark">{admin.role === "admin" ? "Admin" : "Helper"}</p>
      <div className="mt-3 flex gap-2">
        <Link href="/" className="btn btn-ghost btn-sm text-muted-dark" target="_blank">
          View site
        </Link>
        <form action={logOut}>
          <button className="btn btn-ghost btn-sm text-muted-dark">Log out</button>
        </form>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col gap-6 overflow-y-auto bg-ink p-4 lg:flex">
        <Link href="/admin" className="px-2 pt-2 text-2xl">
          <Wordmark />
        </Link>
        {links}
        {footer}
      </aside>

      {/* Mobile top bar + drawer */}
      <div className="sticky top-0 z-40 flex items-center justify-between bg-ink px-4 py-3 lg:hidden">
        <Link href="/admin" className="text-xl">
          <Wordmark />
        </Link>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="btn btn-ghost btn-sm text-cream"
          aria-expanded={open}
          aria-label="Menu"
        >
          {open ? "Close" : "Menu"}
          {!open && items.some((i) => i.badge) && <span className="h-2 w-2 rounded-full bg-amber" />}
        </button>
      </div>
      {open && (
        <div className="fixed inset-0 top-[52px] z-30 flex flex-col gap-6 overflow-y-auto bg-ink p-4 lg:hidden">
          {links}
          {footer}
        </div>
      )}
    </>
  );
}

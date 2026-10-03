import Link from "next/link";
import type { ReactNode } from "react";

export function PageHeader({ title, subtitle, actions, back }: { title: string; subtitle?: ReactNode; actions?: ReactNode; back?: { href: string; label: string } }) {
  return (
    <div className="mb-6">
      {back && (
        <Link href={back.href} className="text-sm font-semibold text-muted-light hover:text-ink">
          ← {back.label}
        </Link>
      )}
      <div className="mt-1 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-muted-light">{subtitle}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="px-4 py-10 text-center text-sm text-muted-light">{children}</p>;
}

export function Stat({ label, value, hint, tone = "white", href }: { label: string; value: ReactNode; hint?: ReactNode; tone?: "white" | "amber" | "mint" | "pink" | "dark"; href?: string }) {
  const cls = {
    white: "panel",
    amber: "rounded-2xl bg-amber-tint border border-amber",
    mint: "rounded-2xl bg-mint-tint border border-mint",
    pink: "rounded-2xl bg-pink-tint border border-pink",
    dark: "rounded-2xl bg-ink text-cream",
  }[tone];
  const body = (
    <div className={`${cls} h-full p-4`}>
      <p className="text-xs font-bold opacity-70">{label}</p>
      <p className="mt-1 whitespace-nowrap font-display text-2xl sm:text-3xl">{value}</p>
      {hint && <p className="mt-1 text-xs opacity-70">{hint}</p>}
    </div>
  );
  return href ? (
    <Link href={href} className="block transition-transform hover:-translate-y-0.5">
      {body}
    </Link>
  ) : (
    body
  );
}

/** Pill links that set a query param, e.g. status filters. */
export function FilterPills({ base, param, value, options, keep = {} }: { base: string; param: string; value: string; options: { value: string; label: string; count?: number }[]; keep?: Record<string, string | undefined> }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const qs = new URLSearchParams();
        for (const [k, v] of Object.entries(keep)) if (v) qs.set(k, v);
        if (o.value) qs.set(param, o.value);
        const active = value === o.value;
        return (
          <Link
            key={o.value || "all"}
            href={`${base}${qs.size ? `?${qs}` : ""}`}
            className={`rounded-full border px-3 py-1.5 text-sm font-semibold ${
              active ? "border-ink bg-ink text-cream" : "border-cream-line bg-white hover:border-ink"
            }`}
          >
            {o.label}
            {o.count != null && <span className="ml-1.5 opacity-60">{o.count}</span>}
          </Link>
        );
      })}
    </div>
  );
}

export function Field({ label, hint, children, className = "" }: { label: string; hint?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <label className={`field ${className}`}>
      <span className="field-label">{label}</span>
      {children}
      {hint && <span className="field-hint">{hint}</span>}
    </label>
  );
}

export function sp(v: string | string[] | undefined) {
  return typeof v === "string" ? v : "";
}

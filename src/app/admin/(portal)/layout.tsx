import type { Metadata } from "next";
import { count, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { AdminNav, type NavItem } from "@/components/admin-nav";
import { canAccess, requireAdmin, type Section } from "@/lib/auth";
import { adminLogOut } from "../_actions/auth";

export const metadata: Metadata = { title: { default: "Admin", template: "%s · Admin" }, robots: { index: false } };

const NAV: (NavItem & { section: Section })[] = [
  { href: "/admin", label: "Dashboard", section: "dashboard" },
  { href: "/admin/payments", label: "Payments", section: "payments" },
  { href: "/admin/members", label: "Members", section: "members" },
  { href: "/admin/events", label: "Events", section: "events" },
  { href: "/admin/bookings", label: "Bookings", section: "bookings" },
  { href: "/admin/fees", label: "Fees and plans", section: "fees" },
  { href: "/admin/content", label: "Content", section: "content" },
  { href: "/admin/messaging", label: "Messaging", section: "messaging" },
  { href: "/admin/reports", label: "Reports", section: "reports" },
  { href: "/admin/settings", label: "Settings", section: "settings" },
];

export default async function PortalLayout({ children }: LayoutProps<"/admin">) {
  const admin = await requireAdmin();
  const [pending] = await db
    .select({ n: count() })
    .from(schema.payments)
    .where(eq(schema.payments.status, "pending"));
  const items = NAV.filter((n) => canAccess(admin.role, n.section)).map(({ section, ...n }) =>
    section === "payments" ? { ...n, badge: pending?.n ?? 0 } : n,
  );

  return (
    <div className="min-h-dvh bg-cream text-ink lg:flex">
      <AdminNav items={items} admin={{ name: admin.name, role: admin.role }} logOut={adminLogOut} />
      <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
    </div>
  );
}

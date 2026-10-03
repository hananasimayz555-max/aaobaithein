import "server-only";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { cache } from "react";
import { db, schema } from "@/db";
import type { AdminRole } from "@/db/schema";
import { readAdminSession, readMemberSession } from "./session";

export const getCurrentAdmin = cache(async () => {
  const id = await readAdminSession();
  if (!id) return null;
  const admin = await db.query.adminUsers.findFirst({ where: eq(schema.adminUsers.id, id) });
  return admin && admin.active ? admin : null;
});

/** Sections a helper is allowed to use. Admins can use everything. */
export const HELPER_SECTIONS = ["dashboard", "payments", "bookings"] as const;
export type Section =
  | "dashboard"
  | "members"
  | "events"
  | "fees"
  | "bookings"
  | "payments"
  | "content"
  | "messaging"
  | "reports"
  | "settings";

export function canAccess(role: AdminRole, section: Section) {
  return role === "admin" || (HELPER_SECTIONS as readonly string[]).includes(section);
}

/** Use at the top of every admin page and server action. */
export async function requireAdmin(section: Section = "dashboard") {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");
  if (!canAccess(admin.role, section)) redirect("/admin?denied=1");
  return admin;
}

export const getCurrentMember = cache(async () => {
  const id = await readMemberSession();
  if (!id) return null;
  return (await db.query.members.findFirst({ where: eq(schema.members.id, id) })) ?? null;
});

export async function requireMember(next = "/account") {
  const member = await getCurrentMember();
  if (!member) redirect(`/account/login?next=${encodeURIComponent(next)}`);
  return member;
}

"use server";

import bcrypt from "bcryptjs";
import { and, eq, ne } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db, schema } from "@/db";
import { ADMIN_ROLES, type AdminRole } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { int, normalizeWhatsapp, str } from "@/lib/format";
import { SETTING_KEYS } from "@/lib/settings";

export async function saveSettings(fd: FormData) {
  await requireAdmin("settings");
  for (const key of Object.keys(SETTING_KEYS)) {
    let value = str(fd, key);
    if (key === "contact_whatsapp" && value) value = normalizeWhatsapp(value) ?? value.replace(/\D/g, "");
    if (key === "site_url") value = value.replace(/\/+$/, "");
    await db.insert(schema.settings).values({ key, value }).onConflictDoUpdate({ target: schema.settings.key, set: { value } });
  }
  revalidatePath("/", "layout");
  redirect("/admin/settings?saved=settings");
}

export async function addAdmin(fd: FormData) {
  await requireAdmin("settings");
  const email = str(fd, "email").toLowerCase();
  const password = str(fd, "password");
  const role = str(fd, "role") as AdminRole;
  if (!str(fd, "name") || !email.includes("@") || password.length < 8) redirect("/admin/settings?error=admin");
  const exists = await db.query.adminUsers.findFirst({ where: eq(schema.adminUsers.email, email) });
  if (exists) redirect("/admin/settings?error=exists");
  await db.insert(schema.adminUsers).values({
    name: str(fd, "name"),
    email,
    passwordHash: await bcrypt.hash(password, 10),
    role: ADMIN_ROLES.includes(role) ? role : "helper",
  });
  redirect("/admin/settings?saved=admin");
}

export async function updateAdmin(fd: FormData) {
  const me = await requireAdmin("settings");
  const id = int(fd, "id") ?? 0;
  const role = str(fd, "role") as AdminRole;
  const active = fd.get("active") === "on";
  if (id === me.id && (role !== "admin" || !active)) redirect("/admin/settings?error=self");
  if (!active || role !== "admin") {
    const others = await db.query.adminUsers.findMany({
      where: and(ne(schema.adminUsers.id, id), eq(schema.adminUsers.role, "admin"), eq(schema.adminUsers.active, true)),
    });
    if (!others.length) redirect("/admin/settings?error=last");
  }
  const password = str(fd, "password");
  if (password && password.length < 8) redirect("/admin/settings?error=admin");
  await db
    .update(schema.adminUsers)
    .set({
      role: ADMIN_ROLES.includes(role) ? role : "helper",
      active,
      ...(password ? { passwordHash: await bcrypt.hash(password, 10) } : {}),
    })
    .where(eq(schema.adminUsers.id, id));
  redirect("/admin/settings?saved=admin");
}

export async function changeOwnPassword(fd: FormData) {
  const me = await requireAdmin("dashboard");
  const current = str(fd, "current");
  const next = str(fd, "next");
  if (!(await bcrypt.compare(current, me.passwordHash))) redirect("/admin/settings?error=current");
  if (next.length < 8) redirect("/admin/settings?error=short");
  await db.update(schema.adminUsers).set({ passwordHash: await bcrypt.hash(next, 10) }).where(eq(schema.adminUsers.id, me.id));
  redirect("/admin/settings?saved=password");
}

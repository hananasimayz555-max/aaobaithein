"use server";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db, schema } from "@/db";
import type { FormState } from "@/components/ui";
import { str } from "@/lib/format";
import { endAdminSession, startAdminSession } from "@/lib/session";

export async function adminLogIn(_: FormState, fd: FormData): Promise<FormState> {
  const email = str(fd, "email").toLowerCase();
  const admin = await db.query.adminUsers.findFirst({ where: eq(schema.adminUsers.email, email) });
  if (!admin || !admin.active || !(await bcrypt.compare(str(fd, "password"), admin.passwordHash))) {
    await new Promise((r) => setTimeout(r, 600));
    return { error: "Email or password is wrong." };
  }
  await startAdminSession(admin.id);
  redirect("/admin");
}

export async function adminLogOut() {
  await endAdminSession();
  redirect("/admin/login");
}

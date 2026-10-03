"use server";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db, schema } from "@/db";
import { MEMBER_STATUSES, MEMBER_TYPES, type MemberStatus, type MemberType } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { int, list, normalizeWhatsapp, parseLocalInput, str } from "@/lib/format";

export async function updateMember(fd: FormData) {
  await requireAdmin("members");
  const id = int(fd, "id") ?? 0;
  const whatsapp = normalizeWhatsapp(str(fd, "whatsapp"));
  const status = str(fd, "status") as MemberStatus;
  const memberType = str(fd, "memberType") as MemberType;
  const clash = whatsapp ? await db.query.members.findFirst({ where: eq(schema.members.whatsapp, whatsapp) }) : null;
  if (!whatsapp || (clash && clash.id !== id)) redirect(`/admin/members/${id}?error=whatsapp`);
  const before = await db.query.members.findFirst({ where: eq(schema.members.id, id) });
  if (!before) redirect("/admin/members");

  await db
    .update(schema.members)
    .set({
      name: str(fd, "name"),
      whatsapp,
      city: str(fd, "city"),
      age: int(fd, "age") ?? 18,
      memberType: MEMBER_TYPES.includes(memberType) ? memberType : "student",
      status: MEMBER_STATUSES.includes(status) ? status : "pending",
      expiresAt: parseLocalInput(fd.get("expiresAt"), true),
      tags: list(fd, "tags").map((t) => t.toLowerCase()),
      notes: str(fd, "notes"),
      joinedAt: before.joinedAt ?? (status === "active" ? new Date() : null),
    })
    .where(eq(schema.members.id, id));
  revalidatePath("/admin", "layout");
  redirect(`/admin/members/${id}?saved=1`);
}

export async function resetMemberPin(fd: FormData) {
  await requireAdmin("members");
  const id = int(fd, "id") ?? 0;
  const pin = String(100000 + (crypto.getRandomValues(new Uint32Array(1))[0] % 900000));
  await db.update(schema.members).set({ pinHash: await bcrypt.hash(pin, 10) }).where(eq(schema.members.id, id));
  redirect(`/admin/members/${id}?pin=${pin}`);
}

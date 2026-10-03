"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db, schema } from "@/db";
import { APPLIES_TO, BILLING_TYPES, FEE_STATUSES, MEMBER_TYPES, type AppliesTo, type BillingType, type FeeStatus, type MemberType } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { int, list, parseLocalInput, str } from "@/lib/format";

export async function saveFee(fd: FormData) {
  const admin = await requireAdmin("fees");
  const id = int(fd, "id");
  const amount = int(fd, "amount");
  const billingType = str(fd, "billingType") as BillingType;
  const appliesTo = str(fd, "appliesTo") as AppliesTo;
  const status = str(fd, "status") as FeeStatus;
  const back = id ? `/admin/fees/${id}` : "/admin/fees/new";
  if (!str(fd, "name") || amount == null || amount < 0 || !BILLING_TYPES.includes(billingType) || !APPLIES_TO.includes(appliesTo))
    redirect(`${back}?error=missing`);
  if (billingType === "custom" && !int(fd, "customPeriodDays")) redirect(`${back}?error=period`);

  const values = {
    name: str(fd, "name"),
    description: str(fd, "description"),
    amount,
    billingType,
    customPeriodDays: billingType === "custom" ? int(fd, "customPeriodDays") : null,
    appliesTo,
    audienceMemberTypes: fd.getAll("audienceMemberTypes").filter((t): t is MemberType => MEMBER_TYPES.includes(t as MemberType)),
    audienceAgeMin: int(fd, "audienceAgeMin"),
    audienceAgeMax: int(fd, "audienceAgeMax"),
    audienceCities: list(fd, "audienceCities"),
    audienceTags: list(fd, "audienceTags").map((t) => t.toLowerCase()),
    validFrom: parseLocalInput(fd.get("validFrom")),
    validTo: parseLocalInput(fd.get("validTo"), true),
    earlyBirdAmount: int(fd, "earlyBirdAmount"),
    earlyBirdUntil: parseLocalInput(fd.get("earlyBirdUntil"), true),
    depositAmount: appliesTo === "membership" ? null : int(fd, "depositAmount") || null,
    status: FEE_STATUSES.includes(status) ? status : "draft",
    updatedAt: new Date(),
  };

  let feeId: number;
  let version = 1;
  if (id) {
    const before = await db.query.feeStructures.findFirst({ where: eq(schema.feeStructures.id, id) });
    if (!before) redirect("/admin/fees");
    version = before.version + 1;
    await db.update(schema.feeStructures).set({ ...values, version }).where(eq(schema.feeStructures.id, id));
    feeId = id;
  } else {
    feeId = (await db.insert(schema.feeStructures).values(values).returning({ id: schema.feeStructures.id }))[0].id;
  }
  // Payments and bookings keep their own copy of the amount, so this never changes what anyone already paid.
  const saved = await db.query.feeStructures.findFirst({ where: eq(schema.feeStructures.id, feeId) });
  await db.insert(schema.feeHistory).values({ feeStructureId: feeId, version, snapshot: saved, changedBy: admin.name });

  revalidatePath("/", "layout");
  redirect(`/admin/fees/${feeId}?saved=1`);
}

export async function setFeeStatus(fd: FormData) {
  const admin = await requireAdmin("fees");
  const id = int(fd, "id") ?? 0;
  const status = str(fd, "status") as FeeStatus;
  if (!FEE_STATUSES.includes(status)) redirect("/admin/fees");
  const before = await db.query.feeStructures.findFirst({ where: eq(schema.feeStructures.id, id) });
  if (!before) redirect("/admin/fees");
  await db
    .update(schema.feeStructures)
    .set({ status, version: before.version + 1, updatedAt: new Date() })
    .where(eq(schema.feeStructures.id, id));
  await db.insert(schema.feeHistory).values({
    feeStructureId: id,
    version: before.version + 1,
    snapshot: { ...before, status },
    changedBy: admin.name,
  });
  revalidatePath("/", "layout");
  redirect(str(fd, "back") || "/admin/fees");
}

export async function saveDiscount(fd: FormData) {
  await requireAdmin("fees");
  const code = str(fd, "code").toUpperCase().replace(/\s+/g, "");
  const percentOff = int(fd, "percentOff");
  const amountOff = int(fd, "amountOff");
  if (!code || (!percentOff && !amountOff)) redirect("/admin/fees?error=code#codes");
  const exists = await db.query.discountCodes.findFirst({ where: eq(schema.discountCodes.code, code) });
  if (exists) redirect("/admin/fees?error=dupe#codes");
  await db.insert(schema.discountCodes).values({
    code,
    percentOff: percentOff ? Math.min(100, percentOff) : null,
    amountOff: percentOff ? null : amountOff,
    feeStructureId: int(fd, "feeStructureId") || null,
    validUntil: parseLocalInput(fd.get("validUntil"), true),
    maxUses: int(fd, "maxUses"),
  });
  redirect("/admin/fees#codes");
}

export async function toggleDiscount(fd: FormData) {
  await requireAdmin("fees");
  const id = int(fd, "id") ?? 0;
  const row = await db.query.discountCodes.findFirst({ where: eq(schema.discountCodes.id, id) });
  if (row) await db.update(schema.discountCodes).set({ active: !row.active }).where(eq(schema.discountCodes.id, id));
  redirect("/admin/fees#codes");
}

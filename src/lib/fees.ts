import "server-only";
import { and, eq, inArray, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import type { AppliesTo } from "@/db/schema";
import { rs } from "./format";

type Fee = typeof schema.feeStructures.$inferSelect;
type Member = typeof schema.members.$inferSelect;
type Audience = Pick<Member, "memberType" | "age" | "city" | "tags">;

export function isFeeLive(fee: Fee, now = new Date()) {
  if (fee.status !== "active") return false;
  if (fee.validFrom && fee.validFrom > now) return false;
  if (fee.validTo && fee.validTo < now) return false;
  return true;
}

export function isOpenToEveryone(fee: Fee) {
  return (
    fee.audienceMemberTypes.length === 0 &&
    fee.audienceAgeMin == null &&
    fee.audienceAgeMax == null &&
    fee.audienceCities.length === 0 &&
    fee.audienceTags.length === 0
  );
}

export function matchesAudience(fee: Fee, who: Audience) {
  if (fee.audienceMemberTypes.length && !fee.audienceMemberTypes.includes(who.memberType)) return false;
  if (fee.audienceAgeMin != null && who.age < fee.audienceAgeMin) return false;
  if (fee.audienceAgeMax != null && who.age > fee.audienceAgeMax) return false;
  if (fee.audienceCities.length) {
    const city = who.city.trim().toLowerCase();
    if (!fee.audienceCities.some((c) => c.toLowerCase() === city)) return false;
  }
  if (fee.audienceTags.length) {
    const tags = new Set(who.tags.map((t) => t.toLowerCase()));
    if (!fee.audienceTags.some((t) => tags.has(t.toLowerCase()))) return false;
  }
  return true;
}

/** Price right now, taking the early-bird window into account. */
export function currentPrice(fee: Fee, now = new Date()) {
  if (fee.earlyBirdAmount != null && fee.earlyBirdUntil && now <= fee.earlyBirdUntil) {
    return { amount: fee.earlyBirdAmount, earlyBird: true };
  }
  return { amount: fee.amount, earlyBird: false };
}

export function describeAudience(fee: Fee) {
  const parts: string[] = [];
  if (fee.audienceMemberTypes.length) parts.push(fee.audienceMemberTypes.join(", ").replaceAll("_", " "));
  if (fee.audienceAgeMin != null || fee.audienceAgeMax != null)
    parts.push(`age ${fee.audienceAgeMin ?? 18}–${fee.audienceAgeMax ?? 30}`);
  if (fee.audienceCities.length) parts.push(fee.audienceCities.join(", "));
  if (fee.audienceTags.length) parts.push(`tags: ${fee.audienceTags.join(", ")}`);
  return parts.length ? parts.join(" · ") : "Everyone";
}

/** Membership duration in days for a billing type; null means it never expires. */
export function periodDays(fee: Fee) {
  switch (fee.billingType) {
    case "monthly":
      return 30;
    case "quarterly":
      return 91;
    case "yearly":
      return 365;
    case "custom":
      return fee.customPeriodDays ?? null;
    default:
      return null;
  }
}

export function nextExpiry(current: Date | null, fee: Fee, now = new Date()) {
  const days = periodDays(fee);
  if (days == null) return null;
  const start = current && current > now ? current : now;
  return new Date(start.getTime() + days * 24 * 60 * 60 * 1000);
}

export async function liveFees(appliesTo: AppliesTo) {
  const rows = await db.query.feeStructures.findMany({
    where: and(eq(schema.feeStructures.appliesTo, appliesTo), eq(schema.feeStructures.status, "active")),
  });
  return rows.filter((f) => isFeeLive(f)).sort((a, b) => currentPrice(a).amount - currentPrice(b).amount);
}

export async function membershipPlansFor(who: Audience) {
  return (await liveFees("membership")).filter((f) => matchesAudience(f, who));
}

export async function feesForEvent(eventId: number) {
  const links = await db.select().from(schema.eventFees).where(eq(schema.eventFees.eventId, eventId));
  if (!links.length) return [];
  const rows = await db.query.feeStructures.findMany({
    where: inArray(
      schema.feeStructures.id,
      links.map((l) => l.feeStructureId),
    ),
  });
  return rows.filter((f) => isFeeLive(f)).sort((a, b) => currentPrice(a).amount - currentPrice(b).amount);
}

/** Cheapest fee on the event the member qualifies for. */
export async function eventFeeFor(eventId: number, who: Audience | null) {
  const fees = await feesForEvent(eventId);
  if (!who) return fees.find(isOpenToEveryone) ?? fees[0] ?? null;
  return fees.find((f) => matchesAudience(f, who)) ?? null;
}

export async function checkDiscount(code: string, feeId: number, amount: number) {
  const c = code.trim().toUpperCase();
  if (!c) return { ok: true as const, amount, code: null };
  const row = await db.query.discountCodes.findFirst({ where: eq(schema.discountCodes.code, c) });
  const now = new Date();
  if (
    !row ||
    !row.active ||
    (row.validUntil && row.validUntil < now) ||
    (row.maxUses != null && row.uses >= row.maxUses) ||
    (row.feeStructureId != null && row.feeStructureId !== feeId)
  ) {
    return { ok: false as const, error: "That discount code isn't valid for this." };
  }
  let off = 0;
  if (row.percentOff) off = Math.round((amount * row.percentOff) / 100);
  if (row.amountOff) off = row.amountOff;
  return { ok: true as const, amount: Math.max(0, amount - off), code: c };
}

export async function recordDiscountUse(code: string | null) {
  if (!code) return;
  await db
    .update(schema.discountCodes)
    .set({ uses: sql`${schema.discountCodes.uses} + 1` })
    .where(eq(schema.discountCodes.code, code));
}

/** Prices the public site can quote, e.g. inside FAQ answers via {membership_fee}. */
export async function publicPrices() {
  const pick = (fees: Fee[]) => {
    const f = fees.find(isOpenToEveryone) ?? fees[0];
    return f ? currentPrice(f).amount : null;
  };
  const [m, b, r] = await Promise.all([liveFees("membership"), liveFees("baithak"), liveFees("retreat")]);
  return { membership: pick(m), baithak: pick(b), retreat: pick(r) };
}

export async function fillPricePlaceholders(text: string) {
  if (!/\{(membership|baithak|retreat)_fee\}/.test(text)) return text;
  const p = await publicPrices();
  const v = (n: number | null) => (n == null ? "set by the team soon" : rs(n));
  return text
    .replaceAll("{membership_fee}", v(p.membership))
    .replaceAll("{baithak_fee}", v(p.baithak))
    .replaceAll("{retreat_fee}", v(p.retreat));
}

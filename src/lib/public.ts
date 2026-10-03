import "server-only";
import { and, asc, desc, eq, gt, inArray } from "drizzle-orm";
import { db, schema } from "@/db";
import { seatCounts } from "./domain";
import { currentPrice, feesForEvent, fillPricePlaceholders, isOpenToEveryone } from "./fees";

export async function upcomingEvents(limit = 20) {
  const rows = await db.query.events.findMany({
    where: and(
      eq(schema.events.showOnSite, true),
      inArray(schema.events.status, ["open", "full"]),
      gt(schema.events.startsAt, new Date()),
    ),
    orderBy: asc(schema.events.startsAt),
    limit,
  });
  const seats = await seatCounts();
  return Promise.all(
    rows.map(async (e) => {
      const fees = await feesForEvent(e.id);
      const headline = fees.find(isOpenToEveryone) ?? fees[0];
      const taken = seats.get(e.id) ?? 0;
      return {
        ...e,
        seatsLeft: Math.max(0, e.seatLimit - taken),
        price: headline ? currentPrice(headline) : null,
        priceFrom: fees.length > 1,
        deposit: headline?.depositAmount ?? null,
      };
    }),
  );
}
export type PublicEvent = Awaited<ReturnType<typeof upcomingEvents>>[number];

export async function siteTestimonials() {
  return db.query.testimonials.findMany({
    where: and(eq(schema.testimonials.approved, true), eq(schema.testimonials.showOnSite, true)),
    orderBy: desc(schema.testimonials.createdAt),
    limit: 6,
  });
}

export async function siteFaq() {
  const rows = await db.query.faqItems.findMany({
    where: eq(schema.faqItems.published, true),
    orderBy: asc(schema.faqItems.sortOrder),
  });
  return Promise.all(rows.map(async (f) => ({ ...f, answer: await fillPricePlaceholders(f.answer) })));
}

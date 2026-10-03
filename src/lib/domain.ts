import "server-only";
import { and, count, eq, inArray, isNotNull, lt } from "drizzle-orm";
import { db, schema } from "@/db";

/** Flip active members whose expiry has passed to Expired. Cheap; call on portal loads. */
export async function refreshExpiries() {
  await db
    .update(schema.members)
    .set({ status: "expired" })
    .where(
      and(
        eq(schema.members.status, "active"),
        isNotNull(schema.members.expiresAt),
        lt(schema.members.expiresAt, new Date()),
      ),
    );
}

export const SEAT_HOLDING: ("confirmed" | "attended")[] = ["confirmed", "attended"];

export async function seatsTaken(eventId: number) {
  const [row] = await db
    .select({ n: count() })
    .from(schema.bookings)
    .where(and(eq(schema.bookings.eventId, eventId), inArray(schema.bookings.status, SEAT_HOLDING)));
  return row?.n ?? 0;
}

export async function seatCounts() {
  const rows = await db
    .select({ eventId: schema.bookings.eventId, n: count() })
    .from(schema.bookings)
    .where(inArray(schema.bookings.status, SEAT_HOLDING))
    .groupBy(schema.bookings.eventId);
  return new Map(rows.map((r) => [r.eventId, r.n]));
}

export function receiptNo(id: number, date = new Date()) {
  return `AB-${date.getFullYear()}-${String(id).padStart(5, "0")}`;
}

export function randomToken(bytes = 16) {
  const a = new Uint8Array(bytes);
  crypto.getRandomValues(a);
  return Array.from(a, (b) => b.toString(16).padStart(2, "0")).join("");
}

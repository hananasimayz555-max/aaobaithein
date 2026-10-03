"use server";

import { and, eq, ne } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db, schema } from "@/db";
import { BOOKING_STATUSES, EVENT_STATUSES, EVENT_TYPES, type BookingStatus, type EventStatus, type EventType } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { int, parseLocalInput, slugify, str } from "@/lib/format";
import { seatsTaken } from "@/lib/domain";

export async function saveEvent(fd: FormData) {
  await requireAdmin("events");
  const id = int(fd, "id");
  const title = str(fd, "title");
  const type = str(fd, "type") as EventType;
  const status = str(fd, "status") as EventStatus;
  const startsAt = parseLocalInput(fd.get("startsAt"));
  const seatLimit = int(fd, "seatLimit");
  const back = id ? `/admin/events/${id}/edit` : "/admin/events/new";
  if (!title || !startsAt || !seatLimit || seatLimit < 1 || !EVENT_TYPES.includes(type)) redirect(`${back}?error=missing`);

  let slug = slugify(str(fd, "slug") || title) || "event";
  for (let n = 2; ; n++) {
    const clash = await db.query.events.findFirst({
      where: id ? and(eq(schema.events.slug, slug), ne(schema.events.id, id)) : eq(schema.events.slug, slug),
    });
    if (!clash) break;
    slug = `${slug.replace(/-\d+$/, "")}-${n}`;
  }

  const values = {
    title,
    slug,
    type,
    status: EVENT_STATUSES.includes(status) ? status : "draft",
    startsAt,
    endsAt: parseLocalInput(fd.get("endsAt")),
    place: str(fd, "place"),
    city: str(fd, "city"),
    description: str(fd, "description"),
    seatLimit,
    cardBlurb: str(fd, "cardBlurb"),
    cardColor: (["pink", "mint", "dark"].includes(str(fd, "cardColor")) ? str(fd, "cardColor") : "mint") as "pink" | "mint" | "dark",
    showOnSite: fd.get("showOnSite") === "on",
  };

  let eventId = id;
  if (id) await db.update(schema.events).set(values).where(eq(schema.events.id, id));
  else eventId = (await db.insert(schema.events).values(values).returning({ id: schema.events.id }))[0].id;

  const feeIds = fd.getAll("feeIds").map(Number).filter(Boolean);
  await db.delete(schema.eventFees).where(eq(schema.eventFees.eventId, eventId!));
  if (feeIds.length) await db.insert(schema.eventFees).values(feeIds.map((f) => ({ eventId: eventId!, feeStructureId: f })));

  revalidatePath("/", "layout");
  redirect(`/admin/events/${eventId}?saved=1`);
}

/** Change a booking's status from the event page or the bookings list. */
export async function setBookingStatus(fd: FormData) {
  await requireAdmin("bookings");
  const id = int(fd, "bookingId") ?? 0;
  const status = str(fd, "status") as BookingStatus;
  const back = str(fd, "back") || "/admin/bookings";
  if (!BOOKING_STATUSES.includes(status)) redirect(back);
  const booking = await db.query.bookings.findFirst({ where: eq(schema.bookings.id, id) });
  if (!booking) redirect(back);

  if (status === "confirmed" && !["confirmed", "attended"].includes(booking.status)) {
    const event = await db.query.events.findFirst({ where: eq(schema.events.id, booking.eventId) });
    if (event && (await seatsTaken(event.id)) >= event.seatLimit) redirect(`${back}${back.includes("?") ? "&" : "?"}error=full`);
  }
  await db
    .update(schema.bookings)
    .set({ status, attendedAt: status === "attended" ? new Date() : null })
    .where(eq(schema.bookings.id, id));
  revalidatePath("/admin", "layout");
  redirect(back);
}

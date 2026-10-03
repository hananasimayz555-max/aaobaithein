import "server-only";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import type { TemplatePurpose } from "@/db/schema";
import { messageLink, varsFor } from "./messages";
import { getSettings } from "./settings";

/** After a payment is reviewed: the right WhatsApp message to send the member next. */
export async function paymentFollowUp(paymentId: number) {
  const payment = await db.query.payments.findFirst({
    where: eq(schema.payments.id, paymentId),
    columns: { screenshot: false },
  });
  if (!payment || payment.status === "pending") return null;
  const member = await db.query.members.findFirst({ where: eq(schema.members.id, payment.memberId) });
  if (!member) return null;
  const settings = await getSettings();
  const booking = payment.bookingId
    ? await db.query.bookings.findFirst({ where: eq(schema.bookings.id, payment.bookingId) })
    : null;
  const event = booking ? await db.query.events.findFirst({ where: eq(schema.events.id, booking.eventId) }) : null;

  let purpose: TemplatePurpose;
  let link = settings.site_url ? `${settings.site_url}/account` : "";
  if (payment.status === "rejected") purpose = "payment_rejected";
  else if (payment.purpose === "membership") {
    purpose = "welcome";
    link = settings.community_link;
  } else if (booking?.status === "waitlisted") purpose = "waitlisted";
  else if (booking?.status === "confirmed" && payment.purpose === "event") purpose = "booking_confirmed";
  else purpose = "payment_received";

  const href = await messageLink(
    purpose,
    member.whatsapp,
    varsFor(member, { event, amount: payment.amount, link, reason: payment.rejectReason ?? undefined }),
  );
  return { payment, member, purpose, href, bookingId: booking?.id ?? null };
}

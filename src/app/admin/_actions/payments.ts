"use server";

import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { seatsTaken } from "@/lib/domain";
import { nextExpiry, recordDiscountUse } from "@/lib/fees";
import { int, str } from "@/lib/format";

export async function approvePayment(fd: FormData) {
  const admin = await requireAdmin("payments");
  const id = int(fd, "paymentId") ?? 0;
  const back = str(fd, "back") || "/admin/payments";
  const payment = await db.query.payments.findFirst({ where: eq(schema.payments.id, id) });
  if (!payment || payment.status !== "pending") redirect(back);

  const member = await db.query.members.findFirst({ where: eq(schema.members.id, payment.memberId) });
  if (!member) redirect(back);

  // Claim the payment first so a double tap can't approve it twice.
  const claimed = await db
    .update(schema.payments)
    .set({ status: "approved", reviewedBy: admin.name, reviewedAt: new Date() })
    .where(and(eq(schema.payments.id, id), eq(schema.payments.status, "pending")))
    .returning({ id: schema.payments.id });
  if (!claimed.length) redirect(back);

  if (payment.purpose === "membership") {
    const fee = payment.feeStructureId
      ? await db.query.feeStructures.findFirst({ where: eq(schema.feeStructures.id, payment.feeStructureId) })
      : null;
    const current = member.status === "active" ? member.expiresAt : null;
    await db
      .update(schema.members)
      .set({
        status: "active",
        joinedAt: member.joinedAt ?? new Date(),
        expiresAt: fee ? nextExpiry(current, fee) : null,
        planId: fee?.id ?? member.planId,
      })
      .where(eq(schema.members.id, member.id));
    await recordDiscountUse(payment.discountCode);
  } else if (payment.bookingId) {
    const booking = await db.query.bookings.findFirst({ where: eq(schema.bookings.id, payment.bookingId) });
    if (booking) {
      let status = booking.status;
      if (status === "requested") {
        const event = await db.query.events.findFirst({ where: eq(schema.events.id, booking.eventId) });
        const taken = await seatsTaken(booking.eventId);
        status = event && taken < event.seatLimit ? "confirmed" : "waitlisted";
      }
      await db
        .update(schema.bookings)
        .set({ amountPaid: booking.amountPaid + payment.amount, status })
        .where(eq(schema.bookings.id, booking.id));
      if (booking.amountPaid === 0) await recordDiscountUse(payment.discountCode);
    }
  }

  revalidatePath("/admin", "layout");
  redirect(`${back}${back.includes("?") ? "&" : "?"}done=${id}`);
}

export async function rejectPayment(fd: FormData) {
  const admin = await requireAdmin("payments");
  const id = int(fd, "paymentId") ?? 0;
  const back = str(fd, "back") || "/admin/payments";
  await db
    .update(schema.payments)
    .set({
      status: "rejected",
      rejectReason: str(fd, "reason") || "The screenshot didn't match a payment we received.",
      reviewedBy: admin.name,
      reviewedAt: new Date(),
    })
    .where(and(eq(schema.payments.id, id), eq(schema.payments.status, "pending")));
  revalidatePath("/admin", "layout");
  redirect(`${back}${back.includes("?") ? "&" : "?"}done=${id}`);
}

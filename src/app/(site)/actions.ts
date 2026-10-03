"use server";

import bcrypt from "bcryptjs";
import { and, eq, inArray } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db, schema } from "@/db";
import { MEMBER_TYPES, PAYMENT_METHODS, type MemberType, type PaymentMethod } from "@/db/schema";
import { getCurrentMember, requireMember } from "@/lib/auth";
import { randomToken, receiptNo, seatsTaken } from "@/lib/domain";
import { checkDiscount, currentPrice, eventFeeFor, isFeeLive, matchesAudience } from "@/lib/fees";
import { int, label, normalizeWhatsapp, str } from "@/lib/format";
import { endMemberSession, startMemberSession } from "@/lib/session";
import type { FormState } from "@/components/ui";

const MAX_SCREENSHOT = 3_000_000; // characters of base64, roughly 2.2 MB

function safeNext(next: string) {
  return next.startsWith("/") && !next.startsWith("//") ? next : "/account";
}

export async function signUp(_: FormState, fd: FormData): Promise<FormState> {
  const name = str(fd, "name");
  const whatsapp = normalizeWhatsapp(str(fd, "whatsapp"));
  const city = str(fd, "city");
  const age = int(fd, "age");
  const memberType = str(fd, "memberType") as MemberType;
  const stuckOn = str(fd, "stuckOn");
  const pin = str(fd, "pin");

  if (name.length < 2) return { error: "Please tell us your name." };
  if (!whatsapp) return { error: "That WhatsApp number doesn't look right. Try 03XX XXXXXXX." };
  if (!city) return { error: "Which city are you in?" };
  if (age == null || age < 18 || age > 30) return { error: "Aao Baithein is for ages 18 to 30." };
  if (!MEMBER_TYPES.includes(memberType)) return { error: "Pick the option that describes you best." };
  if (!/^\d{4,8}$/.test(pin)) return { error: "Choose a PIN of 4 to 8 digits. You'll use it to log in." };
  if (pin !== str(fd, "pinConfirm")) return { error: "The two PINs don't match." };

  const existing = await db.query.members.findFirst({ where: eq(schema.members.whatsapp, whatsapp) });
  if (existing) return { error: "This WhatsApp number is already registered. Log in instead." };

  const [m] = await db
    .insert(schema.members)
    .values({ name, whatsapp, city, age, memberType, stuckOn, pinHash: await bcrypt.hash(pin, 10) })
    .returning({ id: schema.members.id });
  await startMemberSession(m.id);
  redirect("/confirm/signup");
}

export async function logIn(_: FormState, fd: FormData): Promise<FormState> {
  const whatsapp = normalizeWhatsapp(str(fd, "whatsapp"));
  const pin = str(fd, "pin");
  const member = whatsapp ? await db.query.members.findFirst({ where: eq(schema.members.whatsapp, whatsapp) }) : null;
  if (!member || !(await bcrypt.compare(pin, member.pinHash))) {
    await new Promise((r) => setTimeout(r, 600));
    return { error: "WhatsApp number or PIN is wrong." };
  }
  await startMemberSession(member.id);
  redirect(safeNext(str(fd, "next")));
}

export async function logOut() {
  await endMemberSession();
  redirect("/");
}

function readPaymentFields(fd: FormData) {
  const method = str(fd, "method") as PaymentMethod;
  const reference = str(fd, "reference").slice(0, 80);
  const screenshot = str(fd, "screenshot");
  if (!PAYMENT_METHODS.includes(method)) return { error: "How did you pay?" } as const;
  if (!/^data:image\/(jpeg|png|webp);base64,/.test(screenshot))
    return { error: "Please attach a screenshot of your payment." } as const;
  if (screenshot.length > MAX_SCREENSHOT) return { error: "That screenshot is too large. Try a smaller one." } as const;
  return { method, reference, screenshot } as const;
}

async function insertPayment(values: Omit<typeof schema.payments.$inferInsert, "receiptNo">) {
  const [p] = await db
    .insert(schema.payments)
    .values({ ...values, receiptNo: "pending" })
    .returning({ id: schema.payments.id });
  await db
    .update(schema.payments)
    .set({ receiptNo: receiptNo(p.id) })
    .where(eq(schema.payments.id, p.id));
  return p.id;
}

export async function submitMembershipPayment(_: FormState, fd: FormData): Promise<FormState> {
  const member = await getCurrentMember();
  if (!member) return { error: "Please log in again." };

  const pending = await db.query.payments.findFirst({
    where: and(
      eq(schema.payments.memberId, member.id),
      eq(schema.payments.purpose, "membership"),
      eq(schema.payments.status, "pending"),
    ),
  });
  if (pending) return { error: "We already have a membership payment from you that's being checked." };

  const fee = await db.query.feeStructures.findFirst({ where: eq(schema.feeStructures.id, int(fd, "feeId") ?? 0) });
  if (!fee || fee.appliesTo !== "membership" || !isFeeLive(fee) || !matchesAudience(fee, member))
    return { error: "Please pick one of the plans shown." };

  const fields = readPaymentFields(fd);
  if ("error" in fields) return fields;

  const discount = await checkDiscount(str(fd, "discountCode"), fee.id, currentPrice(fee).amount);
  if (!discount.ok) return { error: discount.error };

  await insertPayment({
    memberId: member.id,
    purpose: "membership",
    feeStructureId: fee.id,
    feeName: fee.name,
    amount: discount.amount,
    discountCode: discount.code,
    ...fields,
  });
  await db.update(schema.members).set({ planId: fee.id }).where(eq(schema.members.id, member.id));
  redirect("/confirm/payment?for=membership");
}

export async function bookEvent(_: FormState, fd: FormData): Promise<FormState> {
  const member = await requireMember();
  const event = await db.query.events.findFirst({ where: eq(schema.events.id, int(fd, "eventId") ?? 0) });
  if (!event || !["open", "full"].includes(event.status) || event.startsAt < new Date())
    return { error: "Bookings for this event are closed." };
  if (member.status !== "active") return { error: "You need an active membership to book a seat." };

  const existing = await db.query.bookings.findFirst({
    where: and(
      eq(schema.bookings.memberId, member.id),
      eq(schema.bookings.eventId, event.id),
      inArray(schema.bookings.status, ["requested", "confirmed", "waitlisted", "attended"]),
    ),
  });
  if (existing) redirect(`/events/${event.slug}`);

  const fee = await eventFeeFor(event.id, member);
  if (!fee) return { error: "There's no price set for you on this event yet. Message us on WhatsApp." };
  const discount = await checkDiscount(str(fd, "discountCode"), fee.id, currentPrice(fee).amount);
  if (!discount.ok) return { error: discount.error };

  const full = (await seatsTaken(event.id)) >= event.seatLimit || event.status === "full";
  const free = discount.amount === 0;
  await db.insert(schema.bookings).values({
    memberId: member.id,
    eventId: event.id,
    status: full ? "waitlisted" : free ? "confirmed" : "requested",
    feeStructureId: fee.id,
    feeName: fee.name,
    feeCharged: discount.amount,
    depositAmount: fee.depositAmount && fee.depositAmount < discount.amount ? fee.depositAmount : null,
    discountCode: discount.code,
    feedbackToken: randomToken(),
  });
  if (full) redirect(`/confirm/waitlist?event=${event.slug}`);
  if (free) redirect(`/confirm/booking?event=${event.slug}`);
  redirect(`/events/${event.slug}?booked=1#pay`);
}

export async function submitEventPayment(_: FormState, fd: FormData): Promise<FormState> {
  const member = await getCurrentMember();
  if (!member) return { error: "Please log in again." };
  const booking = await db.query.bookings.findFirst({
    where: and(eq(schema.bookings.id, int(fd, "bookingId") ?? 0), eq(schema.bookings.memberId, member.id)),
  });
  if (!booking || !["requested", "confirmed"].includes(booking.status)) return { error: "This booking can't take a payment." };

  const pending = await db.query.payments.findFirst({
    where: and(eq(schema.payments.bookingId, booking.id), eq(schema.payments.status, "pending")),
  });
  if (pending) return { error: "We're already checking a payment for this booking." };

  const balance = booking.feeCharged - booking.amountPaid;
  if (balance <= 0) return { error: "This booking is already paid in full." };

  const payDeposit = str(fd, "amountChoice") === "deposit" && booking.amountPaid === 0 && booking.depositAmount;
  const amount = payDeposit ? booking.depositAmount! : balance;

  const fields = readPaymentFields(fd);
  if ("error" in fields) return fields;

  await insertPayment({
    memberId: member.id,
    bookingId: booking.id,
    purpose: booking.amountPaid > 0 ? "event_balance" : "event",
    feeStructureId: booking.feeStructureId,
    feeName: booking.feeName,
    amount,
    discountCode: booking.discountCode,
    ...fields,
  });
  redirect("/confirm/payment?for=event");
}

export async function cancelBooking(fd: FormData) {
  const member = await requireMember();
  const booking = await db.query.bookings.findFirst({
    where: and(eq(schema.bookings.id, int(fd, "bookingId") ?? 0), eq(schema.bookings.memberId, member.id)),
  });
  // Paid seats are cancelled by the team (refund policy); members can drop unpaid requests or waitlist spots.
  if (booking && booking.amountPaid === 0 && ["requested", "waitlisted"].includes(booking.status)) {
    await db.update(schema.bookings).set({ status: "cancelled" }).where(eq(schema.bookings.id, booking.id));
  }
  redirect("/account");
}

export async function submitFeedback(_: FormState, fd: FormData): Promise<FormState> {
  const booking = await db.query.bookings.findFirst({
    where: eq(schema.bookings.feedbackToken, str(fd, "token")),
  });
  if (!booking) return { error: "This feedback link isn't valid." };
  const done = await db.query.feedback.findFirst({ where: eq(schema.feedback.bookingId, booking.id) });
  if (done) return { ok: "You've already shared feedback. Shukriya!" };

  const rating = int(fd, "rating");
  if (!rating || rating < 1 || rating > 5) return { error: "Tap a rating from 1 to 5." };
  await db.insert(schema.feedback).values({ bookingId: booking.id, rating, comment: str(fd, "comment").slice(0, 2000) });

  const quote = str(fd, "testimonial").slice(0, 400);
  if (quote) {
    const member = await db.query.members.findFirst({ where: eq(schema.members.id, booking.memberId) });
    if (member) {
      await db.insert(schema.testimonials).values({
        memberId: member.id,
        name: `${member.name.split(" ")[0]}, ${member.age}`,
        label: `${label(member.memberType)}, ${member.city}`,
        quote,
        approved: false,
        showOnSite: false,
      });
    }
  }
  return { ok: "Shukriya! Your feedback reached the team." };
}


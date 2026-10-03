import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { and, desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { BrandIcon } from "@/components/brand";
import { BookForm, EventPaymentForm } from "@/components/site-forms";
import { StatusBadge } from "@/components/status";
import { getCurrentMember } from "@/lib/auth";
import { seatsTaken } from "@/lib/domain";
import { currentPrice, eventFeeFor } from "@/lib/fees";
import { formatDate, formatDay, formatTime, label, rs } from "@/lib/format";
import { getSettings } from "@/lib/settings";

async function load(slug: string) {
  const event = await db.query.events.findFirst({ where: eq(schema.events.slug, slug) });
  if (!event || event.status === "draft") return null;
  return event;
}

export async function generateMetadata({ params }: PageProps<"/events/[slug]">): Promise<Metadata> {
  const event = await load((await params).slug);
  return { title: event?.title ?? "Event" };
}

export default async function EventDetail({ params }: PageProps<"/events/[slug]">) {
  const { slug } = await params;
  const event = await load(slug);
  if (!event) notFound();

  const member = await getCurrentMember();
  const [taken, fee, settings] = await Promise.all([seatsTaken(event.id), eventFeeFor(event.id, member), getSettings()]);
  const seatsLeft = Math.max(0, event.seatLimit - taken);
  const price = fee ? currentPrice(fee) : null;
  const bookable = ["open", "full"].includes(event.status) && event.startsAt > new Date();

  const booking = member
    ? await db.query.bookings.findFirst({
        where: and(eq(schema.bookings.memberId, member.id), eq(schema.bookings.eventId, event.id)),
        orderBy: desc(schema.bookings.createdAt),
      })
    : null;
  const pendingPayment = booking
    ? await db.query.payments.findFirst({
        where: and(eq(schema.payments.bookingId, booking.id), eq(schema.payments.status, "pending")),
        columns: { id: true, amount: true },
      })
    : null;
  const accounts = { easypaisa: settings.easypaisa, jazzcash: settings.jazzcash, bank: settings.bank };

  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 lg:grid-cols-[1.4fr_1fr]">
      <div>
        <Link href="/events" className="text-sm font-bold text-muted-dark hover:text-amber">
          ← All events
        </Link>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-mint px-3 py-1 text-xs font-bold text-ink">{label(event.type)}</span>
          {event.status !== "open" && <StatusBadge status={event.status} />}
        </div>
        <h1 className="mt-4 font-display text-4xl leading-tight sm:text-5xl">{event.title}</h1>
        <dl className="mt-6 grid gap-4 sm:grid-cols-2">
          <Fact icon="compass" title="When">
            {formatDay(event.startsAt)}
            <br />
            {formatTime(event.startsAt)}
            {event.endsAt && ` to ${event.type === "retreat" ? formatDate(event.endsAt) : formatTime(event.endsAt)}`}
          </Fact>
          <Fact icon="peak" title="Where">
            {event.place}
            <br />
            {event.city}
          </Fact>
          <Fact icon="seat" title="Seats">
            {seatsLeft > 0 ? `${seatsLeft} of ${event.seatLimit} left` : "Full. Waitlist open."}
          </Fact>
          <Fact icon="chai" title="Fee">
            {price ? (
              <>
                {price.amount === 0 ? "Free" : rs(price.amount)}
                {price.earlyBird && fee && <span className="text-muted-dark line-through"> {rs(fee.amount)}</span>}
                {price.earlyBird && fee?.earlyBirdUntil && (
                  <span className="block text-sm text-mint">Early bird until {formatDate(fee.earlyBirdUntil)}</span>
                )}
                {fee?.depositAmount && <span className="block text-sm text-muted-dark">Deposit {rs(fee.depositAmount)} holds your seat</span>}
              </>
            ) : (
              "To be announced"
            )}
          </Fact>
        </dl>
        {event.description && <p className="mt-8 whitespace-pre-line text-lg text-muted-dark">{event.description}</p>}
      </div>

      <aside id="pay" className="scroll-mt-24 self-start rounded-3xl border-2 border-ink-line bg-ink-card p-6 lg:sticky lg:top-24">
        {!bookable && !booking ? (
          <p className="font-display text-xl">Bookings are closed for this one.</p>
        ) : !member ? (
          <>
            <p className="font-display text-2xl">Reserve a seat</p>
            <p className="mt-2 text-muted-dark">You need to be a member to book. Takes two minutes.</p>
            <div className="mt-5 flex flex-col gap-3">
              <Link href="/join" className="btn btn-amber btn-lg">
                Join Aao Baithein
              </Link>
              <Link href={`/account/login?next=/events/${event.slug}`} className="btn btn-outline text-cream">
                I&apos;m already a member
              </Link>
            </div>
          </>
        ) : booking && booking.status !== "cancelled" ? (
          <BookingState
            booking={booking}
            pendingAmount={pendingPayment?.amount ?? null}
            accounts={accounts}
          />
        ) : member.status !== "active" ? (
          <>
            <p className="font-display text-2xl">Membership first</p>
            <p className="mt-2 text-muted-dark">
              {member.status === "pending"
                ? "Your membership isn't active yet. Once your payment is approved you can book."
                : "Your membership has expired. Renew it to book this seat."}
            </p>
            <Link href={member.status === "pending" ? "/account" : "/join/pay"} className="btn btn-amber mt-5">
              {member.status === "pending" ? "Check my status" : "Renew membership"}
            </Link>
          </>
        ) : !fee ? (
          <p className="text-muted-dark">The fee for this event isn&apos;t set yet. Check back soon.</p>
        ) : (
          <>
            <p className="font-display text-2xl">{seatsLeft > 0 ? "Reserve a seat" : "Join the waitlist"}</p>
            <p className="mt-2 text-sm text-muted-dark">
              {fee.name}: {price && price.amount > 0 ? rs(price.amount) : "Free"}
            </p>
            <div className="mt-5">
              <BookForm eventId={event.id} label={seatsLeft > 0 ? "Reserve a seat" : "Join the waitlist"} />
            </div>
          </>
        )}
      </aside>
    </div>
  );
}

function Fact({ icon, title, children }: { icon: "compass" | "peak" | "seat" | "chai"; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 rounded-2xl border-2 border-ink-line p-4">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-pink text-cream">
        <BrandIcon name={icon} className="h-6 w-6" />
      </span>
      <div>
        <dt className="text-xs font-bold text-mint">{title}</dt>
        <dd className="mt-0.5 font-semibold">{children}</dd>
      </div>
    </div>
  );
}

function BookingState({
  booking,
  pendingAmount,
  accounts,
}: {
  booking: typeof schema.bookings.$inferSelect;
  pendingAmount: number | null;
  accounts: { easypaisa: string; jazzcash: string; bank: string };
}) {
  const balance = booking.feeCharged - booking.amountPaid;
  const head = (
    <div className="mb-4 flex items-center justify-between gap-3">
      <p className="font-display text-2xl">Your booking</p>
      <StatusBadge status={booking.status} />
    </div>
  );

  if (booking.status === "waitlisted")
    return (
      <>
        {head}
        <p className="text-muted-dark">You&apos;re on the waitlist. We&apos;ll message you on WhatsApp as soon as a seat opens.</p>
      </>
    );
  if (booking.status === "attended")
    return (
      <>
        {head}
        <p className="text-muted-dark">Shukriya for coming!</p>
      </>
    );
  if (pendingAmount != null)
    return (
      <>
        {head}
        <p className="text-muted-dark">
          We&apos;re checking your payment of {rs(pendingAmount)}. You&apos;ll get a WhatsApp message when it&apos;s confirmed.
        </p>
      </>
    );
  if (balance > 0)
    return (
      <>
        {head}
        {booking.status === "confirmed" && (
          <p className="mb-4 text-muted-dark">
            Your seat is held. {rs(balance)} balance is still due before the event.
          </p>
        )}
        <EventPaymentForm
          bookingId={booking.id}
          balance={balance}
          deposit={booking.amountPaid === 0 ? booking.depositAmount : null}
          accounts={accounts}
        />
      </>
    );
  return (
    <>
      {head}
      <p className="text-muted-dark">Your seat is confirmed. See you there! A reminder will come on WhatsApp a day before.</p>
    </>
  );
}

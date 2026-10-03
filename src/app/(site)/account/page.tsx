import type { Metadata } from "next";
import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { StatusBadge } from "@/components/status";
import { requireMember } from "@/lib/auth";
import { daysUntil, displayWhatsapp, formatDate, formatDateTime, label, rs } from "@/lib/format";
import { getSettings } from "@/lib/settings";
import { cancelBooking, logOut } from "../actions";

export const metadata: Metadata = { title: "My account" };

export default async function AccountPage() {
  const member = await requireMember();
  const [bookings, payments, settings] = await Promise.all([
    db
      .select({ booking: schema.bookings, event: schema.events })
      .from(schema.bookings)
      .innerJoin(schema.events, eq(schema.bookings.eventId, schema.events.id))
      .where(eq(schema.bookings.memberId, member.id))
      .orderBy(desc(schema.events.startsAt)),
    db.query.payments.findMany({
      where: eq(schema.payments.memberId, member.id),
      orderBy: desc(schema.payments.createdAt),
      columns: { screenshot: false },
    }),
    getSettings(),
  ]);
  const pendingMembershipPayment = payments.some((p) => p.purpose === "membership" && p.status === "pending");
  const lastRejected = payments.find((p) => p.purpose === "membership" && p.status === "rejected");

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl">
            Salam, <span className="text-pink">{member.name.split(" ")[0]}.</span>
          </h1>
          <p className="mt-1 text-sm text-muted-dark">
            {displayWhatsapp(member.whatsapp)} · {member.city} · {label(member.memberType)}
          </p>
        </div>
        <form action={logOut}>
          <button className="btn btn-outline btn-sm text-cream">Log out</button>
        </form>
      </div>

      {/* Membership */}
      <section className="mt-8 rounded-3xl border-2 border-ink-line bg-ink-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-2xl">Membership</h2>
          <StatusBadge status={member.status} />
        </div>
        {member.status === "active" && (
          <>
            <p className="mt-3 text-muted-dark">
              {member.expiresAt ? `Active until ${formatDate(member.expiresAt)}.` : "Active. No expiry."}
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              {settings.community_link && (
                <a href={settings.community_link} className="btn btn-amber" target="_blank" rel="noreferrer">
                  Open the WhatsApp community
                </a>
              )}
              <Link href="/events" className="btn btn-outline text-cream">
                Book a baithak
              </Link>
              {member.expiresAt && daysUntil(member.expiresAt) < 30 && (
                <Link href="/join/pay" className="btn btn-outline text-cream">
                  Renew early
                </Link>
              )}
            </div>
          </>
        )}
        {member.status === "pending" &&
          (pendingMembershipPayment ? (
            <p className="mt-3 text-muted-dark">
              We&apos;ve got your payment and are checking it. You&apos;ll get a WhatsApp message once you&apos;re in.
            </p>
          ) : (
            <>
              {lastRejected && (
                <p className="form-error mt-3">
                  Your last payment couldn&apos;t be verified{lastRejected.rejectReason ? `: ${lastRejected.rejectReason}` : "."}
                </p>
              )}
              <p className="mt-3 text-muted-dark">Pay the membership fee to get the community link and book seats.</p>
              <Link href="/join/pay" className="btn btn-amber mt-4">
                Pay membership fee
              </Link>
            </>
          ))}
        {member.status === "expired" && (
          <>
            <p className="mt-3 text-muted-dark">
              Your membership ended on {formatDate(member.expiresAt)}. Renew to keep booking seats.
            </p>
            {pendingMembershipPayment ? (
              <p className="mt-3 font-semibold text-mint">Your renewal payment is being checked.</p>
            ) : (
              <Link href="/join/pay" className="btn btn-amber mt-4">
                Renew membership
              </Link>
            )}
          </>
        )}
      </section>

      {/* Bookings */}
      <section className="mt-6 rounded-3xl border-2 border-ink-line bg-ink-card p-6">
        <h2 className="font-display text-2xl">My bookings</h2>
        {bookings.length === 0 ? (
          <p className="mt-3 text-muted-dark">
            No bookings yet.{" "}
            <Link href="/events" className="font-bold text-amber hover:underline">
              See upcoming events
            </Link>
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-ink-line">
            {bookings.map(({ booking: b, event: e }) => {
              const balance = b.feeCharged - b.amountPaid;
              return (
                <li key={b.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
                  <div>
                    <Link href={`/events/${e.slug}`} className="font-bold hover:text-amber">
                      {e.title}
                    </Link>
                    <p className="text-sm text-muted-dark">
                      {formatDateTime(e.startsAt)} · {e.place}
                    </p>
                    <p className="text-sm text-muted-dark">
                      {rs(b.feeCharged)} · paid {rs(b.amountPaid)}
                      {balance > 0 && b.status !== "cancelled" ? ` · ${rs(balance)} due` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={b.status} />
                    {b.status === "requested" && balance > 0 && (
                      <Link href={`/events/${e.slug}#pay`} className="btn btn-amber btn-sm">
                        Pay
                      </Link>
                    )}
                    {b.amountPaid === 0 && ["requested", "waitlisted"].includes(b.status) && (
                      <form action={cancelBooking}>
                        <input type="hidden" name="bookingId" value={b.id} />
                        <button className="btn btn-ghost btn-sm text-muted-dark">Cancel</button>
                      </form>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Payments */}
      <section className="mt-6 rounded-3xl border-2 border-ink-line bg-ink-card p-6">
        <h2 className="font-display text-2xl">Payment history</h2>
        {payments.length === 0 ? (
          <p className="mt-3 text-muted-dark">No payments yet.</p>
        ) : (
          <ul className="mt-4 divide-y divide-ink-line">
            {payments.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                <div>
                  <p className="font-bold">
                    {label(p.purpose)} · {p.feeName}
                  </p>
                  <p className="text-muted-dark">
                    {formatDate(p.createdAt)} · {label(p.method)} · Receipt {p.receiptNo}
                  </p>
                  {p.status === "rejected" && p.rejectReason && <p className="text-pink">{p.rejectReason}</p>}
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-display">{rs(p.amount)}</span>
                  <StatusBadge status={p.status} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

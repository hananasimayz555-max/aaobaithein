import Link from "next/link";
import { and, asc, count, desc, eq, gt, gte, inArray, isNull, lt } from "drizzle-orm";
import { db, schema } from "@/db";
import { Empty, PageHeader, Stat, sp } from "@/components/admin-ui";
import { StatusBadge } from "@/components/status";
import { requireAdmin, canAccess } from "@/lib/auth";
import { refreshExpiries, seatCounts } from "@/lib/domain";
import { formatDateTime, label } from "@/lib/format";

export default async function Dashboard({ searchParams }: PageProps<"/admin">) {
  const admin = await requireAdmin("dashboard");
  const denied = sp((await searchParams).denied);
  await refreshExpiries();
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 864e5);
  const in36h = new Date(now.getTime() + 36 * 3600e3);

  const [[signups], [pendingPay], [active], [pendingMembers], upcoming, seats, recent, [due]] = await Promise.all([
    db.select({ n: count() }).from(schema.members).where(gte(schema.members.createdAt, weekAgo)),
    db.select({ n: count() }).from(schema.payments).where(eq(schema.payments.status, "pending")),
    db.select({ n: count() }).from(schema.members).where(eq(schema.members.status, "active")),
    db.select({ n: count() }).from(schema.members).where(eq(schema.members.status, "pending")),
    db.query.events.findMany({
      where: and(inArray(schema.events.status, ["open", "full", "draft"]), gt(schema.events.startsAt, now)),
      orderBy: asc(schema.events.startsAt),
      limit: 5,
    }),
    seatCounts(),
    db.query.members.findMany({ orderBy: desc(schema.members.createdAt), limit: 6, columns: { pinHash: false } }),
    db
      .select({ n: count() })
      .from(schema.bookings)
      .innerJoin(schema.events, eq(schema.events.id, schema.bookings.eventId))
      .where(
        and(
          eq(schema.bookings.status, "confirmed"),
          isNull(schema.bookings.reminderSentAt),
          gt(schema.events.startsAt, now),
          lt(schema.events.startsAt, in36h),
        ),
      ),
  ]);
  const isAdmin = admin.role === "admin";

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title={`Salam, ${admin.name.split(" ")[0]}`} subtitle="Here's what needs you today." />
      {denied && <p className="form-error mb-4">That section is for admins only.</p>}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Payments to review" value={pendingPay?.n ?? 0} tone={pendingPay?.n ? "amber" : "white"} href="/admin/payments" />
        <Stat label="New sign-ups (7 days)" value={signups?.n ?? 0} href={isAdmin ? "/admin/members?sort=new" : undefined} />
        <Stat label="Active members" value={active?.n ?? 0} tone="mint" href={isAdmin ? "/admin/members?status=active" : undefined} />
        <Stat label="Signed up, not paid" value={pendingMembers?.n ?? 0} href={isAdmin ? "/admin/members?status=pending" : undefined} />
      </div>

      {!!due?.n && canAccess(admin.role, "messaging") && (
        <Link href="/admin/messaging" className="mt-4 flex items-center justify-between rounded-2xl bg-ink p-4 text-cream">
          <span className="font-semibold">{due.n} reminder{due.n > 1 ? "s" : ""} due for events in the next 36 hours</span>
          <span className="btn btn-amber btn-sm">Send reminders</span>
        </Link>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className="panel">
          <div className="flex items-center justify-between border-b border-cream-line p-4">
            <h2 className="font-display text-lg">Upcoming events</h2>
            {isAdmin && (
              <Link href="/admin/events/new" className="btn btn-amber btn-sm">
                New event
              </Link>
            )}
          </div>
          {upcoming.length === 0 ? (
            <Empty>No upcoming events. Create the next baithak.</Empty>
          ) : (
            <ul className="divide-y divide-cream-line">
              {upcoming.map((e) => {
                const taken = seats.get(e.id) ?? 0;
                const pct = Math.min(100, Math.round((taken / e.seatLimit) * 100));
                return (
                  <li key={e.id} className="p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Link href={isAdmin ? `/admin/events/${e.id}` : `/admin/bookings?event=${e.id}`} className="font-bold hover:underline">
                        {e.title}
                      </Link>
                      <StatusBadge status={e.status} />
                    </div>
                    <p className="text-sm text-muted-light">
                      {label(e.type)} · {formatDateTime(e.startsAt)} · {e.city}
                    </p>
                    <div className="mt-2 flex items-center gap-3">
                      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-cream" role="img" aria-label={`${taken} of ${e.seatLimit} seats filled`}>
                        <div className="h-full rounded-full bg-mint" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="w-24 text-right text-sm font-semibold">
                        {taken}/{e.seatLimit} seats
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="panel">
          <div className="border-b border-cream-line p-4">
            <h2 className="font-display text-lg">Latest sign-ups</h2>
          </div>
          {recent.length === 0 ? (
            <Empty>No sign-ups yet.</Empty>
          ) : (
            <ul className="divide-y divide-cream-line">
              {recent.map((m) => (
                <li key={m.id} className="flex items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    {isAdmin ? (
                      <Link href={`/admin/members/${m.id}`} className="font-bold hover:underline">
                        {m.name}
                      </Link>
                    ) : (
                      <p className="font-bold">{m.name}</p>
                    )}
                    <p className="truncate text-sm text-muted-light">
                      {label(m.memberType)} · {m.city} · {formatDateTime(m.createdAt)}
                    </p>
                  </div>
                  <StatusBadge status={m.status} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

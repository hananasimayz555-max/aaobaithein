import type { Metadata } from "next";
import Link from "next/link";
import { and, asc, desc, eq, gte, like, or, type SQL } from "drizzle-orm";
import { db, schema } from "@/db";
import { BOOKING_STATUSES, type BookingStatus } from "@/db/schema";
import { Empty, FilterPills, PageHeader, sp } from "@/components/admin-ui";
import { BookingActions } from "@/components/booking-actions";
import { StatusBadge } from "@/components/status";
import { requireAdmin } from "@/lib/auth";
import { displayWhatsapp, formatDateTime, rs } from "@/lib/format";

export const metadata: Metadata = { title: "Bookings" };

export default async function BookingsPage({ searchParams }: PageProps<"/admin/bookings">) {
  const admin = await requireAdmin("bookings");
  const q = await searchParams;
  const now = new Date();
  const events = await db.query.events.findMany({ orderBy: desc(schema.events.startsAt), limit: 60 });
  const nextEvent = [...events].reverse().find((e) => e.startsAt.getTime() > now.getTime() - 12 * 3600e3);
  const eventParam = sp(q.event);
  const eventId = eventParam === "all" ? null : Number(eventParam) || nextEvent?.id || null;
  const status = (BOOKING_STATUSES as readonly string[]).includes(sp(q.status)) ? (sp(q.status) as BookingStatus) : null;
  const search = sp(q.q);

  const where: SQL[] = [];
  if (eventId) where.push(eq(schema.bookings.eventId, eventId));
  else where.push(gte(schema.events.startsAt, new Date(now.getTime() - 30 * 864e5)));
  if (status) where.push(eq(schema.bookings.status, status));
  if (search) where.push(or(like(schema.members.name, `%${search}%`), like(schema.members.whatsapp, `%${search.replace(/\D/g, "").replace(/^0/, "")}%`))!);

  const rows = await db
    .select({
      b: schema.bookings,
      m: { id: schema.members.id, name: schema.members.name, whatsapp: schema.members.whatsapp },
      e: { id: schema.events.id, title: schema.events.title, startsAt: schema.events.startsAt },
    })
    .from(schema.bookings)
    .innerJoin(schema.members, eq(schema.members.id, schema.bookings.memberId))
    .innerJoin(schema.events, eq(schema.events.id, schema.bookings.eventId))
    .where(and(...where))
    .orderBy(asc(schema.events.startsAt), asc(schema.members.name));

  const keep = { event: eventParam || undefined, q: search || undefined };
  const backQs = new URLSearchParams(Object.entries({ ...keep, status: status ?? undefined }).filter((e): e is [string, string] => !!e[1]));
  const back = `/admin/bookings${backQs.size ? `?${backQs}` : ""}`;
  const selected = events.find((e) => e.id === eventId);

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Bookings"
        subtitle={selected ? `${selected.title} · ${formatDateTime(selected.startsAt)}` : "All events in the last 30 days and upcoming"}
        actions={
          selected && admin.role === "admin" ? (
            <Link href={`/admin/events/${selected.id}`} className="btn btn-outline btn-sm">
              Event page
            </Link>
          ) : undefined
        }
      />
      <form className="mb-3 flex flex-wrap gap-2">
        <select name="event" defaultValue={eventId ? String(eventId) : "all"} className="input w-auto max-w-full">
          <option value="all">All recent and upcoming events</option>
          {events.map((e) => (
            <option key={e.id} value={e.id}>
              {formatDateTime(e.startsAt)} · {e.title}
            </option>
          ))}
        </select>
        <input name="q" defaultValue={search} placeholder="Find a name or number" className="input sm:w-56" />
        {status && <input type="hidden" name="status" value={status} />}
        <button className="btn btn-dark btn-sm">Show</button>
      </form>
      <div className="mb-4">
        <FilterPills
          base="/admin/bookings"
          param="status"
          value={status ?? ""}
          keep={keep}
          options={[{ value: "", label: "All" }, ...BOOKING_STATUSES.map((s) => ({ value: s, label: s[0].toUpperCase() + s.slice(1) }))]}
        />
      </div>

      {sp(q.error) === "full" && <p className="form-error mb-4">That event is full. Free a seat or raise the limit first.</p>}

      <div className="panel overflow-x-auto">
        {rows.length === 0 ? (
          <Empty>No bookings found.</Empty>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Member</th>
                {!eventId && <th>Event</th>}
                <th>Status</th>
                <th>Paid</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ b, m, e }) => (
                <tr key={b.id}>
                  <td>
                    <span className="font-bold">{m.name}</span>
                    <span className="block text-xs text-muted-light">{displayWhatsapp(m.whatsapp)}</span>
                  </td>
                  {!eventId && (
                    <td className="text-sm">
                      {e.title}
                      <span className="block text-xs text-muted-light">{formatDateTime(e.startsAt)}</span>
                    </td>
                  )}
                  <td>
                    <StatusBadge status={b.status} />
                  </td>
                  <td className="whitespace-nowrap">
                    {rs(b.amountPaid)} <span className="text-muted-light">/ {rs(b.feeCharged)}</span>
                  </td>
                  <td>
                    <BookingActions id={b.id} status={b.status} back={back} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

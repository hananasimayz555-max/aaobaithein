import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, eq, inArray } from "drizzle-orm";
import { db, schema } from "@/db";
import type { BookingStatus, TemplatePurpose } from "@/db/schema";
import { Empty, FilterPills, PageHeader, Stat, sp } from "@/components/admin-ui";
import { BookingActions } from "@/components/booking-actions";
import { StatusBadge } from "@/components/status";
import { requireAdmin } from "@/lib/auth";
import { displayWhatsapp, formatDateTime, label, rs } from "@/lib/format";
import { renderTemplate, varsFor, waLink } from "@/lib/messages";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = { title: "Event" };

const MESSAGE_FOR: Partial<Record<BookingStatus, TemplatePurpose>> = {
  confirmed: "booking_confirmed",
  waitlisted: "waitlisted",
  attended: "feedback",
};

export default async function EventDetailAdmin({ params, searchParams }: PageProps<"/admin/events/[id]">) {
  await requireAdmin("events");
  const id = Number((await params).id);
  const q = await searchParams;
  const filter = sp(q.status);
  const event = await db.query.events.findFirst({ where: eq(schema.events.id, id) });
  if (!event) notFound();

  const [rows, fees, templates, settings] = await Promise.all([
    db
      .select({ b: schema.bookings, m: { id: schema.members.id, name: schema.members.name, whatsapp: schema.members.whatsapp, city: schema.members.city } })
      .from(schema.bookings)
      .innerJoin(schema.members, eq(schema.members.id, schema.bookings.memberId))
      .where(eq(schema.bookings.eventId, id))
      .orderBy(asc(schema.bookings.createdAt)),
    db
      .select({ f: schema.feeStructures })
      .from(schema.eventFees)
      .innerJoin(schema.feeStructures, eq(schema.feeStructures.id, schema.eventFees.feeStructureId))
      .where(eq(schema.eventFees.eventId, id)),
    db.query.messageTemplates.findMany({ where: inArray(schema.messageTemplates.purpose, ["booking_confirmed", "waitlisted", "feedback", "reminder"]) }),
    getSettings(),
  ]);
  const by = (s: BookingStatus) => rows.filter((r) => r.b.status === s).length;
  const seatsTaken = by("confirmed") + by("attended");
  const collected = rows.reduce((a, r) => a + r.b.amountPaid, 0);
  const shown = filter ? rows.filter((r) => r.b.status === filter) : rows.filter((r) => r.b.status !== "cancelled");
  const back = `/admin/events/${id}${filter ? `?status=${filter}` : ""}`;
  const isPast = event.startsAt < new Date();

  const messageFor = (status: BookingStatus, m: { name: string; whatsapp: string }, token: string) => {
    const purpose = status === "confirmed" && !isPast ? "booking_confirmed" : MESSAGE_FOR[status];
    const t = templates.find((x) => x.purpose === purpose);
    if (!t) return null;
    const link = purpose === "feedback" ? `${settings.site_url}/feedback/${token}` : `${settings.site_url}/account`;
    return { name: t.name, href: waLink(m.whatsapp, renderTemplate(t.body, varsFor(m, { event, link }))) };
  };

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        back={{ href: "/admin/events", label: "Events" }}
        title={event.title}
        subtitle={`${label(event.type)} · ${formatDateTime(event.startsAt)} · ${event.place}, ${event.city}`}
        actions={
          <>
            <StatusBadge status={event.status} />
            {event.status !== "draft" && (
              <a href={`/events/${event.slug}`} target="_blank" className="btn btn-outline btn-sm">
                View on site
              </a>
            )}
            <Link href={`/admin/events/${id}/edit`} className="btn btn-amber btn-sm">
              Edit event
            </Link>
          </>
        }
      />
      {sp(q.saved) && <p className="form-ok mb-4">Event saved.</p>}
      {sp(q.error) === "full" && <p className="form-error mb-4">The event is full. Raise the seat limit or cancel a seat first.</p>}

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Seats filled" value={`${seatsTaken}/${event.seatLimit}`} tone="mint" />
        <Stat label="Waiting to pay or confirm" value={by("requested")} tone={by("requested") ? "amber" : "white"} />
        <Stat label="Waitlist" value={by("waitlisted")} />
        <Stat label="Collected" value={rs(collected)} hint={isPast ? `${by("attended")} attended` : undefined} />
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <FilterPills
          base={`/admin/events/${id}`}
          param="status"
          value={filter}
          options={[
            { value: "", label: "All active", count: rows.length - by("cancelled") },
            { value: "requested", label: "Requested", count: by("requested") },
            { value: "confirmed", label: "Confirmed", count: by("confirmed") },
            { value: "waitlisted", label: "Waitlist", count: by("waitlisted") },
            { value: "attended", label: "Attended", count: by("attended") },
            { value: "cancelled", label: "Cancelled", count: by("cancelled") },
          ]}
        />
        <p className="text-sm text-muted-light">Fees: {fees.length ? fees.map(({ f }) => `${f.name} (${rs(f.amount)})`).join(", ") : "none attached"}</p>
      </div>

      <div className="panel overflow-x-auto">
        {shown.length === 0 ? (
          <Empty>No bookings here yet.</Empty>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Member</th>
                <th>Status</th>
                <th>Paid</th>
                <th>Actions</th>
                <th className="hidden md:table-cell">Message</th>
              </tr>
            </thead>
            <tbody>
              {shown.map(({ b, m }) => {
                const msg = messageFor(b.status, m, b.feedbackToken);
                return (
                  <tr key={b.id}>
                    <td>
                      <Link href={`/admin/members/${m.id}`} className="font-bold hover:underline">
                        {m.name}
                      </Link>
                      <span className="block text-xs text-muted-light">
                        {displayWhatsapp(m.whatsapp)} · {m.city}
                      </span>
                    </td>
                    <td>
                      <StatusBadge status={b.status} />
                    </td>
                    <td className="whitespace-nowrap">
                      {rs(b.amountPaid)} <span className="text-muted-light">/ {rs(b.feeCharged)}</span>
                      {b.depositAmount && b.amountPaid < b.feeCharged && b.amountPaid > 0 && (
                        <span className="block text-xs font-semibold text-[#7a5400]">balance {rs(b.feeCharged - b.amountPaid)}</span>
                      )}
                    </td>
                    <td>
                      <BookingActions id={b.id} status={b.status} back={back} />
                    </td>
                    <td className="hidden md:table-cell">
                      {msg && (
                        <a href={msg.href} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm">
                          {msg.name}
                        </a>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

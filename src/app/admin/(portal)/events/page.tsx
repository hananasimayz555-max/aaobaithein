import type { Metadata } from "next";
import Link from "next/link";
import { asc, desc, gte, lt } from "drizzle-orm";
import { db, schema } from "@/db";
import { Empty, FilterPills, PageHeader, sp } from "@/components/admin-ui";
import { StatusBadge } from "@/components/status";
import { requireAdmin } from "@/lib/auth";
import { seatCounts } from "@/lib/domain";
import { formatDateTime, label } from "@/lib/format";

export const metadata: Metadata = { title: "Events" };

export default async function EventsAdmin({ searchParams }: PageProps<"/admin/events">) {
  await requireAdmin("events");
  const past = sp((await searchParams).when) === "past";
  const now = new Date();
  const [events, seats] = await Promise.all([
    db.query.events.findMany({
      where: past ? lt(schema.events.startsAt, now) : gte(schema.events.startsAt, now),
      orderBy: past ? desc(schema.events.startsAt) : asc(schema.events.startsAt),
    }),
    seatCounts(),
  ]);

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Events"
        subtitle="Baithaks and retreats"
        actions={
          <Link href="/admin/events/new" className="btn btn-amber btn-sm">
            New event
          </Link>
        }
      />
      <div className="mb-4">
        <FilterPills
          base="/admin/events"
          param="when"
          value={past ? "past" : ""}
          options={[
            { value: "", label: "Upcoming" },
            { value: "past", label: "Past" },
          ]}
        />
      </div>
      <div className="panel overflow-x-auto">
        {events.length === 0 ? (
          <Empty>{past ? "No past events yet." : "Nothing scheduled. Create the next baithak."}</Empty>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Event</th>
                <th>When</th>
                <th className="hidden sm:table-cell">Where</th>
                <th>Seats</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {events.map((e) => (
                <tr key={e.id}>
                  <td>
                    <Link href={`/admin/events/${e.id}`} className="font-bold hover:underline">
                      {e.title}
                    </Link>
                    <span className="block text-xs text-muted-light">{label(e.type)}{!e.showOnSite && " · hidden from site"}</span>
                  </td>
                  <td className="whitespace-nowrap">{formatDateTime(e.startsAt)}</td>
                  <td className="hidden sm:table-cell">
                    {e.place}, {e.city}
                  </td>
                  <td className="whitespace-nowrap font-semibold">
                    {seats.get(e.id) ?? 0}/{e.seatLimit}
                  </td>
                  <td>
                    <StatusBadge status={e.status} />
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

import type { Metadata } from "next";
import { and, count, desc, eq, gte, lt, sql, sum } from "drizzle-orm";
import { db, schema } from "@/db";
import { Empty, FilterPills, PageHeader, Stat, sp } from "@/components/admin-ui";
import { requireAdmin } from "@/lib/auth";
import { refreshExpiries } from "@/lib/domain";
import { daysFromNow, formatDate, label, rs } from "@/lib/format";

export const metadata: Metadata = { title: "Reports" };

const PERIODS = { "": null, "30": 30, "90": 90, "365": 365 } as const;

export default async function ReportsPage({ searchParams }: PageProps<"/admin/reports">) {
  await requireAdmin("reports");
  await refreshExpiries();
  const period = sp((await searchParams).period) as keyof typeof PERIODS;
  const days = PERIODS[period] ?? null;
  const since = days ? daysFromNow(-days) : new Date(0);

  const approvedSince = and(eq(schema.payments.status, "approved"), gte(schema.payments.reviewedAt, since));
  const [byCity, bySegment, byStatus, revenue, revenueByPurpose, byMonth, events] = await Promise.all([
    db.select({ key: schema.members.city, n: count() }).from(schema.members).where(gte(schema.members.createdAt, since)).groupBy(schema.members.city).orderBy(desc(count())),
    db.select({ key: schema.members.memberType, n: count() }).from(schema.members).where(gte(schema.members.createdAt, since)).groupBy(schema.members.memberType).orderBy(desc(count())),
    db.select({ key: schema.members.status, n: count() }).from(schema.members).groupBy(schema.members.status),
    db.select({ total: sum(schema.payments.amount), n: count() }).from(schema.payments).where(approvedSince).get(),
    db.select({ key: schema.payments.purpose, total: sum(schema.payments.amount) }).from(schema.payments).where(approvedSince).groupBy(schema.payments.purpose),
    db
      .select({ key: sql<string>`strftime('%Y-%m', ${schema.payments.reviewedAt}, 'unixepoch', '+5 hours')`, total: sum(schema.payments.amount) })
      .from(schema.payments)
      .where(approvedSince)
      .groupBy(sql`1`)
      .orderBy(sql`1`),
    db
      .select({
        id: schema.events.id,
        title: schema.events.title,
        type: schema.events.type,
        startsAt: schema.events.startsAt,
        seatLimit: schema.events.seatLimit,
        booked: sql<number>`sum(case when ${schema.bookings.status} in ('confirmed','attended') then 1 else 0 end)`,
        attended: sql<number>`sum(case when ${schema.bookings.status} = 'attended' then 1 else 0 end)`,
        revenue: sql<number>`coalesce(sum(${schema.bookings.amountPaid}), 0)`,
      })
      .from(schema.events)
      .leftJoin(schema.bookings, eq(schema.bookings.eventId, schema.events.id))
      .where(and(gte(schema.events.startsAt, since), lt(schema.events.startsAt, daysFromNow(365))))
      .groupBy(schema.events.id)
      .orderBy(desc(schema.events.startsAt)),
  ]);

  const statusN = (s: string) => byStatus.find((r) => r.key === s)?.n ?? 0;
  const pastEvents = events.filter((e) => e.startsAt < new Date());
  const pastBooked = pastEvents.reduce((a, e) => a + Number(e.booked ?? 0), 0);
  const pastAttended = pastEvents.reduce((a, e) => a + Number(e.attended ?? 0), 0);

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="Reports" subtitle={days ? `Last ${days} days` : "All time"} />
      <div className="mb-6">
        <FilterPills
          base="/admin/reports"
          param="period"
          value={period ?? ""}
          options={[
            { value: "", label: "All time" },
            { value: "30", label: "30 days" },
            { value: "90", label: "90 days" },
            { value: "365", label: "12 months" },
          ]}
        />
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Revenue approved" value={rs(Number(revenue?.total ?? 0))} hint={`${revenue?.n ?? 0} payments`} tone="mint" />
        <Stat label="Active members (now)" value={statusN("active")} hint={`${statusN("pending")} pending · ${statusN("expired")} expired`} />
        <Stat label="Events held" value={pastEvents.length} />
        <Stat label="Show-up rate" value={pastBooked ? `${Math.round((pastAttended / pastBooked) * 100)}%` : "—"} hint={`${pastAttended} of ${pastBooked} confirmed seats checked in`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <BarList title="New members by city" rows={byCity.map((r) => ({ key: r.key, value: r.n }))} />
        <BarList title="New members by segment" rows={bySegment.map((r) => ({ key: label(r.key), value: r.n }))} />
        <BarList title="Revenue by month" rows={byMonth.map((r) => ({ key: r.key, value: Number(r.total ?? 0) }))} money />
        <BarList title="Revenue by type" rows={revenueByPurpose.map((r) => ({ key: label(r.key), value: Number(r.total ?? 0) }))} money />
      </div>

      <section className="panel mt-6 overflow-x-auto">
        <h2 className="border-b border-cream-line p-4 font-display text-lg">Events: attendance and revenue</h2>
        {events.length === 0 ? (
          <Empty>No events in this period.</Empty>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Event</th>
                <th>Date</th>
                <th className="text-right">Seats filled</th>
                <th className="text-right">Attended</th>
                <th className="text-right">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {events.map((e) => (
                <tr key={e.id}>
                  <td>
                    <span className="font-semibold">{e.title}</span>
                    <span className="block text-xs text-muted-light">{label(e.type)}</span>
                  </td>
                  <td className="whitespace-nowrap">{formatDate(e.startsAt)}</td>
                  <td className="text-right tabular-nums">
                    {Number(e.booked ?? 0)}/{e.seatLimit}
                  </td>
                  <td className="text-right tabular-nums">{e.startsAt < new Date() ? Number(e.attended ?? 0) : "—"}</td>
                  <td className="text-right tabular-nums font-semibold">{rs(Number(e.revenue))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

/** Single-series horizontal bars: one hue, value labels in ink, native tooltip on hover. */
function BarList({ title, rows, money = false }: { title: string; rows: { key: string; value: number }[]; money?: boolean }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  const fmt = (v: number) => (money ? rs(v) : v.toLocaleString("en-PK"));
  return (
    <section className="panel">
      <h2 className="border-b border-cream-line p-4 font-display text-lg">{title}</h2>
      {rows.length === 0 ? (
        <Empty>No data yet.</Empty>
      ) : (
        <ul className="space-y-2.5 p-4">
          {rows.slice(0, 12).map((r) => (
            <li key={r.key} className="group grid grid-cols-[7rem_1fr_auto] items-center gap-3 text-sm" title={`${r.key}: ${fmt(r.value)}`}>
              <span className="truncate font-semibold">{r.key}</span>
              <span className="h-3 rounded-r bg-transparent">
                <span
                  className="block h-3 min-w-1 rounded-r-[4px] bg-mint transition-colors group-hover:bg-[#009c87]"
                  style={{ width: `${(r.value / max) * 100}%` }}
                />
              </span>
              <span className="tabular-nums text-muted-light">{fmt(r.value)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

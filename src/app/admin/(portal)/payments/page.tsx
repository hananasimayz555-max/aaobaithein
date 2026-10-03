import type { Metadata } from "next";
import Link from "next/link";
import { and, desc, eq, like, or, sql, sum, type SQL } from "drizzle-orm";
import { db, schema } from "@/db";
import { PAYMENT_STATUSES, type PaymentStatus } from "@/db/schema";
import { Empty, FilterPills, PageHeader, Stat, sp } from "@/components/admin-ui";
import { StatusBadge } from "@/components/status";
import { SubmitButton } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { paymentFollowUp } from "@/lib/followup";
import { displayWhatsapp, formatDateTime, label, rs } from "@/lib/format";
import { approvePayment, rejectPayment } from "../../_actions/payments";

export const metadata: Metadata = { title: "Payments" };

export default async function PaymentsPage({ searchParams }: PageProps<"/admin/payments">) {
  await requireAdmin("payments");
  const q = await searchParams;
  const status = (PAYMENT_STATUSES as readonly string[]).includes(sp(q.status)) ? (sp(q.status) as PaymentStatus) : sp(q.status) === "all" ? null : "pending";
  const search = sp(q.q);
  const done = Number(sp(q.done)) || null;

  const where: SQL[] = [];
  if (status) where.push(eq(schema.payments.status, status));
  if (search) where.push(or(like(schema.members.name, `%${search}%`), like(schema.members.whatsapp, `%${search.replace(/\D/g, "") || search}%`), like(schema.payments.receiptNo, `%${search}%`))!);

  const [rows, counts, totals, followUp] = await Promise.all([
    db
      .select({
        p: {
          id: schema.payments.id,
          receiptNo: schema.payments.receiptNo,
          purpose: schema.payments.purpose,
          feeName: schema.payments.feeName,
          amount: schema.payments.amount,
          method: schema.payments.method,
          reference: schema.payments.reference,
          discountCode: schema.payments.discountCode,
          status: schema.payments.status,
          rejectReason: schema.payments.rejectReason,
          reviewedBy: schema.payments.reviewedBy,
          reviewedAt: schema.payments.reviewedAt,
          createdAt: schema.payments.createdAt,
          hasScreenshot: sql<number>`${schema.payments.screenshot} is not null`,
        },
        m: { id: schema.members.id, name: schema.members.name, whatsapp: schema.members.whatsapp, city: schema.members.city, status: schema.members.status },
        eventTitle: schema.events.title,
      })
      .from(schema.payments)
      .innerJoin(schema.members, eq(schema.members.id, schema.payments.memberId))
      .leftJoin(schema.bookings, eq(schema.bookings.id, schema.payments.bookingId))
      .leftJoin(schema.events, eq(schema.events.id, schema.bookings.eventId))
      .where(where.length ? and(...where) : undefined)
      .orderBy(status === "pending" ? schema.payments.createdAt : desc(schema.payments.createdAt))
      .limit(100),
    db.select({ status: schema.payments.status, n: sql<number>`count(*)` }).from(schema.payments).groupBy(schema.payments.status),
    db
      .select({
        approved: sum(sql`case when ${schema.payments.status} = 'approved' then ${schema.payments.amount} else 0 end`),
        month: sum(sql`case when ${schema.payments.status} = 'approved' and ${schema.payments.reviewedAt} >= unixepoch('now', 'start of month') then ${schema.payments.amount} else 0 end`),
        pending: sum(sql`case when ${schema.payments.status} = 'pending' then ${schema.payments.amount} else 0 end`),
      })
      .from(schema.payments)
      .get(),
    done ? paymentFollowUp(done) : null,
  ]);
  const countOf = (s: string) => counts.find((c) => c.status === s)?.n ?? 0;
  const back = `/admin/payments${status !== "pending" ? `?status=${status ?? "all"}` : ""}`;

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="Payments" subtitle="Check the screenshot against your Easypaisa, JazzCash or bank app, then approve or reject." />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-3">
        <Stat label="Waiting for review" value={countOf("pending")} hint={rs(Number(totals?.pending ?? 0))} tone="amber" />
        <Stat label="Approved this month" value={rs(Number(totals?.month ?? 0))} tone="mint" />
        <Stat label="Approved all time" value={rs(Number(totals?.approved ?? 0))} />
      </div>

      {followUp && (
        <div className={`mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl p-4 ${followUp.payment.status === "approved" ? "bg-mint-tint" : "bg-pink-tint"}`}>
          <p className="text-sm font-semibold">
            {followUp.payment.status === "approved" ? "Approved" : "Rejected"} {rs(followUp.payment.amount)} from {followUp.member.name}.{" "}
            {followUp.href ? `Send the ${label(followUp.purpose).toLowerCase()} message:` : "No message template for this yet."}
          </p>
          {followUp.href && (
            <a href={followUp.href} target="_blank" rel="noreferrer" className="btn btn-dark btn-sm">
              Send on WhatsApp
            </a>
          )}
        </div>
      )}

      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <FilterPills
          base="/admin/payments"
          param="status"
          value={status ?? "all"}
          keep={{ q: search }}
          options={[
            { value: "pending", label: "Pending", count: countOf("pending") },
            { value: "approved", label: "Approved", count: countOf("approved") },
            { value: "rejected", label: "Rejected", count: countOf("rejected") },
            { value: "all", label: "All" },
          ]}
        />
        <form className="flex gap-2">
          {status !== "pending" && <input type="hidden" name="status" value={status ?? "all"} />}
          <input name="q" defaultValue={search} placeholder="Name, number or receipt" className="input md:w-64" />
          <button className="btn btn-dark btn-sm">Search</button>
        </form>
      </div>

      {rows.length === 0 ? (
        <div className="panel">
          <Empty>{status === "pending" ? "All caught up. No payments waiting. ☕" : "No payments match."}</Empty>
        </div>
      ) : (
        <ul className="grid gap-3 xl:grid-cols-2">
          {rows.map(({ p, m, eventTitle }) => (
            <li key={p.id} className="panel flex gap-4 p-4">
              {p.hasScreenshot ? (
                <a href={`/admin/screenshot/${p.id}`} target="_blank" rel="noreferrer" className="shrink-0" title="Open full screenshot">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/admin/screenshot/${p.id}`} alt={`Payment screenshot from ${m.name}`} loading="lazy" className="h-36 w-24 rounded-xl border border-cream-line bg-cream object-cover object-top sm:h-44 sm:w-32" />
                </a>
              ) : (
                <div className="flex h-36 w-24 shrink-0 items-center justify-center rounded-xl bg-cream text-xs text-muted-light sm:w-32">No screenshot</div>
              )}
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <Link href={`/admin/members/${m.id}`} className="font-bold hover:underline">
                      {m.name}
                    </Link>
                    <p className="text-xs text-muted-light">
                      {displayWhatsapp(m.whatsapp)} · {m.city}
                    </p>
                  </div>
                  <p className="font-display text-2xl">{rs(p.amount)}</p>
                </div>
                <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-sm">
                  <dt className="text-muted-light">For</dt>
                  <dd className="truncate">
                    {label(p.purpose)}
                    {eventTitle ? ` · ${eventTitle}` : ` · ${p.feeName}`}
                  </dd>
                  <dt className="text-muted-light">Paid by</dt>
                  <dd>
                    {label(p.method)}
                    {p.reference && <span className="text-muted-light"> · ID {p.reference}</span>}
                  </dd>
                  <dt className="text-muted-light">Sent</dt>
                  <dd>
                    {formatDateTime(p.createdAt)} · {p.receiptNo}
                  </dd>
                  {p.discountCode && (
                    <>
                      <dt className="text-muted-light">Code</dt>
                      <dd>{p.discountCode}</dd>
                    </>
                  )}
                </dl>

                {p.status === "pending" ? (
                  <div className="mt-auto flex flex-wrap items-center gap-2 pt-3">
                    <form action={approvePayment}>
                      <input type="hidden" name="paymentId" value={p.id} />
                      <input type="hidden" name="back" value={back} />
                      <SubmitButton className="btn btn-amber btn-sm" pendingText="Approving…">
                        Approve
                      </SubmitButton>
                    </form>
                    <details className="group">
                      <summary className="btn btn-outline btn-sm">Reject</summary>
                      <form action={rejectPayment} className="mt-2 flex flex-wrap gap-2">
                        <input type="hidden" name="paymentId" value={p.id} />
                        <input type="hidden" name="back" value={back} />
                        <input name="reason" className="input text-sm" placeholder="Reason (sent to the member)" />
                        <SubmitButton className="btn btn-pink btn-sm" pendingText="Rejecting…">
                          Confirm reject
                        </SubmitButton>
                      </form>
                    </details>
                  </div>
                ) : (
                  <div className="mt-auto flex flex-wrap items-center gap-2 pt-3 text-xs text-muted-light">
                    <StatusBadge status={p.status} />
                    {p.reviewedBy && (
                      <span>
                        by {p.reviewedBy}, {formatDateTime(p.reviewedAt)}
                      </span>
                    )}
                    {p.rejectReason && <span className="w-full text-[#a3153a]">{p.rejectReason}</span>}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

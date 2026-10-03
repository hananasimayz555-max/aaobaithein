import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { MEMBER_STATUSES, MEMBER_TYPES } from "@/db/schema";
import { Field, PageHeader, sp } from "@/components/admin-ui";
import { StatusBadge } from "@/components/status";
import { SubmitButton } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { displayWhatsapp, formatDate, formatDateTime, label, rs, toDateInput } from "@/lib/format";
import { renderTemplate, varsFor, waLink } from "@/lib/messages";
import { getSettings } from "@/lib/settings";
import { resetMemberPin, updateMember } from "../../../_actions/members";

export const metadata: Metadata = { title: "Member" };

export default async function MemberDetail({ params, searchParams }: PageProps<"/admin/members/[id]">) {
  await requireAdmin("members");
  const id = Number((await params).id);
  const q = await searchParams;
  const member = await db.query.members.findFirst({ where: eq(schema.members.id, id) });
  if (!member) notFound();

  const [payments, bookings, templates, settings, plan] = await Promise.all([
    db.query.payments.findMany({
      where: eq(schema.payments.memberId, id),
      orderBy: desc(schema.payments.createdAt),
      columns: { screenshot: false },
    }),
    db
      .select({ b: schema.bookings, e: schema.events })
      .from(schema.bookings)
      .innerJoin(schema.events, eq(schema.events.id, schema.bookings.eventId))
      .where(eq(schema.bookings.memberId, id))
      .orderBy(desc(schema.events.startsAt)),
    db.query.messageTemplates.findMany({ orderBy: schema.messageTemplates.name }),
    getSettings(),
    member.planId ? db.query.feeStructures.findFirst({ where: eq(schema.feeStructures.id, member.planId) }) : null,
  ]);
  const totalPaid = payments.filter((p) => p.status === "approved").reduce((a, p) => a + p.amount, 0);
  const vars = varsFor(member, {
    link: settings.community_link,
    expiry: member.expiresAt,
    event: bookings.find((x) => x.e.startsAt > new Date())?.e,
  });

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        back={{ href: "/admin/members", label: "Members" }}
        title={member.name}
        subtitle={
          <>
            {displayWhatsapp(member.whatsapp)} · {member.city} · {label(member.memberType)}, {member.age} · signed up{" "}
            {formatDate(member.createdAt)}
          </>
        }
        actions={
          <>
            <StatusBadge status={member.status} />
            <a href={`https://wa.me/${member.whatsapp}`} target="_blank" rel="noreferrer" className="btn btn-dark btn-sm">
              Open WhatsApp chat
            </a>
          </>
        }
      />
      {sp(q.saved) && <p className="form-ok mb-4">Saved.</p>}
      {sp(q.error) === "whatsapp" && <p className="form-error mb-4">That WhatsApp number is invalid or belongs to another member.</p>}
      {sp(q.pin) && (
        <p className="form-ok mb-4">
          New PIN: <strong className="font-display text-lg">{sp(q.pin)}</strong>. Send it to the member on WhatsApp; it won&apos;t be
          shown again.
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div className="space-y-6">
          <section className="panel p-5">
            <h2 className="font-display text-lg">What&apos;s stuck</h2>
            <p className="mt-2 whitespace-pre-line text-sm">{member.stuckOn || "—"}</p>
          </section>

          <form action={updateMember} className="panel space-y-4 p-5">
            <h2 className="font-display text-lg">Profile</h2>
            <input type="hidden" name="id" value={member.id} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name">
                <input name="name" defaultValue={member.name} className="input" required />
              </Field>
              <Field label="WhatsApp">
                <input name="whatsapp" defaultValue={member.whatsapp} className="input" required />
              </Field>
              <Field label="City">
                <input name="city" defaultValue={member.city} className="input" required />
              </Field>
              <Field label="Age">
                <input name="age" type="number" defaultValue={member.age} className="input" required />
              </Field>
              <Field label="Segment">
                <select name="memberType" defaultValue={member.memberType} className="input">
                  {MEMBER_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {label(t)}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Status">
                <select name="status" defaultValue={member.status} className="input">
                  {MEMBER_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {label(s)}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Membership expires" hint={plan ? `Plan: ${plan.name} (${label(plan.billingType)})` : "Leave empty for no expiry"}>
                <input name="expiresAt" type="date" defaultValue={toDateInput(member.expiresAt)} className="input" />
              </Field>
              <Field label="Tags" hint="Comma separated, e.g. ecommerce, needs-ntn">
                <input name="tags" defaultValue={member.tags.join(", ")} className="input" />
              </Field>
            </div>
            <Field label="Notes (only admins see these)">
              <textarea name="notes" defaultValue={member.notes} className="input" />
            </Field>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <SubmitButton>Save changes</SubmitButton>
              <SubmitButton
                className="btn btn-ghost btn-sm"
                formAction={resetMemberPin}
                pendingText="Resetting…"
                confirm="Make a new PIN for this member?"
              >
                Reset login PIN
              </SubmitButton>
            </div>
          </form>
        </div>

        <div className="space-y-6">
          <section className="panel p-5">
            <h2 className="font-display text-lg">Send a message</h2>
            <p className="mt-1 text-xs text-muted-light">Opens WhatsApp with the template filled in.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {templates.map((t) => (
                <a key={t.id} href={waLink(member.whatsapp, renderTemplate(t.body, vars))} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm">
                  {t.name}
                </a>
              ))}
            </div>
          </section>

          <section className="panel">
            <div className="flex items-center justify-between border-b border-cream-line p-4">
              <h2 className="font-display text-lg">Payments</h2>
              <span className="text-sm font-semibold">{rs(totalPaid)} paid</span>
            </div>
            <ul className="divide-y divide-cream-line">
              {payments.length === 0 && <li className="p-4 text-sm text-muted-light">No payments yet.</li>}
              {payments.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 p-4 text-sm">
                  <div>
                    <p className="font-semibold">
                      {label(p.purpose)} · {p.feeName}
                    </p>
                    <p className="text-xs text-muted-light">
                      {formatDateTime(p.createdAt)} · {label(p.method)} · {p.receiptNo}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{rs(p.amount)}</span>
                    {p.status === "pending" ? (
                      <Link href="/admin/payments" className="badge badge-amber">
                        Review
                      </Link>
                    ) : (
                      <StatusBadge status={p.status} />
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="panel">
            <h2 className="border-b border-cream-line p-4 font-display text-lg">Bookings</h2>
            <ul className="divide-y divide-cream-line">
              {bookings.length === 0 && <li className="p-4 text-sm text-muted-light">No bookings yet.</li>}
              {bookings.map(({ b, e }) => (
                <li key={b.id} className="flex items-center justify-between gap-3 p-4 text-sm">
                  <div>
                    <Link href={`/admin/events/${e.id}`} className="font-semibold hover:underline">
                      {e.title}
                    </Link>
                    <p className="text-xs text-muted-light">
                      {formatDateTime(e.startsAt)} · {rs(b.amountPaid)} of {rs(b.feeCharged)}
                    </p>
                  </div>
                  <StatusBadge status={b.status} />
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}

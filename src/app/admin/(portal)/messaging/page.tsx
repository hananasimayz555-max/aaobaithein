import type { Metadata } from "next";
import { and, asc, eq, gt, isNull, lt, desc, between } from "drizzle-orm";
import { db, schema } from "@/db";
import { TEMPLATE_PURPOSES } from "@/db/schema";
import { Empty, Field, PageHeader, sp } from "@/components/admin-ui";
import { SubmitButton } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { displayWhatsapp, formatDate, formatDateTime, label } from "@/lib/format";
import { deleteTemplate, saveTemplate } from "../../_actions/content";

export const metadata: Metadata = { title: "Messaging" };

type Template = typeof schema.messageTemplates.$inferSelect;

export default async function MessagingPage({ searchParams }: PageProps<"/admin/messaging">) {
  await requireAdmin("messaging");
  const q = await searchParams;
  const now = new Date();
  const in36h = new Date(now.getTime() + 36 * 3600e3);
  const weekAgo = new Date(now.getTime() - 7 * 864e5);
  const in14d = new Date(now.getTime() + 14 * 864e5);

  const bookingCols = {
    id: schema.bookings.id,
    name: schema.members.name,
    whatsapp: schema.members.whatsapp,
    event: schema.events.title,
    startsAt: schema.events.startsAt,
  };
  const [reminders, feedback, renewals, templates] = await Promise.all([
    db
      .select(bookingCols)
      .from(schema.bookings)
      .innerJoin(schema.members, eq(schema.members.id, schema.bookings.memberId))
      .innerJoin(schema.events, eq(schema.events.id, schema.bookings.eventId))
      .where(and(eq(schema.bookings.status, "confirmed"), isNull(schema.bookings.reminderSentAt), gt(schema.events.startsAt, now), lt(schema.events.startsAt, in36h)))
      .orderBy(asc(schema.events.startsAt)),
    db
      .select(bookingCols)
      .from(schema.bookings)
      .innerJoin(schema.members, eq(schema.members.id, schema.bookings.memberId))
      .innerJoin(schema.events, eq(schema.events.id, schema.bookings.eventId))
      .where(and(eq(schema.bookings.status, "attended"), isNull(schema.bookings.feedbackSentAt), gt(schema.events.startsAt, weekAgo), lt(schema.events.startsAt, now)))
      .orderBy(desc(schema.events.startsAt)),
    db.query.members.findMany({
      where: and(eq(schema.members.status, "active"), between(schema.members.expiresAt, now, in14d)),
      orderBy: asc(schema.members.expiresAt),
      columns: { id: true, name: true, whatsapp: true, expiresAt: true },
    }),
    db.query.messageTemplates.findMany({ orderBy: asc(schema.messageTemplates.purpose) }),
  ]);

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title="Messaging" subtitle="Each button opens WhatsApp with the message ready. Tap send in WhatsApp." />

      <div className="grid gap-6 lg:grid-cols-3">
        <Queue title="Reminders due" hint="Confirmed seats, event within 36 hours" empty="No reminders due.">
          {reminders.map((r) => (
            <QueueRow key={r.id} kind="reminder" id={r.id} name={r.name} whatsapp={r.whatsapp} detail={`${r.event} · ${formatDateTime(r.startsAt)}`} />
          ))}
        </Queue>
        <Queue title="Feedback to request" hint="Checked in during the last 7 days" empty="Nobody to ask yet. Check people in at events first.">
          {feedback.map((r) => (
            <QueueRow key={r.id} kind="feedback" id={r.id} name={r.name} whatsapp={r.whatsapp} detail={r.event} />
          ))}
        </Queue>
        <Queue title="Renewals" hint="Memberships ending in the next 14 days" empty="No memberships ending soon.">
          {renewals.map((m) => (
            <QueueRow key={m.id} kind="renewal" id={m.id} name={m.name} whatsapp={m.whatsapp} detail={`Ends ${formatDate(m.expiresAt)}`} />
          ))}
        </Queue>
      </div>

      <section id="templates" className="mt-10 scroll-mt-6">
        <h2 className="font-display text-xl">Templates</h2>
        <p className="mt-1 text-sm text-muted-light">
          Placeholders: {"{name} {event} {date} {time} {place} {amount} {link} {reason} {expiry}"}. Payment approvals use Welcome,
          Seat confirmed, On the waitlist and Payment not approved automatically, by purpose.
        </p>
        {sp(q.saved) && <p className="form-ok mt-3">Template saved.</p>}
        {sp(q.error) && <p className="form-error mt-3">A template needs a name and a message.</p>}
        <div className="mt-4 space-y-3">
          {templates.map((t) => (
            <details key={t.id} className="panel p-4">
              <summary className="flex items-center justify-between gap-3">
                <span className="font-bold">{t.name}</span>
                <span className="badge">{label(t.purpose)}</span>
              </summary>
              <div className="mt-4 border-t border-cream-line pt-4">
                <TemplateForm t={t} />
                <form action={deleteTemplate} className="mt-2">
                  <input type="hidden" name="id" value={t.id} />
                  <SubmitButton className="btn btn-ghost btn-sm text-[#a3153a]" confirm="Delete this template?">
                    Delete
                  </SubmitButton>
                </form>
              </div>
            </details>
          ))}
          <section className="panel p-4">
            <h3 className="mb-3 font-display text-lg">New template</h3>
            <TemplateForm />
          </section>
        </div>
      </section>
    </div>
  );
}

function Queue({ title, hint, empty, children }: { title: string; hint: string; empty: string; children: React.ReactNode[] }) {
  return (
    <section className="panel">
      <div className="border-b border-cream-line p-4">
        <h2 className="font-display text-lg">
          {title} {children.length > 0 && <span className="badge badge-amber ml-1 align-middle">{children.length}</span>}
        </h2>
        <p className="text-xs text-muted-light">{hint}</p>
      </div>
      {children.length ? <ul className="divide-y divide-cream-line">{children}</ul> : <Empty>{empty}</Empty>}
    </section>
  );
}

function QueueRow({ kind, id, name, whatsapp, detail }: { kind: string; id: number; name: string; whatsapp: string; detail: string }) {
  return (
    <li className="flex items-center justify-between gap-3 p-4">
      <div className="min-w-0 text-sm">
        <p className="font-bold">{name}</p>
        <p className="truncate text-xs text-muted-light">
          {displayWhatsapp(whatsapp)} · {detail}
        </p>
      </div>
      {/* Plain form so the row disappears on the next load once marked as sent */}
      <form action="/admin/send" method="post" target="_blank">
        <input type="hidden" name="kind" value={kind} />
        <input type="hidden" name="id" value={id} />
        <button className="btn btn-amber btn-sm">Send</button>
      </form>
    </li>
  );
}

function TemplateForm({ t }: { t?: Template }) {
  return (
    <form action={saveTemplate} className="grid gap-3 sm:grid-cols-2">
      {t && <input type="hidden" name="id" value={t.id} />}
      <Field label="Name">
        <input name="name" defaultValue={t?.name} className="input" required />
      </Field>
      <Field label="Used for">
        <select name="purpose" defaultValue={t?.purpose ?? "custom"} className="input">
          {TEMPLATE_PURPOSES.map((p) => (
            <option key={p} value={p}>
              {label(p)}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Message" className="sm:col-span-2">
        <textarea name="body" defaultValue={t?.body} className="input min-h-32" required />
      </Field>
      <div className="sm:col-span-2">
        <SubmitButton className="btn btn-dark btn-sm">{t ? "Save template" : "Add template"}</SubmitButton>
      </div>
    </form>
  );
}


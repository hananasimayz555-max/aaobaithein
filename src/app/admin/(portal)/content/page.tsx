import type { Metadata } from "next";
import { asc, desc, gte } from "drizzle-orm";
import { db, schema } from "@/db";
import { Empty, Field, FilterPills, PageHeader, sp } from "@/components/admin-ui";
import { SubmitButton } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";
import { deleteFaq, deleteTestimonial, saveEventCard, saveFaq, saveTestimonial } from "../../_actions/content";

export const metadata: Metadata = { title: "Content" };

type Testimonial = typeof schema.testimonials.$inferSelect;
type Faq = typeof schema.faqItems.$inferSelect;

export default async function ContentPage({ searchParams }: PageProps<"/admin/content">) {
  await requireAdmin("content");
  const q = await searchParams;
  const tab = sp(q.tab) || "events";
  const error = sp(q.error);

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title="Content" subtitle="What the website shows. Changes go live straight away." />
      <div className="mb-6">
        <FilterPills
          base="/admin/content"
          param="tab"
          value={tab === "events" ? "" : tab}
          options={[
            { value: "", label: "Event cards" },
            { value: "testimonials", label: "Testimonials" },
            { value: "faq", label: "FAQ" },
          ]}
        />
      </div>
      {error && <p className="form-error mb-4">Please fill in the required fields.</p>}
      {tab === "testimonials" ? <Testimonials /> : tab === "faq" ? <FaqTab /> : <EventCards />}
    </div>
  );
}

async function EventCards() {
  const events = await db.query.events.findMany({
    where: gte(schema.events.startsAt, new Date()),
    orderBy: asc(schema.events.startsAt),
  });
  if (!events.length) return <div className="panel"><Empty>No upcoming events. Event cards appear here once you create events.</Empty></div>;
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-light">Only events with status Open or Full appear on the website.</p>
      {events.map((e) => (
        <form key={e.id} action={saveEventCard} className="panel grid gap-3 p-4 sm:grid-cols-[1fr_auto]">
          <input type="hidden" name="id" value={e.id} />
          <div>
            <p className="font-bold">{e.title}</p>
            <p className="text-xs text-muted-light">
              {formatDateTime(e.startsAt)} · {e.status}
            </p>
            <input name="cardBlurb" defaultValue={e.cardBlurb} placeholder="Card line" className="input mt-2" />
          </div>
          <div className="flex flex-wrap items-end gap-2 sm:flex-col sm:items-stretch">
            <select name="cardColor" defaultValue={e.cardColor} className="input">
              <option value="mint">Mint</option>
              <option value="pink">Pink</option>
              <option value="dark">Dark</option>
            </select>
            <label className="flex items-center gap-2 text-sm font-semibold">
              <input type="checkbox" name="showOnSite" defaultChecked={e.showOnSite} className="accent-[#14110F]" /> On website
            </label>
            <SubmitButton className="btn btn-dark btn-sm">Save</SubmitButton>
          </div>
        </form>
      ))}
    </div>
  );
}

function TestimonialForm({ t }: { t?: Testimonial }) {
  return (
    <form action={saveTestimonial} className="grid gap-3 sm:grid-cols-2">
      {t && <input type="hidden" name="id" value={t.id} />}
      <Field label="Name">
        <input name="name" defaultValue={t?.name} className="input" required placeholder="Ayesha, 22" />
      </Field>
      <Field label="Label">
        <input name="label" defaultValue={t?.label} className="input" placeholder="Student, Rawalpindi" />
      </Field>
      <Field label="Quote" className="sm:col-span-2">
        <textarea name="quote" defaultValue={t?.quote} className="input" required />
      </Field>
      <div className="flex flex-wrap items-center gap-4 text-sm font-semibold sm:col-span-2">
        <label className="flex items-center gap-2">
          <input type="checkbox" name="approved" defaultChecked={t?.approved ?? true} className="accent-[#14110F]" /> Approved
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="showOnSite" defaultChecked={t?.showOnSite} className="accent-[#14110F]" /> Show on website
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="isPlaceholder" defaultChecked={t?.isPlaceholder} className="accent-[#14110F]" /> Placeholder
        </label>
        <SubmitButton className="btn btn-dark btn-sm ml-auto">{t ? "Save" : "Add testimonial"}</SubmitButton>
      </div>
    </form>
  );
}

async function Testimonials() {
  const items = await db.query.testimonials.findMany({ orderBy: [asc(schema.testimonials.approved), desc(schema.testimonials.createdAt)] });
  const waiting = items.filter((t) => !t.approved);
  return (
    <div className="space-y-4">
      {waiting.length > 0 && (
        <p className="rounded-2xl bg-amber-tint p-3 text-sm font-semibold">
          {waiting.length} new from feedback forms. Read, approve and tick &quot;Show on website&quot; to publish.
        </p>
      )}
      <p className="text-sm text-muted-light">The website shows the three newest approved testimonials marked for the website. Untick &quot;Placeholder&quot; ones once real stories arrive.</p>
      {items.map((t) => (
        <details key={t.id} className="panel p-4">
          <summary className="flex flex-wrap items-center justify-between gap-2">
            <span className="min-w-0">
              <span className="font-bold">{t.name}</span> <span className="text-sm text-muted-light">{t.label}</span>
              <span className="block truncate text-sm">&ldquo;{t.quote}&rdquo;</span>
            </span>
            <span className="flex gap-1">
              {!t.approved && <span className="badge badge-amber">Needs review</span>}
              {t.showOnSite && <span className="badge badge-mint">On website</span>}
              {t.isPlaceholder && <span className="badge">Placeholder</span>}
            </span>
          </summary>
          <div className="mt-4 border-t border-cream-line pt-4">
            <TestimonialForm t={t} />
            <form action={deleteTestimonial} className="mt-2">
              <input type="hidden" name="id" value={t.id} />
              <SubmitButton className="btn btn-ghost btn-sm text-[#a3153a]" confirm="Delete this testimonial?">
                Delete
              </SubmitButton>
            </form>
          </div>
        </details>
      ))}
      <section className="panel p-4">
        <h2 className="mb-3 font-display text-lg">Add a testimonial</h2>
        <TestimonialForm />
      </section>
    </div>
  );
}

function FaqForm({ f, next }: { f?: Faq; next?: number }) {
  return (
    <form action={saveFaq} className="grid gap-3">
      {f && <input type="hidden" name="id" value={f.id} />}
      <Field label="Question">
        <input name="question" defaultValue={f?.question} className="input" required />
      </Field>
      <Field label="Answer" hint="Use {membership_fee}, {baithak_fee} or {retreat_fee} to show live prices from Fees and plans.">
        <textarea name="answer" defaultValue={f?.answer} className="input" required />
      </Field>
      <div className="flex flex-wrap items-center gap-4 text-sm font-semibold">
        <label className="flex items-center gap-2">
          Order <input name="sortOrder" type="number" defaultValue={f?.sortOrder ?? next ?? 0} className="input w-20" />
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="published" defaultChecked={f?.published ?? true} className="accent-[#14110F]" /> Published
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="openByDefault" defaultChecked={f?.openByDefault} className="accent-[#14110F]" /> Open by default
        </label>
        <SubmitButton className="btn btn-dark btn-sm ml-auto">{f ? "Save" : "Add question"}</SubmitButton>
      </div>
    </form>
  );
}

async function FaqTab() {
  const items = await db.query.faqItems.findMany({ orderBy: asc(schema.faqItems.sortOrder) });
  return (
    <div className="space-y-3">
      {items.map((f) => (
        <details key={f.id} className="panel p-4">
          <summary className="flex items-center justify-between gap-3">
            <span>
              <span className="mr-2 text-sm text-muted-light">{f.sortOrder}.</span>
              <span className="font-bold">{f.question}</span>
            </span>
            <span className="flex gap-1">
              {!f.published && <span className="badge">Hidden</span>}
              {f.openByDefault && <span className="badge badge-mint">Open</span>}
            </span>
          </summary>
          <div className="mt-4 border-t border-cream-line pt-4">
            <FaqForm f={f} />
            <form action={deleteFaq} className="mt-2">
              <input type="hidden" name="id" value={f.id} />
              <SubmitButton className="btn btn-ghost btn-sm text-[#a3153a]" confirm="Delete this question?">
                Delete
              </SubmitButton>
            </form>
          </div>
        </details>
      ))}
      <section className="panel p-4">
        <h2 className="mb-3 font-display text-lg">Add a question</h2>
        <FaqForm next={(items.at(-1)?.sortOrder ?? 0) + 1} />
      </section>
    </div>
  );
}

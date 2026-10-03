import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { FeedbackForm } from "@/components/site-forms";

export const metadata: Metadata = { title: "Feedback", robots: { index: false } };

export default async function FeedbackPage({ params }: PageProps<"/feedback/[token]">) {
  const { token } = await params;
  const row = await db
    .select({ event: schema.events.title, name: schema.members.name, bookingId: schema.bookings.id })
    .from(schema.bookings)
    .innerJoin(schema.events, eq(schema.events.id, schema.bookings.eventId))
    .innerJoin(schema.members, eq(schema.members.id, schema.bookings.memberId))
    .where(eq(schema.bookings.feedbackToken, token))
    .get();
  if (!row) notFound();
  const done = await db.query.feedback.findFirst({ where: eq(schema.feedback.bookingId, row.bookingId) });

  return (
    <div className="mx-auto max-w-xl px-4 py-12">
      <p className="text-sm font-bold text-mint">{row.event}</p>
      <h1 className="mt-2 font-display text-4xl">
        Kaisa raha, <span className="text-pink">{row.name.split(" ")[0]}?</span>
      </h1>
      <div className="mt-8 rounded-3xl border-2 border-ink-line bg-ink-card p-6">
        {done ? <p className="form-ok">You&apos;ve already shared feedback. Shukriya!</p> : <FeedbackForm token={token} />}
      </div>
    </div>
  );
}

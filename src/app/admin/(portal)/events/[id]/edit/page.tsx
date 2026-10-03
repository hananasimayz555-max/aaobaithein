import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { eq, inArray } from "drizzle-orm";
import { db, schema } from "@/db";
import { PageHeader, sp } from "@/components/admin-ui";
import { EventForm } from "@/components/event-form";
import { requireAdmin } from "@/lib/auth";

export const metadata: Metadata = { title: "Edit event" };

export default async function EditEvent({ params, searchParams }: PageProps<"/admin/events/[id]/edit">) {
  await requireAdmin("events");
  const id = Number((await params).id);
  const error = sp((await searchParams).error);
  const event = await db.query.events.findFirst({ where: eq(schema.events.id, id) });
  if (!event) notFound();
  const [fees, links] = await Promise.all([
    db.query.feeStructures.findMany({ where: inArray(schema.feeStructures.appliesTo, ["baithak", "retreat"]) }),
    db.select().from(schema.eventFees).where(eq(schema.eventFees.eventId, id)),
  ]);
  const attached = links.map((l) => l.feeStructureId);
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader back={{ href: `/admin/events/${id}`, label: event.title }} title="Edit event" />
      {error && <p className="form-error mb-4">Title, type, start time and seat limit are required.</p>}
      <EventForm event={event} fees={fees.filter((f) => f.status !== "archived" || attached.includes(f.id))} attached={attached} />
    </div>
  );
}

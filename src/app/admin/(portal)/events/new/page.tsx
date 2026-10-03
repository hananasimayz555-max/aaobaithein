import type { Metadata } from "next";
import { inArray } from "drizzle-orm";
import { db, schema } from "@/db";
import { PageHeader, sp } from "@/components/admin-ui";
import { EventForm } from "@/components/event-form";
import { requireAdmin } from "@/lib/auth";

export const metadata: Metadata = { title: "New event" };

export default async function NewEvent({ searchParams }: PageProps<"/admin/events/new">) {
  await requireAdmin("events");
  const error = sp((await searchParams).error);
  const fees = await db.query.feeStructures.findMany({
    where: inArray(schema.feeStructures.appliesTo, ["baithak", "retreat"]),
  });
  const live = fees.filter((f) => f.status !== "archived");
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader back={{ href: "/admin/events", label: "Events" }} title="New event" />
      {error && <p className="form-error mb-4">Title, type, start time and seat limit are required.</p>}
      <EventForm fees={live} attached={live.filter((f) => f.status === "active" && f.appliesTo === "baithak").map((f) => f.id)} />
    </div>
  );
}

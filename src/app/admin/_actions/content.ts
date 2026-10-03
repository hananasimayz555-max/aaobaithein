"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db, schema } from "@/db";
import { TEMPLATE_PURPOSES, type TemplatePurpose } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { int, str } from "@/lib/format";

const done = (to: string) => {
  revalidatePath("/", "layout");
  redirect(to);
};

export async function saveTestimonial(fd: FormData) {
  await requireAdmin("content");
  const id = int(fd, "id");
  const values = {
    name: str(fd, "name"),
    label: str(fd, "label"),
    quote: str(fd, "quote"),
    approved: fd.get("approved") === "on",
    showOnSite: fd.get("showOnSite") === "on",
    isPlaceholder: fd.get("isPlaceholder") === "on",
  };
  if (!values.name || !values.quote) done("/admin/content?tab=testimonials&error=1");
  if (values.showOnSite) values.approved = true;
  if (id) await db.update(schema.testimonials).set(values).where(eq(schema.testimonials.id, id));
  else await db.insert(schema.testimonials).values(values);
  done("/admin/content?tab=testimonials");
}

export async function deleteTestimonial(fd: FormData) {
  await requireAdmin("content");
  await db.delete(schema.testimonials).where(eq(schema.testimonials.id, int(fd, "id") ?? 0));
  done("/admin/content?tab=testimonials");
}

export async function saveFaq(fd: FormData) {
  await requireAdmin("content");
  const id = int(fd, "id");
  const values = {
    question: str(fd, "question"),
    answer: str(fd, "answer"),
    sortOrder: int(fd, "sortOrder") ?? 0,
    openByDefault: fd.get("openByDefault") === "on",
    published: fd.get("published") === "on",
  };
  if (!values.question || !values.answer) done("/admin/content?tab=faq&error=1");
  if (id) await db.update(schema.faqItems).set(values).where(eq(schema.faqItems.id, id));
  else await db.insert(schema.faqItems).values(values);
  done("/admin/content?tab=faq");
}

export async function deleteFaq(fd: FormData) {
  await requireAdmin("content");
  await db.delete(schema.faqItems).where(eq(schema.faqItems.id, int(fd, "id") ?? 0));
  done("/admin/content?tab=faq");
}

export async function saveEventCard(fd: FormData) {
  await requireAdmin("content");
  const color = str(fd, "cardColor");
  await db
    .update(schema.events)
    .set({
      cardBlurb: str(fd, "cardBlurb"),
      cardColor: color === "pink" || color === "dark" ? color : "mint",
      showOnSite: fd.get("showOnSite") === "on",
    })
    .where(eq(schema.events.id, int(fd, "id") ?? 0));
  done("/admin/content");
}

export async function saveTemplate(fd: FormData) {
  await requireAdmin("messaging");
  const id = int(fd, "id");
  const purpose = str(fd, "purpose") as TemplatePurpose;
  const values = {
    name: str(fd, "name"),
    purpose: TEMPLATE_PURPOSES.includes(purpose) ? purpose : "custom",
    body: str(fd, "body"),
  };
  if (!values.name || !values.body) redirect("/admin/messaging?error=1#templates");
  if (id) await db.update(schema.messageTemplates).set(values).where(eq(schema.messageTemplates.id, id));
  else await db.insert(schema.messageTemplates).values(values);
  redirect("/admin/messaging?saved=1#templates");
}

export async function deleteTemplate(fd: FormData) {
  await requireAdmin("messaging");
  await db.delete(schema.messageTemplates).where(eq(schema.messageTemplates.id, int(fd, "id") ?? 0));
  redirect("/admin/messaging#templates");
}

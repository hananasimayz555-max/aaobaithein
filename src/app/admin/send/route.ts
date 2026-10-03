import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { getCurrentAdmin, canAccess } from "@/lib/auth";
import { messageLink, varsFor } from "@/lib/messages";
import { getSettings } from "@/lib/settings";

/**
 * POST from the Messaging page: marks a reminder or feedback request as sent,
 * then forwards the browser to WhatsApp with the message filled in.
 */
export async function POST(req: Request) {
  const admin = await getCurrentAdmin();
  if (!admin || !canAccess(admin.role, "messaging")) return new Response("Not allowed", { status: 401 });
  const fd = await req.formData();
  const kind = String(fd.get("kind"));
  const id = Number(fd.get("id"));
  const settings = await getSettings();

  if (kind === "renewal") {
    const member = await db.query.members.findFirst({ where: eq(schema.members.id, id) });
    if (!member) return new Response("Not found", { status: 404 });
    const href = await messageLink("renewal", member.whatsapp, varsFor(member, { expiry: member.expiresAt, link: `${settings.site_url}/join/pay` }));
    return href ? Response.redirect(href, 303) : new Response("No renewal template", { status: 404 });
  }

  const booking = await db.query.bookings.findFirst({ where: eq(schema.bookings.id, id) });
  if (!booking || (kind !== "reminder" && kind !== "feedback")) return new Response("Not found", { status: 404 });
  const [member, event] = await Promise.all([
    db.query.members.findFirst({ where: eq(schema.members.id, booking.memberId) }),
    db.query.events.findFirst({ where: eq(schema.events.id, booking.eventId) }),
  ]);
  if (!member || !event) return new Response("Not found", { status: 404 });

  const href = await messageLink(
    kind,
    member.whatsapp,
    varsFor(member, { event, link: kind === "feedback" ? `${settings.site_url}/feedback/${booking.feedbackToken}` : `${settings.site_url}/account` }),
  );
  if (!href) return new Response(`No ${kind} template yet`, { status: 404 });
  await db
    .update(schema.bookings)
    .set(kind === "reminder" ? { reminderSentAt: new Date() } : { feedbackSentAt: new Date() })
    .where(eq(schema.bookings.id, id));
  return Response.redirect(href, 303);
}

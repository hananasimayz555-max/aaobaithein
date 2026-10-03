import "server-only";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import type { TemplatePurpose } from "@/db/schema";

export type MessageVars = Partial<
  Record<"name" | "event" | "date" | "time" | "place" | "amount" | "link" | "reason" | "expiry", string>
>;

export function renderTemplate(body: string, vars: MessageVars) {
  return body.replace(/\{(\w+)\}/g, (m, key: string) => vars[key as keyof MessageVars] ?? m);
}

export function waLink(number: string, text: string) {
  return `https://wa.me/${number.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;
}

export async function templateFor(purpose: TemplatePurpose) {
  return db.query.messageTemplates.findFirst({ where: eq(schema.messageTemplates.purpose, purpose) });
}

/** Ready-to-click WhatsApp link for a member, using the first template with this purpose. */
export async function messageLink(purpose: TemplatePurpose, whatsapp: string, vars: MessageVars) {
  const t = await templateFor(purpose);
  if (!t) return null;
  return waLink(whatsapp, renderTemplate(t.body, vars));
}

type MemberLike = { name: string };
type EventLike = { title: string; startsAt: Date; place: string; city: string };

/** Standard placeholder values for a member (and optionally an event). */
export function varsFor(
  member: MemberLike,
  opts: { event?: EventLike | null; amount?: number; link?: string; reason?: string; expiry?: Date | null } = {},
): MessageVars {
  const fmt = (o: Intl.DateTimeFormatOptions) => (d: Date) =>
    new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Karachi", ...o }).format(d);
  const e = opts.event;
  return {
    name: member.name.split(" ")[0],
    event: e?.title,
    date: e ? fmt({ weekday: "long", day: "numeric", month: "long" })(e.startsAt) : undefined,
    time: e ? fmt({ hour: "numeric", minute: "2-digit", hour12: true })(e.startsAt) : undefined,
    place: e ? `${e.place}, ${e.city}` : undefined,
    amount: opts.amount != null ? `Rs ${opts.amount.toLocaleString("en-PK")}` : undefined,
    link: opts.link,
    reason: opts.reason,
    expiry: opts.expiry ? fmt({ day: "numeric", month: "long", year: "numeric" })(opts.expiry) : undefined,
  };
}

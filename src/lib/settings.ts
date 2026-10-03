import "server-only";
import { db, schema } from "@/db";

export const SETTING_KEYS = {
  community_link: "WhatsApp community invite link",
  contact_whatsapp: "Team WhatsApp number (for click-to-chat)",
  easypaisa: "Easypaisa account (name and number)",
  jazzcash: "JazzCash account (name and number)",
  bank: "Bank transfer details (bank, title, IBAN)",
  site_url: "Website address (used in messages)",
  instagram: "Instagram link",
  tiktok: "TikTok link",
} as const;

export type SettingKey = keyof typeof SETTING_KEYS;
export type Settings = Record<SettingKey, string>;

export async function getSettings(): Promise<Settings> {
  const rows = await db.select().from(schema.settings);
  const out = Object.fromEntries(Object.keys(SETTING_KEYS).map((k) => [k, ""])) as Settings;
  for (const r of rows) if (r.key in out) out[r.key as SettingKey] = r.value;
  return out;
}

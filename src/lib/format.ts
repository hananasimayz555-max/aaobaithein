const TZ = "Asia/Karachi";

export function rs(amount: number | null | undefined) {
  if (amount == null) return "—";
  return `Rs ${amount.toLocaleString("en-PK")}`;
}

export function formatDate(d: Date | null | undefined, opts: Intl.DateTimeFormatOptions = {}) {
  if (!d) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    day: "numeric",
    month: "short",
    year: "numeric",
    ...opts,
  }).format(d);
}

export function formatDateTime(d: Date | null | undefined) {
  if (!d) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(d);
}

export function formatTime(d: Date) {
  return new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "numeric", minute: "2-digit", hour12: true }).format(d);
}

export function formatDay(d: Date) {
  return new Intl.DateTimeFormat("en-GB", { timeZone: TZ, weekday: "long", day: "numeric", month: "long" }).format(d);
}

/** Value for <input type="datetime-local"> in Pakistan time. */
export function toLocalInput(d: Date | null | undefined) {
  if (!d) return "";
  const pk = new Date(d.getTime() + 5 * 60 * 60 * 1000);
  return pk.toISOString().slice(0, 16);
}
export function toDateInput(d: Date | null | undefined) {
  return toLocalInput(d).slice(0, 10);
}

/** Parse a datetime-local or date input value as Pakistan time (UTC+5, no DST). */
export function parseLocalInput(value: FormDataEntryValue | null | undefined, endOfDay = false) {
  const v = typeof value === "string" ? value.trim() : "";
  if (!v) return null;
  const withTime = v.length === 10 ? `${v}T${endOfDay ? "23:59" : "00:00"}` : v;
  const d = new Date(`${withTime}:00+05:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Normalise a Pakistani WhatsApp number to 92XXXXXXXXXX. Returns null if it doesn't look valid. */
export function normalizeWhatsapp(input: string) {
  let digits = input.replace(/\D/g, "");
  if (digits.startsWith("0092")) digits = digits.slice(2);
  if (digits.startsWith("03") && digits.length === 11) digits = `92${digits.slice(1)}`;
  if (digits.startsWith("3") && digits.length === 10) digits = `92${digits}`;
  if (/^923\d{9}$/.test(digits)) return digits;
  // allow international numbers for overseas members
  if (/^\d{10,15}$/.test(digits) && !digits.startsWith("0")) return digits;
  return null;
}

export function displayWhatsapp(n: string) {
  if (/^923\d{9}$/.test(n)) return `+92 ${n.slice(2, 5)} ${n.slice(5)}`;
  return `+${n}`;
}

export function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export const LABELS: Record<string, string> = {
  student: "Student",
  freelancer: "Freelancer",
  shop_owner: "Shop owner",
  founder: "Founder",
  professional: "Young professional",
  pending: "Pending",
  active: "Active",
  expired: "Expired",
  baithak: "Baithak",
  retreat: "Retreat",
  draft: "Draft",
  open: "Open",
  full: "Full",
  closed: "Closed",
  completed: "Completed",
  cancelled: "Cancelled",
  archived: "Archived",
  one_time: "One-time",
  monthly: "Monthly",
  quarterly: "Quarterly",
  yearly: "Yearly",
  per_event: "Per event",
  custom: "Custom period",
  membership: "Membership",
  event: "Event seat",
  event_balance: "Event balance",
  requested: "Requested",
  confirmed: "Confirmed",
  waitlisted: "Waitlisted",
  attended: "Attended",
  approved: "Approved",
  rejected: "Rejected",
  easypaisa: "Easypaisa",
  jazzcash: "JazzCash",
  bank: "Bank transfer",
  admin: "Admin",
  helper: "Helper",
  welcome: "Welcome",
  payment_received: "Payment received",
  payment_rejected: "Payment rejected",
  booking_confirmed: "Booking confirmed",
  reminder: "Reminder (24 hours)",
  feedback: "Feedback request",
  renewal: "Renewal",
};

export const label = (key: string | null | undefined) => (key ? (LABELS[key] ?? key) : "—");

export function str(fd: FormData, key: string) {
  const v = fd.get(key);
  return typeof v === "string" ? v.trim() : "";
}
export function int(fd: FormData, key: string) {
  const v = str(fd, key);
  if (v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? Math.round(n) : null;
}
export function list(fd: FormData, key: string) {
  return str(fd, key)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

const DAY = 864e5;
/** Days from now until `d` (negative if past). Kept here so pages stay free of Date.now(). */
export function daysUntil(d: Date) {
  return (d.getTime() - Date.now()) / DAY;
}
export function daysFromNow(days: number) {
  return new Date(Date.now() + days * DAY);
}

import { sql } from "drizzle-orm";
import { integer, primaryKey, sqliteTable, text, uniqueIndex, index } from "drizzle-orm/sqlite-core";

const id = () => integer("id").primaryKey({ autoIncrement: true });
const createdAt = () =>
  integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`);

export const MEMBER_TYPES = ["student", "freelancer", "shop_owner", "founder", "professional"] as const;
export const MEMBER_STATUSES = ["pending", "active", "expired"] as const;
export const EVENT_TYPES = ["baithak", "retreat"] as const;
export const EVENT_STATUSES = ["draft", "open", "full", "closed", "completed", "cancelled"] as const;
export const BILLING_TYPES = ["one_time", "monthly", "quarterly", "yearly", "per_event", "custom"] as const;
export const APPLIES_TO = ["membership", "baithak", "retreat"] as const;
export const FEE_STATUSES = ["draft", "active", "archived"] as const;
export const BOOKING_STATUSES = ["requested", "confirmed", "waitlisted", "cancelled", "attended"] as const;
export const PAYMENT_STATUSES = ["pending", "approved", "rejected"] as const;
export const PAYMENT_METHODS = ["easypaisa", "jazzcash", "bank"] as const;
export const PAYMENT_PURPOSES = ["membership", "event", "event_balance"] as const;
export const ADMIN_ROLES = ["admin", "helper"] as const;
export const TEMPLATE_PURPOSES = [
  "welcome",
  "payment_received",
  "payment_rejected",
  "booking_confirmed",
  "waitlisted",
  "reminder",
  "feedback",
  "renewal",
  "custom",
] as const;

export type MemberType = (typeof MEMBER_TYPES)[number];
export type MemberStatus = (typeof MEMBER_STATUSES)[number];
export type EventType = (typeof EVENT_TYPES)[number];
export type EventStatus = (typeof EVENT_STATUSES)[number];
export type BillingType = (typeof BILLING_TYPES)[number];
export type AppliesTo = (typeof APPLIES_TO)[number];
export type FeeStatus = (typeof FEE_STATUSES)[number];
export type BookingStatus = (typeof BOOKING_STATUSES)[number];
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];
export type PaymentPurpose = (typeof PAYMENT_PURPOSES)[number];
export type AdminRole = (typeof ADMIN_ROLES)[number];
export type TemplatePurpose = (typeof TEMPLATE_PURPOSES)[number];

export const adminUsers = sqliteTable(
  "admin_users",
  {
    id: id(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    role: text("role", { enum: ADMIN_ROLES }).notNull().default("admin"),
    active: integer("active", { mode: "boolean" }).notNull().default(true),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("admin_users_email_idx").on(t.email)],
);

export const members = sqliteTable(
  "members",
  {
    id: id(),
    name: text("name").notNull(),
    whatsapp: text("whatsapp").notNull(),
    city: text("city").notNull(),
    age: integer("age").notNull(),
    memberType: text("member_type", { enum: MEMBER_TYPES }).notNull(),
    stuckOn: text("stuck_on").notNull().default(""),
    status: text("status", { enum: MEMBER_STATUSES }).notNull().default("pending"),
    planId: integer("plan_id").references(() => feeStructures.id),
    joinedAt: integer("joined_at", { mode: "timestamp" }),
    expiresAt: integer("expires_at", { mode: "timestamp" }),
    tags: text("tags", { mode: "json" }).$type<string[]>().notNull().default(sql`'[]'`),
    notes: text("notes").notNull().default(""),
    pinHash: text("pin_hash").notNull(),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("members_whatsapp_idx").on(t.whatsapp), index("members_status_idx").on(t.status)],
);

export const feeStructures = sqliteTable("fee_structures", {
  id: id(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  amount: integer("amount").notNull(),
  billingType: text("billing_type", { enum: BILLING_TYPES }).notNull(),
  customPeriodDays: integer("custom_period_days"),
  appliesTo: text("applies_to", { enum: APPLIES_TO }).notNull(),
  audienceMemberTypes: text("audience_member_types", { mode: "json" })
    .$type<MemberType[]>()
    .notNull()
    .default(sql`'[]'`),
  audienceAgeMin: integer("audience_age_min"),
  audienceAgeMax: integer("audience_age_max"),
  audienceCities: text("audience_cities", { mode: "json" }).$type<string[]>().notNull().default(sql`'[]'`),
  audienceTags: text("audience_tags", { mode: "json" }).$type<string[]>().notNull().default(sql`'[]'`),
  validFrom: integer("valid_from", { mode: "timestamp" }),
  validTo: integer("valid_to", { mode: "timestamp" }),
  earlyBirdAmount: integer("early_bird_amount"),
  earlyBirdUntil: integer("early_bird_until", { mode: "timestamp" }),
  depositAmount: integer("deposit_amount"),
  status: text("status", { enum: FEE_STATUSES }).notNull().default("draft"),
  version: integer("version").notNull().default(1),
  createdAt: createdAt(),
  updatedAt: integer("updated_at", { mode: "timestamp" }),
});

/** Every saved change to a fee structure, so the history is never lost. */
export const feeHistory = sqliteTable("fee_history", {
  id: id(),
  feeStructureId: integer("fee_structure_id")
    .notNull()
    .references(() => feeStructures.id),
  version: integer("version").notNull(),
  snapshot: text("snapshot", { mode: "json" }).notNull(),
  changedBy: text("changed_by").notNull(),
  createdAt: createdAt(),
});

export const discountCodes = sqliteTable(
  "discount_codes",
  {
    id: id(),
    code: text("code").notNull(),
    feeStructureId: integer("fee_structure_id").references(() => feeStructures.id),
    percentOff: integer("percent_off"),
    amountOff: integer("amount_off"),
    validUntil: integer("valid_until", { mode: "timestamp" }),
    maxUses: integer("max_uses"),
    uses: integer("uses").notNull().default(0),
    active: integer("active", { mode: "boolean" }).notNull().default(true),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("discount_codes_code_idx").on(t.code)],
);

export const events = sqliteTable(
  "events",
  {
    id: id(),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    type: text("type", { enum: EVENT_TYPES }).notNull(),
    startsAt: integer("starts_at", { mode: "timestamp" }).notNull(),
    endsAt: integer("ends_at", { mode: "timestamp" }),
    place: text("place").notNull(),
    city: text("city").notNull(),
    description: text("description").notNull().default(""),
    seatLimit: integer("seat_limit").notNull(),
    status: text("status", { enum: EVENT_STATUSES }).notNull().default("draft"),
    // Content manager: how the event card looks on the website
    cardBlurb: text("card_blurb").notNull().default(""),
    cardColor: text("card_color", { enum: ["pink", "mint", "dark"] })
      .notNull()
      .default("mint"),
    showOnSite: integer("show_on_site", { mode: "boolean" }).notNull().default(true),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("events_slug_idx").on(t.slug)],
);

export const eventFees = sqliteTable(
  "event_fees",
  {
    eventId: integer("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    feeStructureId: integer("fee_structure_id")
      .notNull()
      .references(() => feeStructures.id),
  },
  (t) => [primaryKey({ columns: [t.eventId, t.feeStructureId] })],
);

export const bookings = sqliteTable(
  "bookings",
  {
    id: id(),
    memberId: integer("member_id")
      .notNull()
      .references(() => members.id),
    eventId: integer("event_id")
      .notNull()
      .references(() => events.id),
    status: text("status", { enum: BOOKING_STATUSES }).notNull().default("requested"),
    feeStructureId: integer("fee_structure_id").references(() => feeStructures.id),
    feeName: text("fee_name").notNull().default(""),
    /** Total price locked in at booking time. Fee changes never alter it. */
    feeCharged: integer("fee_charged").notNull().default(0),
    depositAmount: integer("deposit_amount"),
    amountPaid: integer("amount_paid").notNull().default(0),
    discountCode: text("discount_code"),
    attendedAt: integer("attended_at", { mode: "timestamp" }),
    reminderSentAt: integer("reminder_sent_at", { mode: "timestamp" }),
    confirmationSentAt: integer("confirmation_sent_at", { mode: "timestamp" }),
    feedbackToken: text("feedback_token").notNull(),
    feedbackSentAt: integer("feedback_sent_at", { mode: "timestamp" }),
    createdAt: createdAt(),
  },
  (t) => [index("bookings_event_idx").on(t.eventId), index("bookings_member_idx").on(t.memberId)],
);

export const payments = sqliteTable(
  "payments",
  {
    id: id(),
    receiptNo: text("receipt_no").notNull(),
    memberId: integer("member_id")
      .notNull()
      .references(() => members.id),
    bookingId: integer("booking_id").references(() => bookings.id),
    purpose: text("purpose", { enum: PAYMENT_PURPOSES }).notNull(),
    feeStructureId: integer("fee_structure_id").references(() => feeStructures.id),
    feeName: text("fee_name").notNull().default(""),
    amount: integer("amount").notNull(),
    method: text("method", { enum: PAYMENT_METHODS }).notNull(),
    reference: text("reference").notNull().default(""),
    discountCode: text("discount_code"),
    screenshot: text("screenshot"),
    status: text("status", { enum: PAYMENT_STATUSES }).notNull().default("pending"),
    rejectReason: text("reject_reason"),
    reviewedBy: text("reviewed_by"),
    reviewedAt: integer("reviewed_at", { mode: "timestamp" }),
    createdAt: createdAt(),
  },
  (t) => [index("payments_status_idx").on(t.status), index("payments_member_idx").on(t.memberId)],
);

export const messageTemplates = sqliteTable("message_templates", {
  id: id(),
  name: text("name").notNull(),
  purpose: text("purpose", { enum: TEMPLATE_PURPOSES }).notNull(),
  body: text("body").notNull(),
  createdAt: createdAt(),
});

export const testimonials = sqliteTable("testimonials", {
  id: id(),
  memberId: integer("member_id").references(() => members.id),
  name: text("name").notNull(),
  label: text("label").notNull().default(""),
  quote: text("quote").notNull(),
  approved: integer("approved", { mode: "boolean" }).notNull().default(false),
  showOnSite: integer("show_on_site", { mode: "boolean" }).notNull().default(false),
  isPlaceholder: integer("is_placeholder", { mode: "boolean" }).notNull().default(false),
  createdAt: createdAt(),
});

export const faqItems = sqliteTable("faq_items", {
  id: id(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  openByDefault: integer("open_by_default", { mode: "boolean" }).notNull().default(false),
  published: integer("published", { mode: "boolean" }).notNull().default(true),
  createdAt: createdAt(),
});

export const feedback = sqliteTable("feedback", {
  id: id(),
  bookingId: integer("booking_id")
    .notNull()
    .references(() => bookings.id),
  rating: integer("rating").notNull(),
  comment: text("comment").notNull().default(""),
  createdAt: createdAt(),
});

export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

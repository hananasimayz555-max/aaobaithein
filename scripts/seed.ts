/**
 * Loads starting data: the two founder logins, the starting fee structures
 * (Rs 500 membership, Rs 500 per baithak, a draft retreat with a deposit),
 * WhatsApp templates, FAQ, placeholder testimonials and one sample baithak.
 *
 * Safe to run more than once: it only fills tables that are empty.
 *   ADMIN_1_EMAIL=... ADMIN_1_PASSWORD=... npm run db:seed
 */
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { count } from "drizzle-orm";
import type { SQLiteTable } from "drizzle-orm/sqlite-core";
import { db, schema } from "../src/db";

async function isEmpty(table: SQLiteTable) {
  const [row] = await db.select({ n: count() }).from(table);
  return (row?.n ?? 0) === 0;
}

function randomPassword() {
  return randomBytes(9).toString("base64url");
}

async function main() {
  if (await isEmpty(schema.adminUsers)) {
    const founders = [
      { n: 1, defaultName: "Founder one", defaultEmail: "founder1@aaobaithein.pk" },
      { n: 2, defaultName: "Founder two", defaultEmail: "founder2@aaobaithein.pk" },
    ];
    for (const f of founders) {
      const name = process.env[`ADMIN_${f.n}_NAME`] ?? f.defaultName;
      const email = (process.env[`ADMIN_${f.n}_EMAIL`] ?? f.defaultEmail).toLowerCase();
      const password = process.env[`ADMIN_${f.n}_PASSWORD`] ?? randomPassword();
      await db.insert(schema.adminUsers).values({
        name,
        email,
        passwordHash: await bcrypt.hash(password, 10),
        role: "admin",
      });
      console.log(`Admin login → ${email} / ${process.env[`ADMIN_${f.n}_PASSWORD`] ? "(password from env)" : password}`);
    }
  }

  let baithakFeeId: number | undefined;
  if (await isEmpty(schema.feeStructures)) {
    const rows = await db
      .insert(schema.feeStructures)
      .values([
        {
          name: "Standard membership",
          description: "Join the community. Access to the WhatsApp group and member pricing for baithaks.",
          amount: 500,
          billingType: "yearly",
          appliesTo: "membership",
          status: "active",
        },
        {
          name: "Baithak seat",
          description: "One seat at a baithak.",
          amount: 500,
          billingType: "per_event",
          appliesTo: "baithak",
          status: "active",
        },
        {
          name: "Northern retreat",
          description: "Example retreat price with a deposit to hold the seat. Still a draft.",
          amount: 25000,
          billingType: "per_event",
          appliesTo: "retreat",
          depositAmount: 5000,
          status: "draft",
        },
      ])
      .returning({ id: schema.feeStructures.id, appliesTo: schema.feeStructures.appliesTo });
    baithakFeeId = rows.find((r) => r.appliesTo === "baithak")?.id;
    for (const r of rows) {
      const fee = await db.query.feeStructures.findFirst({ where: (f, { eq }) => eq(f.id, r.id) });
      await db.insert(schema.feeHistory).values({ feeStructureId: r.id, version: 1, snapshot: fee, changedBy: "seed" });
    }
  }

  if (await isEmpty(schema.events)) {
    const starts = new Date();
    starts.setUTCDate(starts.getUTCDate() + ((7 - starts.getUTCDay()) % 7 || 7)); // next Sunday
    starts.setUTCHours(12, 0, 0, 0); // 5pm in Pakistan
    const [ev] = await db
      .insert(schema.events)
      .values({
        slug: "sunday-baithak-islamabad",
        title: "Sunday baithak: registering your business",
        type: "baithak",
        startsAt: starts,
        endsAt: new Date(starts.getTime() + 2 * 60 * 60 * 1000),
        place: "Founders' office, F-7",
        city: "Islamabad",
        description:
          "Sole proprietor, partnership or private limited? NTN, SECP and the bank account. Bring your questions, we'll sit and sort them out together.",
        seatLimit: 20,
        status: "open",
        cardBlurb: "Registration, NTN and SECP without the headache.",
        cardColor: "mint",
      })
      .returning();
    if (baithakFeeId) await db.insert(schema.eventFees).values({ eventId: ev.id, feeStructureId: baithakFeeId });
  }

  if (await isEmpty(schema.messageTemplates)) {
    await db.insert(schema.messageTemplates).values([
      {
        name: "Welcome to the community",
        purpose: "welcome",
        body: "Assalam o alaikum {name}! Your Aao Baithein membership is active ✅\n\nJoin the community here: {link}\n\nNext baithak ki details group mein milengi. Chal baith, baat kar.",
      },
      {
        name: "Payment received",
        purpose: "payment_received",
        body: "Hi {name}, we got your payment of {amount}. Shukriya! We'll confirm it shortly.",
      },
      {
        name: "Payment not approved",
        purpose: "payment_rejected",
        body: "Hi {name}, we couldn't verify your payment of {amount}. Reason: {reason}\n\nPlease upload it again from your account: {link}",
      },
      {
        name: "Seat confirmed",
        purpose: "booking_confirmed",
        body: "{name}, your seat is confirmed for {event} 🎉\n📅 {date}, {time}\n📍 {place}\n\nAa jao, chai humari taraf se.",
      },
      {
        name: "On the waitlist",
        purpose: "waitlisted",
        body: "{name}, {event} is full right now, so you're on the waitlist. We'll message you the moment a seat opens up.",
      },
      {
        name: "24-hour reminder",
        purpose: "reminder",
        body: "Kal baithak hai, {name}! {event}\n📅 {date}, {time}\n📍 {place}\n\nSee you there.",
      },
      {
        name: "Feedback after the event",
        purpose: "feedback",
        body: "Shukriya for coming to {event}, {name}! Two minutes for feedback? You can also leave a line about your experience: {link}",
      },
      {
        name: "Membership renewal",
        purpose: "renewal",
        body: "Hi {name}, your Aao Baithein membership ends on {expiry}. Renew here to keep your member pricing: {link}",
      },
    ]);
  }

  if (await isEmpty(schema.faqItems)) {
    await db.insert(schema.faqItems).values([
      {
        question: "Kitna kharcha hai? How much does it cost?",
        answer:
          "Membership is {membership_fee} and a baithak seat is {baithak_fee}. Retreats are priced separately and announced in the community. You can pay by Easypaisa, JazzCash or bank transfer.",
        sortOrder: 1,
        openByDefault: true,
      },
      {
        question: "Who is it for?",
        answer:
          "Anyone aged 18 to 30 in Pakistan who wants to start a business or fix one that's stuck: students, freelancers, shop owners and early founders.",
        sortOrder: 2,
      },
      {
        question: "What happens at a baithak?",
        answer:
          "A small group sits with experienced founders and talks honestly about real blockers: registration, tax, operations, getting sales, and confidence. You leave with a clear next step.",
        sortOrder: 3,
      },
      {
        question: "I don't have a business yet. Can I still come?",
        answer: "Haan, bilkul. Half the room is still at the idea stage. That's exactly when a baithak helps most.",
        sortOrder: 4,
      },
      {
        question: "Where do baithaks happen?",
        answer:
          "Anywhere: the office, a café, a Sunday meetup in Islamabad. Retreats go to the northern areas, such as Murree, Naltar and Hunza.",
        sortOrder: 5,
      },
    ]);
  }

  if (await isEmpty(schema.testimonials)) {
    await db.insert(schema.testimonials).values([
      {
        name: "Ayesha, 22",
        label: "Student, Rawalpindi",
        quote: "I'd been 'planning' my bakery for a year. One baithak and I had my NTN the next week.",
        approved: true,
        showOnSite: true,
        isPlaceholder: true,
      },
      {
        name: "Hamza, 26",
        label: "Freelancer, Lahore",
        quote: "Nobody had ever explained tax to me without making me feel stupid. This was different.",
        approved: true,
        showOnSite: true,
        isPlaceholder: true,
      },
      {
        name: "Bilal, 24",
        label: "Shop owner, Islamabad",
        quote: "Got real numbers from people who actually run shops. My sales doubled in two months.",
        approved: true,
        showOnSite: true,
        isPlaceholder: true,
      },
    ]);
  }

  if (await isEmpty(schema.settings)) {
    await db.insert(schema.settings).values([
      { key: "community_link", value: "https://chat.whatsapp.com/your-invite-code" },
      { key: "contact_whatsapp", value: "923000000000" },
      { key: "easypaisa", value: "Aao Baithein · 0300 0000000" },
      { key: "jazzcash", value: "Aao Baithein · 0300 0000000" },
      { key: "bank", value: "Bank name · Account title: Aao Baithein · IBAN PK00XXXX0000000000000000" },
      { key: "site_url", value: process.env.SITE_URL ?? "http://localhost:3000" },
      { key: "instagram", value: "" },
      { key: "tiktok", value: "" },
    ]);
  }

  console.log("Seed complete.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

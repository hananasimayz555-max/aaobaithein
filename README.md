# Aao Baithein

Website and admin portal for **Aao Baithein** (*chal baith, baat kar*), a business community for young Pakistanis aged 18 to 30.

- **Public site**: landing page, sign-up, membership payment, events, booking, member account, feedback.
- **Admin portal** (`/admin`): dashboard, payments queue, members, events, bookings and check-in, fee and plan builder, content, WhatsApp messaging, reports, settings.

Built from `aao-baithein-admin-portal-spec.md` and `aao-baithein-brand-and-website-brief.md` (Neon chai palette, Mughal arches, bunting, chai cup mascot).

## Stack (near-zero cost)

| Piece | Choice | Cost |
| --- | --- | --- |
| App | Next.js 16 (App Router, server actions), Tailwind CSS 4 | — |
| Database | SQLite through libSQL: a local file in development, [Turso](https://turso.tech) in production | Free tier |
| Hosting | [Vercel](https://vercel.com) | Free (Hobby) |
| Payments | Manual: Easypaisa, JazzCash or bank transfer plus a screenshot, approved in the portal | Free |
| WhatsApp | Click-to-chat links (`wa.me`) with templates filled in | Free |

Screenshots are resized in the browser (usually 100 to 600 KB) and stored in the database, so there is no separate file storage to pay for.

## Run it locally

```bash
npm install
npm run db:setup   # creates local.db, loads starting data, prints two admin logins
npm run dev        # http://localhost:3000  and  http://localhost:3000/admin
```

`db:setup` only fills empty tables, so it is safe to re-run. To choose the founders' logins, set `ADMIN_1_EMAIL`, `ADMIN_1_PASSWORD` (and `ADMIN_2_…`) before running it.

Other scripts: `npm run lint`, `npm run typecheck`, `npm run build`, `npm run db:push` (apply schema changes).

## Deploy (GitHub → Vercel + Turso)

1. Create a free Turso database and token:
   ```bash
   turso db create aao-baithein
   turso db show aao-baithein --url
   turso db tokens create aao-baithein
   ```
2. Load the schema and starting data into it from your computer:
   ```bash
   DATABASE_URL=libsql://… DATABASE_AUTH_TOKEN=… \
   ADMIN_1_EMAIL=you@example.com ADMIN_1_PASSWORD='a long password' \
   ADMIN_2_EMAIL=cofounder@example.com ADMIN_2_PASSWORD='another long password' \
   npm run db:setup
   ```
3. Import the GitHub repo in Vercel and add the environment variables from `.env.example`: `DATABASE_URL`, `DATABASE_AUTH_TOKEN`, `SESSION_SECRET` (`openssl rand -base64 32`).
4. Log in at `/admin`, open **Settings**, and fill in the real Easypaisa, JazzCash and bank details, the WhatsApp community link, the team WhatsApp number and the website address.

## How it works

### Member journey
1. **Join** (`/join`): name, WhatsApp, city, age (18 to 30), segment, what's stuck, and a 4 to 8 digit PIN for logging in. Status: **Pending**.
2. **Pay** (`/join/pay`): pick an eligible plan, send money, upload a screenshot.
3. An admin approves it in **Payments**: status becomes **Active**, expiry is set from the plan's billing type, and a **Send on WhatsApp** button opens the welcome message with the community link.
4. **Book** (`/events/[slug]`): active members reserve a seat (or join the waitlist when full) and pay the event fee, or a deposit when the fee has one.
5. Approving the event payment confirms the seat (or waitlists it if seats ran out).
6. **Messaging** lists reminders due (events in the next 36 hours), feedback requests for people checked in, and renewals ending in 14 days, each one tap away.
7. The feedback form (`/feedback/[token]`) collects a rating and an optional testimonial, which lands in **Content → Testimonials** for approval.

### Fee and plan builder
Nothing about prices is hard-coded. Each fee structure has an amount, billing type (one-time, monthly, quarterly, yearly, per event, custom days), what it applies to (membership, baithak, retreat), audience rules (member type, age range, cities, tags), validity dates, an early-bird price, and an optional deposit.

- Membership: members see the active plans they qualify for.
- Events: attach one or more fees to each event; each member pays the cheapest one they qualify for.
- Discount codes: percent or rupee amount, optionally tied to one fee, with expiry and usage limits.
- Every save is recorded as a new version in the fee's history. Bookings and payments store the amount actually charged, so changing a fee never changes past payments.
- FAQ answers can include `{membership_fee}`, `{baithak_fee}` and `{retreat_fee}`, which show live prices.

### Roles
- **Admin**: everything.
- **Helper**: dashboard, payments and bookings (check-in) only. Add helpers in **Settings**.

### Statuses
- Member: Pending, Active, Expired (expired automatically once the expiry date passes)
- Booking: Requested, Confirmed, Waitlisted, Cancelled, Attended
- Payment: Pending, Approved, Rejected

## Project layout

```
src/app/(site)/        public pages and member server actions
src/app/admin/         admin login, portal pages, server actions, screenshot/CSV/send routes
src/components/        brand art (mascot, arches, bunting, icons), forms, admin UI
src/db/schema.ts       data model (Drizzle ORM)
src/lib/               auth/sessions, fee engine, messaging, formatting
scripts/seed.ts        starting data
```

## Open items from the spec

These are placeholders until the founders decide; all of them are editable in the portal without code changes:

- Starting fees (seeded as Rs 500 yearly membership, Rs 500 per baithak, and a draft retreat at Rs 25,000 with a Rs 5,000 deposit).
- Seat limits and refund policy. Members can cancel unpaid requests themselves; paid seats are cancelled (and refunded) by an admin.
- Testimonials and the sample Sunday baithak are placeholders.
- Logo direction and final fonts (currently Archivo Black for headlines and DM Sans for body text).

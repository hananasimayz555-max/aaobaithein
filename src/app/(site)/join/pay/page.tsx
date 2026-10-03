import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { MembershipPaymentForm } from "@/components/site-forms";
import { requireMember } from "@/lib/auth";
import { currentPrice, membershipPlansFor } from "@/lib/fees";
import { daysUntil, formatDate, label, rs } from "@/lib/format";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = { title: "Pay membership" };

export default async function PayMembershipPage() {
  const member = await requireMember("/join/pay");
  const renewing = member.status !== "pending";
  if (member.status === "active" && (!member.expiresAt || daysUntil(member.expiresAt) > 30)) {
    redirect("/account");
  }

  const pending = await db.query.payments.findFirst({
    where: and(
      eq(schema.payments.memberId, member.id),
      eq(schema.payments.purpose, "membership"),
      eq(schema.payments.status, "pending"),
    ),
  });
  const [plans, settings] = await Promise.all([membershipPlansFor(member), getSettings()]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <p className="text-sm font-bold text-mint">{renewing ? "Renew your membership" : "Step 2 of 2 · Membership fee"}</p>
      <h1 className="mt-2 font-display text-4xl sm:text-5xl">
        Almost there, <span className="text-pink">{member.name.split(" ")[0]}.</span>
      </h1>
      {member.status === "active" && member.expiresAt && (
        <p className="mt-3 text-muted-dark">Your membership runs until {formatDate(member.expiresAt)}.</p>
      )}

      {pending ? (
        <div className="mt-8 rounded-3xl bg-mint p-6 text-ink">
          <p className="font-display text-2xl">We&apos;re checking your payment.</p>
          <p className="mt-2 font-medium">
            {rs(pending.amount)} by {label(pending.method)}, sent {formatDate(pending.createdAt)}. You&apos;ll get a
            WhatsApp message once it&apos;s approved.
          </p>
          <Link href="/account" className="btn btn-dark mt-4">
            Go to my account
          </Link>
        </div>
      ) : plans.length === 0 ? (
        <div className="mt-8 rounded-3xl border-2 border-ink-line bg-ink-card p-6">
          <p className="font-display text-xl">Membership plans are being set up.</p>
          <p className="mt-2 text-muted-dark">
            We&apos;ve saved your sign-up. The team will message you on WhatsApp with the fee and how to pay.
          </p>
        </div>
      ) : (
        <div className="mt-8 rounded-3xl border-2 border-ink-line bg-ink-card p-5 sm:p-8">
          <MembershipPaymentForm
            accounts={{ easypaisa: settings.easypaisa, jazzcash: settings.jazzcash, bank: settings.bank }}
            plans={plans.map((p) => ({
              id: p.id,
              name: p.name,
              description: p.description,
              amount: currentPrice(p).amount,
              regular: p.amount,
              period: label(p.billingType),
            }))}
          />
        </div>
      )}
    </div>
  );
}

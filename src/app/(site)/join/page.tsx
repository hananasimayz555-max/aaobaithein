import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Bunting } from "@/components/brand";
import { JoinForm } from "@/components/site-forms";
import { getCurrentMember } from "@/lib/auth";

export const metadata: Metadata = { title: "Join" };

export default async function JoinPage() {
  const member = await getCurrentMember();
  if (member) redirect(member.status === "active" ? "/account" : "/join/pay");
  return (
    <>
      <Bunting />
      <div className="mx-auto max-w-2xl px-4 py-10">
        <p className="text-sm font-bold text-mint">Step 1 of 2 · Tell us about you</p>
        <h1 className="mt-2 font-display text-4xl sm:text-5xl">
          Aao, <span className="text-pink">baitho.</span>
        </h1>
        <p className="mt-3 text-muted-dark">
          Two minutes to sign up. Then you pay the membership fee and we add you to the community.
        </p>
        <div className="mt-8 rounded-3xl border-2 border-ink-line bg-ink-card p-5 sm:p-8">
          <JoinForm />
        </div>
        <p className="mt-6 text-sm text-muted-dark">
          Already signed up?{" "}
          <Link href="/account/login" className="font-bold text-amber hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </>
  );
}

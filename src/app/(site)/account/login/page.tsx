import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/site-forms";
import { getCurrentMember } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { waLink } from "@/lib/messages";

export const metadata: Metadata = { title: "Log in" };

export default async function MemberLogin({ searchParams }: PageProps<"/account/login">) {
  const { next } = await searchParams;
  const nextPath = typeof next === "string" ? next : "/account";
  if (await getCurrentMember()) redirect(nextPath);
  const settings = await getSettings();
  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="font-display text-4xl">
        Welcome <span className="text-pink">back.</span>
      </h1>
      <div className="mt-8 rounded-3xl border-2 border-ink-line bg-ink-card p-6">
        <LoginForm next={nextPath} />
      </div>
      <div className="mt-6 space-y-2 text-sm text-muted-dark">
        <p>
          New here?{" "}
          <Link href="/join" className="font-bold text-amber hover:underline">
            Sign up
          </Link>
        </p>
        {settings.contact_whatsapp && (
          <p>
            Forgot your PIN?{" "}
            <a
              href={waLink(settings.contact_whatsapp, "Hi! I forgot my Aao Baithein PIN. Can you reset it?")}
              className="font-bold text-amber hover:underline"
              target="_blank"
              rel="noreferrer"
            >
              Message us on WhatsApp
            </a>
          </p>
        )}
      </div>
    </div>
  );
}

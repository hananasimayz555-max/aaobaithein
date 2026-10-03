import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Arch, Bunting, ChaiMascot } from "@/components/brand";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = { title: "Done" };

const COPY = {
  signup: {
    title: ["You're signed up.", "Ek kadam aur."],
    body: "Your status is Pending. Pay the membership fee and upload the screenshot, and we'll add you to the community.",
    cta: { href: "/join/pay", label: "Pay membership fee" },
  },
  payment: {
    title: ["Payment sent.", "Shukriya!"],
    body: "We'll check your screenshot, usually within a day. You'll get a WhatsApp message once it's approved.",
    cta: { href: "/account", label: "Go to my account" },
  },
  booking: {
    title: ["Seat confirmed.", "Aa jao!"],
    body: "Your seat is booked. You'll get a reminder on WhatsApp a day before.",
    cta: { href: "/account", label: "See my bookings" },
  },
  waitlist: {
    title: ["It's full right now.", "You're on the waitlist."],
    body: "We'll message you on WhatsApp the moment a seat opens. No payment needed until then.",
    cta: { href: "/events", label: "See other events" },
  },
} as const;

export default async function ConfirmPage({ params, searchParams }: PageProps<"/confirm/[kind]">) {
  const { kind } = await params;
  const sp = await searchParams;
  if (!(kind in COPY)) notFound();
  const copy = COPY[kind as keyof typeof COPY];
  const settings = await getSettings();
  const back = typeof sp.event === "string" ? `/events/${sp.event}` : null;

  return (
    <>
      <Bunting />
      <div className="mx-auto grid max-w-4xl items-center gap-10 px-4 py-14 md:grid-cols-[1.3fr_1fr]">
        <div>
          <h1 className="font-display text-4xl leading-tight sm:text-5xl">
            {copy.title[0]} <span className="text-pink">{copy.title[1]}</span>
          </h1>
          <p className="mt-4 text-lg text-muted-dark">{copy.body}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={copy.cta.href} className="btn btn-amber btn-lg">
              {copy.cta.label}
            </Link>
            {back && (
              <Link href={back} className="btn btn-outline btn-lg text-cream">
                Back to the event
              </Link>
            )}
            {kind !== "signup" && settings.contact_whatsapp && (
              <a
                href={`https://wa.me/${settings.contact_whatsapp}`}
                className="btn btn-outline btn-lg text-cream"
                target="_blank"
                rel="noreferrer"
              >
                Message the team
              </a>
            )}
          </div>
        </div>
        <Arch color="mint" className="mx-auto flex aspect-[4/5] w-56 items-end justify-center p-6 pt-12">
          <ChaiMascot className="w-full" />
        </Arch>
      </div>
    </>
  );
}

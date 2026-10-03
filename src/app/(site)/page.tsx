import Link from "next/link";
import { Arch, BrandIcon, Bunting, ChaiMascot, Character, HunzaSunrise, IconTile, type IconName } from "@/components/brand";
import { EventCard } from "@/components/event-card";
import { publicPrices } from "@/lib/fees";
import { rs } from "@/lib/format";
import { siteFaq, siteTestimonials, upcomingEvents } from "@/lib/public";
import { getSettings } from "@/lib/settings";

export default async function Home() {
  const [events, testimonials, faq, prices, settings] = await Promise.all([
    upcomingEvents(3),
    siteTestimonials(),
    siteFaq(),
    publicPrices(),
    getSettings(),
  ]);
  const whatsapp = settings.community_link || "/join";

  return (
    <>
      {/* 1. Hero */}
      <section className="relative overflow-hidden">
        <Bunting />
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-16 pt-10 md:grid-cols-[1.25fr_1fr] md:pt-16">
          <div>
            <span className="inline-block rounded-full bg-mint px-3 py-1 text-xs font-bold text-ink">
              Business community for young Pakistanis
            </span>
            <h1 className="mt-5 font-display text-5xl leading-[0.95] sm:text-7xl">
              Chal baith, <span className="text-pink">baat kar.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-muted-dark">
              Sit with people who&apos;ve built something. Get real answers on registration, tax, and your first sale.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/events" className="btn btn-amber btn-lg">
                Join the next baithak
              </Link>
              <a href={whatsapp} className="btn btn-outline btn-lg text-cream" target="_blank" rel="noreferrer">
                Get the WhatsApp link
              </a>
            </div>
            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold text-muted-dark">
              <li className="flex items-center gap-2">
                <Dot className="bg-amber" />
                {prices.baithak != null ? `${rs(prices.baithak)} per baithak` : "Small per-baithak fee"}
              </li>
              <li className="flex items-center gap-2">
                <Dot className="bg-pink" />
                Real mentors
              </li>
              <li className="flex items-center gap-2">
                <Dot className="bg-mint" />
                Built in Pakistan
              </li>
            </ul>
          </div>
          <Arch color="mint" className="mx-auto flex aspect-[4/5] w-full max-w-sm items-end justify-center p-8 pt-16">
            <ChaiMascot className="w-full" />
          </Arch>
        </div>
      </section>

      {/* Next baithaks (from the portal) */}
      {events.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pb-16">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <h2 className="font-display text-3xl sm:text-4xl">
              Next <span className="text-pink">baithaks</span>
            </h2>
            <Link href="/events" className="text-sm font-bold text-amber hover:underline">
              See all events →
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {events.map((e) => (
              <EventCard key={e.id} event={e} />
            ))}
          </div>
        </section>
      )}

      {/* 2. Who it's for */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="font-display text-3xl sm:text-4xl">
          Who it&apos;s <span className="text-pink">for</span>
        </h2>
        <p className="mt-2 max-w-xl text-muted-dark">18 to 30, starting something or stuck with it.</p>
        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          <AudienceArch title="Students" color="pink">
            <Character look="dupatta" skin="light" shirt="#14110F" />
          </AudienceArch>
          <AudienceArch title="Freelancers" color="mint">
            <Character look="glasses" skin="medium" shirt="#FF4D6D" />
          </AudienceArch>
          <AudienceArch title="Shop owners" color="dark">
            <Character look="topi" skin="deep" shirt="#00C2A8" />
          </AudienceArch>
          <AudienceArch title="Founders" color="amber">
            <Character look="curly" skin="tan" shirt="#14110F" />
          </AudienceArch>
        </div>
      </section>

      {/* 3. About (cream section) */}
      <section className="bg-cream py-16 text-ink">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="max-w-2xl font-display text-3xl sm:text-5xl">
            A little baithak with <span className="text-pink">one good outcome.</span>
          </h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {ABOUT.map((a, i) => (
              <div key={a.title} className="rounded-3xl bg-white p-6">
                <div className="flex items-center justify-between">
                  <span className="font-display text-4xl text-pink">0{i + 1}</span>
                  <IconTile name={a.icon} color="dark" />
                </div>
                <h3 className="mt-5 font-display text-xl">{a.title}</h3>
                <p className="mt-2 text-sm text-muted-light">{a.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Big decision CTA */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid overflow-hidden rounded-[2rem] bg-amber text-ink md:grid-cols-2">
          <div className="p-8 sm:p-12">
            <h2 className="font-display text-3xl leading-tight sm:text-5xl">
              A small baithak before a <span className="text-ink underline decoration-pink decoration-[6px] underline-offset-4">big decision.</span>
            </h2>
            <p className="mt-4 max-w-md font-medium">
              Quitting the job? Registering the company? Taking the loan? Talk it through with people who&apos;ve done
              it first.
            </p>
            <Link href="/events" className="btn btn-dark btn-lg mt-6">
              Reserve a seat
            </Link>
          </div>
          <HunzaSunrise className="h-56 w-full md:h-full" />
        </div>
      </section>

      {/* 5. WhatsApp community */}
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-12 md:grid-cols-2">
        <div>
          <h2 className="font-display text-3xl sm:text-5xl">
            Baithak follows <span className="text-pink">you around.</span>
          </h2>
          <p className="mt-4 max-w-md text-muted-dark">
            The conversation doesn&apos;t stop when the chai finishes. Ask questions, share wins and find out about the next
            baithak in the community chat.
          </p>
          <a href={whatsapp} className="btn btn-amber btn-lg mt-6" target="_blank" rel="noreferrer">
            Join on WhatsApp
          </a>
        </div>
        <div className="rounded-[2rem] bg-mint p-6 text-ink sm:p-8">
          <div className="space-y-3 text-[15px]">
            <Bubble side="left">Kya Sunday ko baithak hai?</Bubble>
            <Bubble side="right">Haan, 5 baje. Aa jao.</Bubble>
            <Bubble side="left">NTN ke liye kya chahiye? 😅</Bubble>
            <Bubble side="right">CNIC, phone number aur 10 minute. Baithak mein kar lete hain.</Bubble>
            <Bubble side="left">Pehli sale ho gayi!! 🎉</Bubble>
          </div>
        </div>
      </section>

      {/* 6. How it works */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="font-display text-3xl sm:text-5xl">
          Three steps. <span className="text-pink">That&apos;s all you need.</span>
        </h2>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <div key={s.title} className="rounded-3xl border-2 border-ink-line bg-ink-card p-6">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-pink font-display text-lg text-ink">
                  {i + 1}
                </span>
                <BrandIcon name={s.icon} className="h-8 w-8 text-mint" />
              </div>
              <h3 className="mt-5 font-display text-2xl">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-dark">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 7. Testimonials */}
      {testimonials.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-12">
          <h2 className="font-display text-3xl sm:text-5xl">
            Young founders <span className="text-pink">seem to like it.</span>
          </h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {testimonials.slice(0, 3).map((t, i) => (
              <figure key={t.id} className={`flex flex-col justify-between rounded-3xl p-6 ${QUOTE_TONES[i % 3]}`}>
                <blockquote className="font-display text-xl leading-snug">&ldquo;{t.quote}&rdquo;</blockquote>
                <figcaption className="mt-6 text-sm font-bold">
                  {t.name}
                  {t.label && <span className="block font-medium opacity-80">{t.label}</span>}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      {/* 8. FAQ */}
      {faq.length > 0 && (
        <section id="faq" className="mx-auto max-w-3xl scroll-mt-20 px-4 py-12">
          <h2 className="font-display text-3xl sm:text-5xl">
            Aao Baithein&apos;s got <span className="text-pink">answers.</span>
          </h2>
          <div className="mt-8 space-y-3">
            {faq.map((f) => (
              <details key={f.id} open={f.openByDefault} className="rounded-2xl border-2 border-ink-line bg-ink-card">
                <summary className="flex items-center justify-between gap-4 p-5 font-bold">
                  {f.question}
                  <span className="faq-plus shrink-0 text-2xl leading-none text-amber transition-transform">+</span>
                </summary>
                <p className="whitespace-pre-line px-5 pb-5 text-muted-dark">{f.answer}</p>
              </details>
            ))}
          </div>
        </section>
      )}

      {/* 9. Final CTA */}
      <section className="mx-auto max-w-6xl px-4 pt-8">
        <div className="overflow-hidden rounded-[2rem] border-2 border-ink-line bg-ink-card">
          <Bunting />
          <div className="flex flex-col items-start gap-6 p-8 sm:p-12 md:flex-row md:items-center md:justify-between">
            <h2 className="max-w-xl font-display text-3xl sm:text-5xl">
              Got an idea that&apos;s stuck? <span className="text-pink">Chal baith.</span>
            </h2>
            <Link href="/join" className="btn btn-amber btn-lg">
              Join the next baithak
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

const ABOUT: { title: string; body: string; icon: IconName }[] = [
  { title: "Spotting the blocker", body: "Is it registration, tax, sales or just nerves? We find the real thing holding you back.", icon: "compass" },
  { title: "Keeping it simple", body: "No jargon, no slides. Plain talk from people who've done it in Pakistan.", icon: "talk" },
  { title: "Finding your next step", body: "You leave with one clear thing to do this week, not a list of fifty.", icon: "peak" },
  { title: "Helping you act on it", body: "The group checks in. When it's done, you tell us and we celebrate.", icon: "briefcase" },
];

const STEPS: { title: string; body: string; icon: IconName }[] = [
  { title: "Join the chat", body: "Sign up, become a member and get the WhatsApp community link.", icon: "talk" },
  { title: "Come sit", body: "Book a seat at a baithak in an office, a café or a Sunday meetup.", icon: "seat" },
  { title: "Build, then travel", body: "Take your idea further, then come on a retreat up north with the community.", icon: "peak" },
];

const QUOTE_TONES = ["bg-pink text-ink", "bg-mint text-ink", "bg-cream text-ink"];

function Dot({ className }: { className: string }) {
  return <span className={`inline-block h-2.5 w-2.5 rounded-full ${className}`} />;
}

function AudienceArch({
  title,
  color,
  children,
}: {
  title: string;
  color: "pink" | "mint" | "dark" | "amber";
  children: React.ReactNode;
}) {
  return (
    <Arch color={color} className="flex aspect-[3/4] flex-col items-center justify-end overflow-hidden px-4 pt-8">
      <p className="font-display text-lg sm:text-xl">{title}</p>
      <div className="mt-2 w-[85%]">{children}</div>
    </Arch>
  );
}

function Bubble({ side, children }: { side: "left" | "right"; children: React.ReactNode }) {
  return (
    <div className={`flex ${side === "right" ? "justify-end" : "justify-start"}`}>
      <p
        className={`max-w-[80%] rounded-2xl px-4 py-2.5 font-medium ${
          side === "right" ? "rounded-br-sm bg-ink text-cream" : "rounded-bl-sm bg-cream text-ink"
        }`}
      >
        {children}
      </p>
    </div>
  );
}

import Link from "next/link";
import { Arch, Wordmark } from "@/components/brand";
import { getCurrentMember } from "@/lib/auth";
import { getSettings } from "@/lib/settings";

export default async function SiteLayout({ children }: LayoutProps<"/">) {
  const [member, settings] = await Promise.all([getCurrentMember(), getSettings()]);
  return (
    <div className="theme-dark flex min-h-dvh flex-col bg-ink text-cream">
      <header className="sticky top-0 z-30 border-b border-ink-line/60 bg-ink">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <Link href="/" className="text-xl sm:text-2xl" aria-label="Aao Baithein home">
            <Wordmark />
          </Link>
          <nav className="flex items-center gap-1 text-sm font-semibold sm:gap-2">
            <Link href="/events" className="btn btn-ghost btn-sm">
              Events
            </Link>
            <Link href={member ? "/account" : "/account/login"} className="btn btn-ghost btn-sm">
              {member ? "My account" : "Log in"}
            </Link>
            {!member && (
              <Link href="/join" className="btn btn-amber btn-sm">
                Join
              </Link>
            )}
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <SiteFooter settings={settings} />
    </div>
  );
}

function SiteFooter({ settings }: { settings: Awaited<ReturnType<typeof getSettings>> }) {
  const follow = [
    { label: "Instagram", href: settings.instagram },
    { label: "TikTok", href: settings.tiktok },
    { label: "WhatsApp community", href: settings.community_link },
  ].filter((l) => l.href);
  return (
    <footer className="mt-16 border-t border-ink-line/60 bg-ink">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 md:grid-cols-[1.3fr_1fr_1fr_1.2fr]">
        <div>
          <Wordmark className="text-4xl sm:text-5xl" />
          <p className="mt-3 font-display text-lg text-muted-dark">Chal baith, baat kar.</p>
          <p className="mt-4 max-w-xs text-sm text-muted-dark">
            A business community for young Pakistanis, built in Pakistan.
          </p>
        </div>
        <div>
          <h2 className="mb-3 text-sm font-bold text-mint">Community</h2>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/events" className="hover:text-amber">
                Upcoming baithaks
              </Link>
            </li>
            <li>
              <Link href="/join" className="hover:text-amber">
                Become a member
              </Link>
            </li>
            <li>
              <Link href="/account" className="hover:text-amber">
                My account
              </Link>
            </li>
            <li>
              <Link href="/#faq" className="hover:text-amber">
                FAQ
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h2 className="mb-3 text-sm font-bold text-mint">Follow</h2>
          <ul className="space-y-2 text-sm">
            {follow.length ? (
              follow.map((l) => (
                <li key={l.label}>
                  <a href={l.href} className="hover:text-amber" target="_blank" rel="noreferrer">
                    {l.label}
                  </a>
                </li>
              ))
            ) : (
              <li className="text-muted-dark">Links coming soon</li>
            )}
          </ul>
        </div>
        <Arch color="mint" className="flex aspect-[4/5] max-h-64 items-center justify-center md:max-h-none">
          <span className="font-display text-[9rem] leading-none text-ink" aria-hidden="true">
            &ldquo;&rdquo;
          </span>
        </Arch>
      </div>
      <p className="pb-8 text-center text-xs text-muted-dark">© {new Date().getFullYear()} Aao Baithein</p>
    </footer>
  );
}

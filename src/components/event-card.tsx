import Link from "next/link";
import { formatDateTime, label, rs } from "@/lib/format";
import type { PublicEvent } from "@/lib/public";

const CARD = {
  pink: "bg-pink text-ink",
  mint: "bg-mint text-ink",
  dark: "bg-ink-card text-cream border-2 border-ink-line",
} as const;

export function EventCard({ event }: { event: PublicEvent }) {
  const tone = CARD[event.cardColor];
  return (
    <Link
      href={`/events/${event.slug}`}
      className={`group flex flex-col justify-between gap-6 rounded-3xl p-6 transition-transform hover:-translate-y-1 ${tone}`}
    >
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-ink px-3 py-1 text-xs font-bold text-cream">{label(event.type)}</span>
          <span className="text-sm font-semibold opacity-80">{event.city}</span>
        </div>
        <h3 className="mt-4 font-display text-2xl leading-tight">{event.title}</h3>
        {event.cardBlurb && <p className="mt-2 text-sm opacity-85">{event.cardBlurb}</p>}
      </div>
      <div className="flex flex-wrap items-end justify-between gap-3 text-sm font-semibold">
        <div>
          <p>{formatDateTime(event.startsAt)}</p>
          <p className="opacity-80">
            {event.seatsLeft > 0 ? `${event.seatsLeft} seats left` : "Full: join the waitlist"}
          </p>
        </div>
        {event.price && (
          <p className="font-display text-xl">
            {event.priceFrom && <span className="text-xs font-sans font-bold">from </span>}
            {event.price.amount === 0 ? "Free" : rs(event.price.amount)}
          </p>
        )}
      </div>
    </Link>
  );
}

import type { Metadata } from "next";
import { Bunting, ChaiMascot } from "@/components/brand";
import { EventCard } from "@/components/event-card";
import { upcomingEvents } from "@/lib/public";

export const metadata: Metadata = { title: "Events" };

export default async function EventsPage() {
  const events = await upcomingEvents();
  const baithaks = events.filter((e) => e.type === "baithak");
  const retreats = events.filter((e) => e.type === "retreat");
  return (
    <>
      <Bunting />
      <div className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="font-display text-4xl sm:text-6xl">
          Upcoming <span className="text-pink">baithaks</span> and retreats
        </h1>
        <p className="mt-3 max-w-xl text-muted-dark">Pick one, reserve a seat, and pay by Easypaisa, JazzCash or bank transfer.</p>

        {events.length === 0 && (
          <div className="mt-10 flex flex-col items-center rounded-3xl border-2 border-ink-line bg-ink-card p-10 text-center">
            <ChaiMascot className="w-32" />
            <p className="mt-4 font-display text-2xl">Chai is brewing.</p>
            <p className="mt-2 text-muted-dark">The next baithak will be announced soon. Join the community to hear first.</p>
          </div>
        )}

        {baithaks.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-4 font-display text-2xl">Baithaks</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {baithaks.map((e) => (
                <EventCard key={e.id} event={e} />
              ))}
            </div>
          </section>
        )}
        {retreats.length > 0 && (
          <section className="mt-12">
            <h2 className="mb-4 font-display text-2xl">Retreats</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {retreats.map((e) => (
                <EventCard key={e.id} event={e} />
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}

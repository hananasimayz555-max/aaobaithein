import { EVENT_STATUSES } from "@/db/schema";
import { Field } from "./admin-ui";
import { SubmitButton } from "./ui";
import { label, rs, toLocalInput } from "@/lib/format";
import { saveEvent } from "@/app/admin/_actions/events";
import type { schema } from "@/db";

type Event = typeof schema.events.$inferSelect;
type Fee = typeof schema.feeStructures.$inferSelect;

export function EventForm({ event, fees, attached }: { event?: Event; fees: Fee[]; attached: number[] }) {
  return (
    <form action={saveEvent} className="space-y-6">
      {event && <input type="hidden" name="id" value={event.id} />}
      <section className="panel space-y-4 p-5">
        <h2 className="font-display text-lg">Details</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Title" className="sm:col-span-2">
            <input name="title" defaultValue={event?.title} className="input" required placeholder="Sunday baithak: your first sale" />
          </Field>
          <Field label="Type">
            <select name="type" defaultValue={event?.type ?? "baithak"} className="input">
              <option value="baithak">Baithak</option>
              <option value="retreat">Retreat</option>
            </select>
          </Field>
          <Field label="Status" hint="Open = bookable on the website. Draft = hidden.">
            <select name="status" defaultValue={event?.status ?? "draft"} className="input">
              {EVENT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {label(s)}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Starts" hint="Pakistan time">
            <input name="startsAt" type="datetime-local" defaultValue={toLocalInput(event?.startsAt)} className="input" required />
          </Field>
          <Field label="Ends (optional)">
            <input name="endsAt" type="datetime-local" defaultValue={toLocalInput(event?.endsAt)} className="input" />
          </Field>
          <Field label="Place">
            <input name="place" defaultValue={event?.place} className="input" required placeholder="Café name, area" />
          </Field>
          <Field label="City">
            <input name="city" defaultValue={event?.city ?? "Islamabad"} className="input" required />
          </Field>
          <Field label="Seat limit">
            <input name="seatLimit" type="number" min={1} defaultValue={event?.seatLimit ?? 20} className="input" required />
          </Field>
          <Field label="Web address" hint="Leave empty to make one from the title">
            <input name="slug" defaultValue={event?.slug} className="input" placeholder="sunday-baithak-june" />
          </Field>
        </div>
        <Field label="Description">
          <textarea name="description" defaultValue={event?.description} className="input min-h-32" />
        </Field>
      </section>

      <section className="panel space-y-3 p-5">
        <h2 className="font-display text-lg">Fees</h2>
        <p className="text-sm text-muted-light">
          Attach one or more fee structures. Each member pays the cheapest one they qualify for. Make new ones in Fees and plans.
        </p>
        {fees.length === 0 ? (
          <p className="text-sm font-semibold">No baithak or retreat fee structures yet.</p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {fees.map((f) => (
              <label key={f.id} className="flex items-start gap-3 rounded-xl border border-cream-line p-3">
                <input type="checkbox" name="feeIds" value={f.id} defaultChecked={attached.includes(f.id)} className="mt-1 accent-[#14110F]" />
                <span className="text-sm">
                  <span className="block font-bold">
                    {f.name} · {rs(f.amount)}
                  </span>
                  <span className="text-muted-light">
                    {label(f.appliesTo)} · {label(f.status)}
                    {f.depositAmount ? ` · deposit ${rs(f.depositAmount)}` : ""}
                  </span>
                </span>
              </label>
            ))}
          </div>
        )}
      </section>

      <section className="panel space-y-4 p-5">
        <h2 className="font-display text-lg">Website card</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Card line" className="sm:col-span-2">
            <input name="cardBlurb" defaultValue={event?.cardBlurb} className="input" placeholder="One line that sells it" />
          </Field>
          <Field label="Card colour">
            <select name="cardColor" defaultValue={event?.cardColor ?? "mint"} className="input">
              <option value="mint">Mint</option>
              <option value="pink">Pink</option>
              <option value="dark">Dark</option>
            </select>
          </Field>
          <label className="flex items-center gap-2 self-end pb-3 text-sm font-semibold">
            <input type="checkbox" name="showOnSite" defaultChecked={event?.showOnSite ?? true} className="h-4 w-4 accent-[#14110F]" />
            Show on the website
          </label>
        </div>
      </section>

      <SubmitButton>{event ? "Save event" : "Create event"}</SubmitButton>
    </form>
  );
}

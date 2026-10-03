import { setBookingStatus } from "@/app/admin/_actions/events";
import { SubmitButton } from "./ui";
import type { BookingStatus } from "@/db/schema";

/** The handful of status moves that make sense from each booking state. */
const MOVES: Record<BookingStatus, { to: BookingStatus; label: string; cls: string }[]> = {
  requested: [
    { to: "confirmed", label: "Confirm", cls: "btn-mint" },
    { to: "waitlisted", label: "Waitlist", cls: "btn-outline" },
    { to: "cancelled", label: "Cancel", cls: "btn-ghost" },
  ],
  waitlisted: [
    { to: "requested", label: "Offer seat", cls: "btn-amber" },
    { to: "confirmed", label: "Confirm", cls: "btn-mint" },
    { to: "cancelled", label: "Cancel", cls: "btn-ghost" },
  ],
  confirmed: [
    { to: "attended", label: "Check in", cls: "btn-amber" },
    { to: "cancelled", label: "Cancel", cls: "btn-ghost" },
  ],
  attended: [{ to: "confirmed", label: "Undo check-in", cls: "btn-ghost" }],
  cancelled: [{ to: "requested", label: "Restore", cls: "btn-ghost" }],
};

export function BookingActions({ id, status, back }: { id: number; status: BookingStatus; back: string }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {MOVES[status].map((m) => (
        <form key={m.to} action={setBookingStatus}>
          <input type="hidden" name="bookingId" value={id} />
          <input type="hidden" name="status" value={m.to} />
          <input type="hidden" name="back" value={back} />
          <SubmitButton
            className={`btn btn-sm ${m.cls}`}
            pendingText="…"
            confirm={m.to === "cancelled" ? "Cancel this booking? Any refund is handled by you." : undefined}
          >
            {m.label}
          </SubmitButton>
        </form>
      ))}
    </div>
  );
}

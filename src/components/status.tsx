import { label } from "@/lib/format";

const TONE: Record<string, string> = {
  active: "badge-mint",
  approved: "badge-mint",
  confirmed: "badge-mint",
  attended: "badge-solid-mint",
  open: "badge-mint",
  completed: "badge-dark",
  pending: "badge-amber",
  requested: "badge-amber",
  waitlisted: "badge-amber",
  draft: "",
  full: "badge-amber",
  rejected: "badge-pink",
  expired: "badge-pink",
  cancelled: "badge-pink",
  closed: "badge-dark",
  archived: "",
};

export function StatusBadge({ status }: { status: string }) {
  return <span className={`badge ${TONE[status] ?? ""}`}>{label(status)}</span>;
}

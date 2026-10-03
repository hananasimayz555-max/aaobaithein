import { getCurrentAdmin } from "@/lib/auth";
import { findMembers } from "@/lib/member-query";

const cell = (v: unknown) => {
  const s = v == null ? "" : v instanceof Date ? v.toISOString().slice(0, 10) : String(v);
  return /[",\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
};

export async function GET(req: Request) {
  const admin = await getCurrentAdmin();
  if (!admin || admin.role !== "admin") return new Response("Not allowed", { status: 401 });
  const p = new URL(req.url).searchParams;
  const rows = await findMembers(
    { status: p.get("status") ?? "", type: p.get("type") ?? "", city: p.get("city") ?? "", tag: p.get("tag") ?? "", q: p.get("q") ?? "" },
    100000,
  );
  const head = ["name", "whatsapp", "city", "age", "segment", "status", "joined", "expires", "tags", "stuck_on", "notes"];
  const lines = rows.map((m) =>
    [m.name, m.whatsapp, m.city, m.age, m.memberType, m.status, m.joinedAt, m.expiresAt, m.tags.join("; "), m.stuckOn, m.notes]
      .map(cell)
      .join(","),
  );
  return new Response([head.join(","), ...lines].join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="aao-baithein-members.csv"`,
    },
  });
}

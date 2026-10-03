import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { count, desc, eq, sum } from "drizzle-orm";
import { db, schema } from "@/db";
import { PageHeader, sp } from "@/components/admin-ui";
import { FeeForm } from "@/components/fee-form";
import { requireAdmin } from "@/lib/auth";
import { formatDateTime, label, rs } from "@/lib/format";

export const metadata: Metadata = { title: "Edit fee" };

export default async function EditFee({ params, searchParams }: PageProps<"/admin/fees/[id]">) {
  await requireAdmin("fees");
  const id = Number((await params).id);
  const q = await searchParams;
  const fee = await db.query.feeStructures.findFirst({ where: eq(schema.feeStructures.id, id) });
  if (!fee) notFound();
  const [history, usage] = await Promise.all([
    db.query.feeHistory.findMany({ where: eq(schema.feeHistory.feeStructureId, id), orderBy: desc(schema.feeHistory.version) }),
    db
      .select({ n: count(), total: sum(schema.payments.amount) })
      .from(schema.payments)
      .where(eq(schema.payments.feeStructureId, id))
      .get(),
  ]);

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        back={{ href: "/admin/fees", label: "Fees and plans" }}
        title={fee.name}
        subtitle={`Version ${fee.version} · ${usage?.n ?? 0} payments (${rs(Number(usage?.total ?? 0))}) used this fee`}
      />
      {sp(q.saved) && <p className="form-ok mb-4">Saved as version {fee.version}.</p>}
      {sp(q.error) === "missing" && <p className="form-error mb-4">Name, amount, billing and applies-to are required.</p>}
      {sp(q.error) === "period" && <p className="form-error mb-4">A custom period needs a number of days.</p>}
      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <FeeForm fee={fee} />
        <aside className="panel self-start">
          <h2 className="border-b border-cream-line p-4 font-display text-lg">History</h2>
          <ul className="divide-y divide-cream-line text-sm">
            {history.map((h) => {
              const s = h.snapshot as { amount?: number; status?: string; billingType?: string };
              return (
                <li key={h.id} className="p-4">
                  <p className="font-semibold">
                    v{h.version} · {rs(s.amount)} · {label(s.billingType)} · {label(s.status)}
                  </p>
                  <p className="text-xs text-muted-light">
                    {h.changedBy}, {formatDateTime(h.createdAt)}
                  </p>
                </li>
              );
            })}
          </ul>
        </aside>
      </div>
    </div>
  );
}

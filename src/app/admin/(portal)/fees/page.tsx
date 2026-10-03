import type { Metadata } from "next";
import Link from "next/link";
import { asc, desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { Empty, Field, PageHeader, sp } from "@/components/admin-ui";
import { StatusBadge } from "@/components/status";
import { SubmitButton } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { currentPrice, describeAudience, isFeeLive } from "@/lib/fees";
import { formatDate, label, rs } from "@/lib/format";
import { saveDiscount, setFeeStatus, toggleDiscount } from "../../_actions/fees";

export const metadata: Metadata = { title: "Fees and plans" };

const GROUPS = [
  { key: "membership", title: "Membership plans" },
  { key: "baithak", title: "Baithak fees" },
  { key: "retreat", title: "Retreat fees" },
] as const;

export default async function FeesPage({ searchParams }: PageProps<"/admin/fees">) {
  await requireAdmin("fees");
  const q = await searchParams;
  const showArchived = sp(q.archived) === "1";
  const [fees, codes] = await Promise.all([
    db.query.feeStructures.findMany({ orderBy: [asc(schema.feeStructures.status), asc(schema.feeStructures.amount)] }),
    db
      .select({ c: schema.discountCodes, feeName: schema.feeStructures.name })
      .from(schema.discountCodes)
      .leftJoin(schema.feeStructures, eq(schema.feeStructures.id, schema.discountCodes.feeStructureId))
      .orderBy(desc(schema.discountCodes.createdAt)),
  ]);
  const visible = fees.filter((f) => showArchived || f.status !== "archived");

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Fees and plans"
        subtitle="Prices on the website and booking forms come from here. Change them any time."
        actions={
          <>
            <Link href={showArchived ? "/admin/fees" : "/admin/fees?archived=1"} className="btn btn-ghost btn-sm">
              {showArchived ? "Hide archived" : "Show archived"}
            </Link>
            <Link href="/admin/fees/new" className="btn btn-amber btn-sm">
              New fee
            </Link>
          </>
        }
      />

      <div className="space-y-6">
        {GROUPS.map((g) => {
          const items = visible.filter((f) => f.appliesTo === g.key);
          return (
            <section key={g.key} className="panel">
              <h2 className="border-b border-cream-line p-4 font-display text-lg">{g.title}</h2>
              {items.length === 0 ? (
                <Empty>None yet.</Empty>
              ) : (
                <ul className="divide-y divide-cream-line">
                  {items.map((f) => {
                    const price = currentPrice(f);
                    const live = isFeeLive(f);
                    return (
                      <li key={f.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <Link href={`/admin/fees/${f.id}`} className="font-bold hover:underline">
                              {f.name}
                            </Link>
                            <StatusBadge status={f.status} />
                            {f.status === "active" && !live && <span className="badge badge-pink">Outside its dates</span>}
                            {price.earlyBird && <span className="badge badge-mint">Early bird on</span>}
                          </div>
                          <p className="mt-0.5 text-sm text-muted-light">
                            {label(f.billingType)}
                            {f.billingType === "custom" && f.customPeriodDays ? ` (${f.customPeriodDays} days)` : ""} · {describeAudience(f)}
                            {f.depositAmount ? ` · deposit ${rs(f.depositAmount)}` : ""}
                            {f.validTo ? ` · until ${formatDate(f.validTo)}` : ""} · v{f.version}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-display text-xl">{rs(price.amount)}</span>
                          <form action={setFeeStatus}>
                            <input type="hidden" name="id" value={f.id} />
                            <input type="hidden" name="back" value={`/admin/fees${showArchived ? "?archived=1" : ""}`} />
                            {f.status === "active" ? (
                              <SubmitButton className="btn btn-ghost btn-sm" name="status" value="archived" pendingText="…" confirm="Archive this fee? It stops showing on the website.">
                                Archive
                              </SubmitButton>
                            ) : (
                              <SubmitButton className="btn btn-mint btn-sm" name="status" value="active" pendingText="…">
                                Activate
                              </SubmitButton>
                            )}
                          </form>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          );
        })}

        <section id="codes" className="panel scroll-mt-6">
          <h2 className="border-b border-cream-line p-4 font-display text-lg">Discount codes</h2>
          {sp(q.error) === "code" && <p className="form-error m-4">Add a code and either a percent or an amount off.</p>}
          {sp(q.error) === "dupe" && <p className="form-error m-4">That code already exists.</p>}
          <form action={saveDiscount} className="grid gap-3 border-b border-cream-line p-4 sm:grid-cols-3 lg:grid-cols-6">
            <Field label="Code">
              <input name="code" className="input uppercase" required placeholder="UNI50" />
            </Field>
            <Field label="% off">
              <input name="percentOff" type="number" min={1} max={100} className="input" />
            </Field>
            <Field label="or Rs off">
              <input name="amountOff" type="number" min={1} className="input" />
            </Field>
            <Field label="Only for">
              <select name="feeStructureId" className="input">
                <option value="">Any fee</option>
                {fees
                  .filter((f) => f.status !== "archived")
                  .map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
              </select>
            </Field>
            <Field label="Valid until">
              <input name="validUntil" type="date" className="input" />
            </Field>
            <Field label="Max uses">
              <input name="maxUses" type="number" min={1} className="input" />
            </Field>
            <div className="sm:col-span-3 lg:col-span-6">
              <SubmitButton className="btn btn-dark btn-sm">Add code</SubmitButton>
            </div>
          </form>
          {codes.length === 0 ? (
            <Empty>No discount codes.</Empty>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Discount</th>
                    <th>For</th>
                    <th>Used</th>
                    <th>Valid until</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {codes.map(({ c, feeName }) => (
                    <tr key={c.id} className={c.active ? "" : "opacity-50"}>
                      <td className="font-bold">{c.code}</td>
                      <td>{c.percentOff ? `${c.percentOff}%` : rs(c.amountOff)}</td>
                      <td>{feeName ?? "Any fee"}</td>
                      <td>
                        {c.uses}
                        {c.maxUses ? ` / ${c.maxUses}` : ""}
                      </td>
                      <td>{c.validUntil ? formatDate(c.validUntil) : "—"}</td>
                      <td>
                        <form action={toggleDiscount}>
                          <input type="hidden" name="id" value={c.id} />
                          <SubmitButton className="btn btn-ghost btn-sm" pendingText="…">
                            {c.active ? "Turn off" : "Turn on"}
                          </SubmitButton>
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

import { BILLING_TYPES, FEE_STATUSES, MEMBER_TYPES } from "@/db/schema";
import type { schema } from "@/db";
import { saveFee } from "@/app/admin/_actions/fees";
import { label, toDateInput } from "@/lib/format";
import { Field } from "./admin-ui";
import { SubmitButton } from "./ui";

type Fee = typeof schema.feeStructures.$inferSelect;

export function FeeForm({ fee }: { fee?: Fee }) {
  return (
    <form action={saveFee} className="space-y-6">
      {fee && <input type="hidden" name="id" value={fee.id} />}
      <section className="panel space-y-4 p-5">
        <h2 className="font-display text-lg">The basics</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" className="sm:col-span-2">
            <input name="name" defaultValue={fee?.name} className="input" required placeholder="Student membership" />
          </Field>
          <Field label="Description" hint="Members see this when they choose a plan" className="sm:col-span-2">
            <input name="description" defaultValue={fee?.description} className="input" />
          </Field>
          <Field label="Amount (PKR)">
            <input name="amount" type="number" min={0} defaultValue={fee?.amount ?? 500} className="input" required />
          </Field>
          <Field label="Applies to">
            <select name="appliesTo" defaultValue={fee?.appliesTo ?? "membership"} className="input">
              <option value="membership">Membership</option>
              <option value="baithak">Baithak seat</option>
              <option value="retreat">Retreat seat</option>
            </select>
          </Field>
          <Field label="Billing" hint="For memberships this sets when it expires">
            <select name="billingType" defaultValue={fee?.billingType ?? "one_time"} className="input">
              {BILLING_TYPES.map((b) => (
                <option key={b} value={b}>
                  {label(b)}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Custom period (days)" hint="Only used with Custom period">
            <input name="customPeriodDays" type="number" min={1} defaultValue={fee?.customPeriodDays ?? ""} className="input" />
          </Field>
          <Field label="Status" hint="Only Active fees show on the website">
            <select name="status" defaultValue={fee?.status ?? "draft"} className="input">
              {FEE_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {label(s)}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </section>

      <section className="panel space-y-4 p-5">
        <div>
          <h2 className="font-display text-lg">Who it&apos;s for</h2>
          <p className="text-sm text-muted-light">Leave everything empty for everyone.</p>
        </div>
        <fieldset>
          <legend className="field-label mb-2">Member types</legend>
          <div className="flex flex-wrap gap-2">
            {MEMBER_TYPES.map((t) => (
              <label key={t} className="flex items-center gap-2 rounded-full border border-cream-line px-3 py-1.5 text-sm font-semibold has-[:checked]:border-ink has-[:checked]:bg-ink has-[:checked]:text-cream">
                <input type="checkbox" name="audienceMemberTypes" value={t} defaultChecked={fee?.audienceMemberTypes.includes(t)} className="sr-only" />
                {label(t)}
              </label>
            ))}
          </div>
        </fieldset>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Minimum age">
            <input name="audienceAgeMin" type="number" min={18} max={30} defaultValue={fee?.audienceAgeMin ?? ""} className="input" />
          </Field>
          <Field label="Maximum age">
            <input name="audienceAgeMax" type="number" min={18} max={30} defaultValue={fee?.audienceAgeMax ?? ""} className="input" />
          </Field>
          <Field label="Cities" hint="Comma separated">
            <input name="audienceCities" defaultValue={fee?.audienceCities.join(", ")} className="input" placeholder="Islamabad, Rawalpindi" />
          </Field>
          <Field label="Member tags" hint="Member needs at least one of these tags">
            <input name="audienceTags" defaultValue={fee?.audienceTags.join(", ")} className="input" placeholder="alumni, partner-uni" />
          </Field>
        </div>
      </section>

      <section className="panel space-y-4 p-5">
        <h2 className="font-display text-lg">Dates, early bird and deposit</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Valid from">
            <input name="validFrom" type="date" defaultValue={toDateInput(fee?.validFrom)} className="input" />
          </Field>
          <Field label="Valid until">
            <input name="validTo" type="date" defaultValue={toDateInput(fee?.validTo)} className="input" />
          </Field>
          <Field label="Early-bird price (PKR)">
            <input name="earlyBirdAmount" type="number" min={0} defaultValue={fee?.earlyBirdAmount ?? ""} className="input" />
          </Field>
          <Field label="Early bird ends">
            <input name="earlyBirdUntil" type="date" defaultValue={toDateInput(fee?.earlyBirdUntil)} className="input" />
          </Field>
          <Field label="Deposit (PKR)" hint="Baithaks and retreats: pay this to hold a seat, the rest later">
            <input name="depositAmount" type="number" min={0} defaultValue={fee?.depositAmount ?? ""} className="input" />
          </Field>
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton>{fee ? "Save as new version" : "Create fee"}</SubmitButton>
        {fee && <p className="text-sm text-muted-light">Past payments keep the amount they were charged.</p>}
      </div>
    </form>
  );
}

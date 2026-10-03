import type { Metadata } from "next";
import { asc } from "drizzle-orm";
import { db, schema } from "@/db";
import { Field, PageHeader, sp } from "@/components/admin-ui";
import { SubmitButton } from "@/components/ui";
import { getCurrentAdmin, requireAdmin } from "@/lib/auth";
import { getSettings, SETTING_KEYS, type SettingKey } from "@/lib/settings";
import { addAdmin, changeOwnPassword, saveSettings, updateAdmin } from "../../_actions/settings";

export const metadata: Metadata = { title: "Settings" };

const ERRORS: Record<string, string> = {
  admin: "Admin users need a name, a valid email and a password of at least 8 characters.",
  exists: "Someone already uses that email.",
  self: "You can't remove your own admin access.",
  last: "There must always be at least one active admin.",
  current: "Your current password is wrong.",
  short: "New password must be at least 8 characters.",
};

export default async function SettingsPage({ searchParams }: PageProps<"/admin/settings">) {
  await requireAdmin("settings");
  const q = await searchParams;
  const me = (await getCurrentAdmin())!;
  const [settings, admins] = await Promise.all([getSettings(), db.query.adminUsers.findMany({ orderBy: asc(schema.adminUsers.createdAt) })]);
  const error = ERRORS[sp(q.error)];
  const saved = sp(q.saved);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader title="Settings" />
      {error && <p className="form-error">{error}</p>}
      {saved && <p className="form-ok">Saved.</p>}

      <form action={saveSettings} className="panel space-y-4 p-5">
        <h2 className="font-display text-lg">Payments and links</h2>
        <p className="text-sm text-muted-light">Members see these payment accounts when they pay. Empty ones are hidden.</p>
        <div className="grid gap-4 sm:grid-cols-2">
          {(Object.keys(SETTING_KEYS) as SettingKey[]).map((key) => (
            <Field key={key} label={SETTING_KEYS[key]} className={key === "bank" ? "sm:col-span-2" : ""}>
              <input name={key} defaultValue={settings[key]} className="input" />
            </Field>
          ))}
        </div>
        <SubmitButton>Save settings</SubmitButton>
      </form>

      <section className="panel">
        <div className="border-b border-cream-line p-4">
          <h2 className="font-display text-lg">Admin users and roles</h2>
          <p className="text-sm text-muted-light">Admins can do everything. Helpers can only use the dashboard, payments and bookings (check-in).</p>
        </div>
        <ul className="divide-y divide-cream-line">
          {admins.map((a) => (
            <li key={a.id} className="p-4">
              <form action={updateAdmin} className="grid items-end gap-3 sm:grid-cols-[1.4fr_auto_1fr_auto_auto]">
                <input type="hidden" name="id" value={a.id} />
                <div className="min-w-0">
                  <p className="font-bold">
                    {a.name} {a.id === me.id && <span className="badge ml-1">You</span>}
                  </p>
                  <p className="truncate text-sm text-muted-light">{a.email}</p>
                </div>
                <select name="role" defaultValue={a.role} className="input w-auto" aria-label="Role">
                  <option value="admin">Admin</option>
                  <option value="helper">Helper</option>
                </select>
                <input name="password" type="password" placeholder="New password (optional)" className="input" autoComplete="new-password" />
                <label className="flex items-center gap-2 pb-3 text-sm font-semibold">
                  <input type="checkbox" name="active" defaultChecked={a.active} className="accent-[#14110F]" /> Active
                </label>
                <SubmitButton className="btn btn-dark btn-sm mb-1">Save</SubmitButton>
              </form>
            </li>
          ))}
        </ul>
        <form action={addAdmin} className="grid gap-3 border-t border-cream-line p-4 sm:grid-cols-2">
          <h3 className="font-display sm:col-span-2">Add someone</h3>
          <Field label="Name">
            <input name="name" className="input" required />
          </Field>
          <Field label="Email">
            <input name="email" type="email" className="input" required />
          </Field>
          <Field label="Temporary password" hint="At least 8 characters. Ask them to change it.">
            <input name="password" type="password" className="input" required minLength={8} autoComplete="new-password" />
          </Field>
          <Field label="Role">
            <select name="role" defaultValue="helper" className="input">
              <option value="helper">Helper</option>
              <option value="admin">Admin</option>
            </select>
          </Field>
          <div className="sm:col-span-2">
            <SubmitButton className="btn btn-amber btn-sm">Add user</SubmitButton>
          </div>
        </form>
      </section>

      <form action={changeOwnPassword} className="panel grid gap-3 p-5 sm:grid-cols-2">
        <h2 className="font-display text-lg sm:col-span-2">Change my password</h2>
        <Field label="Current password">
          <input name="current" type="password" className="input" required autoComplete="current-password" />
        </Field>
        <Field label="New password">
          <input name="next" type="password" className="input" required minLength={8} autoComplete="new-password" />
        </Field>
        <div className="sm:col-span-2">
          <SubmitButton className="btn btn-dark btn-sm">Change password</SubmitButton>
        </div>
      </form>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { count } from "drizzle-orm";
import { db, schema } from "@/db";
import { MEMBER_TYPES } from "@/db/schema";
import { Empty, FilterPills, PageHeader, sp } from "@/components/admin-ui";
import { StatusBadge } from "@/components/status";
import { requireAdmin } from "@/lib/auth";
import { refreshExpiries } from "@/lib/domain";
import { displayWhatsapp, formatDate, label } from "@/lib/format";
import { findMembers } from "@/lib/member-query";

export const metadata: Metadata = { title: "Members" };

export default async function MembersPage({ searchParams }: PageProps<"/admin/members">) {
  await requireAdmin("members");
  await refreshExpiries();
  const q = await searchParams;
  const f = { status: sp(q.status), type: sp(q.type), city: sp(q.city), tag: sp(q.tag), q: sp(q.q) };
  const [members, statusCounts, cities] = await Promise.all([
    findMembers(f),
    db.select({ status: schema.members.status, n: count() }).from(schema.members).groupBy(schema.members.status),
    db.selectDistinct({ city: schema.members.city }).from(schema.members).orderBy(schema.members.city),
  ]);
  const total = statusCounts.reduce((a, c) => a + c.n, 0);
  const n = (s: string) => statusCounts.find((c) => c.status === s)?.n ?? 0;
  const exportQs = new URLSearchParams(Object.entries(f).filter(([, v]) => v));

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Members"
        subtitle={`${total} people have signed up`}
        actions={
          <a href={`/admin/members/export?${exportQs}`} className="btn btn-outline btn-sm">
            Export CSV
          </a>
        }
      />
      <div className="mb-4 space-y-3">
        <FilterPills
          base="/admin/members"
          param="status"
          value={f.status}
          keep={{ type: f.type, city: f.city, tag: f.tag, q: f.q }}
          options={[
            { value: "", label: "All", count: total },
            { value: "pending", label: "Pending", count: n("pending") },
            { value: "active", label: "Active", count: n("active") },
            { value: "expired", label: "Expired", count: n("expired") },
          ]}
        />
        <form className="flex flex-wrap gap-2">
          {f.status && <input type="hidden" name="status" value={f.status} />}
          <input name="q" defaultValue={f.q} placeholder="Search name, number or blocker" className="input sm:w-64" />
          <select name="type" defaultValue={f.type} className="input w-auto">
            <option value="">All segments</option>
            {MEMBER_TYPES.map((t) => (
              <option key={t} value={t}>
                {label(t)}
              </option>
            ))}
          </select>
          <select name="city" defaultValue={f.city} className="input w-auto">
            <option value="">All cities</option>
            {cities.map((c) => (
              <option key={c.city} value={c.city}>
                {c.city}
              </option>
            ))}
          </select>
          <input name="tag" defaultValue={f.tag} placeholder="Tag" className="input w-32" />
          <button className="btn btn-dark btn-sm">Filter</button>
          {(f.q || f.type || f.city || f.tag) && (
            <Link href={`/admin/members${f.status ? `?status=${f.status}` : ""}`} className="btn btn-ghost btn-sm">
              Clear
            </Link>
          )}
        </form>
      </div>

      <div className="panel overflow-x-auto">
        {members.length === 0 ? (
          <Empty>No members match these filters.</Empty>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Member</th>
                <th>Segment</th>
                <th>City</th>
                <th>Status</th>
                <th className="hidden md:table-cell">Expires</th>
                <th className="hidden lg:table-cell">Tags</th>
                <th className="hidden md:table-cell">Signed up</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id}>
                  <td>
                    <Link href={`/admin/members/${m.id}`} className="font-bold hover:underline">
                      {m.name}
                    </Link>
                    <span className="block text-xs text-muted-light">
                      {displayWhatsapp(m.whatsapp)} · {m.age}
                    </span>
                  </td>
                  <td>{label(m.memberType)}</td>
                  <td>{m.city}</td>
                  <td>
                    <StatusBadge status={m.status} />
                  </td>
                  <td className="hidden md:table-cell">{m.expiresAt ? formatDate(m.expiresAt) : "—"}</td>
                  <td className="hidden lg:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {m.tags.map((t) => (
                        <Link key={t} href={`/admin/members?tag=${encodeURIComponent(t)}`} className="badge">
                          {t}
                        </Link>
                      ))}
                    </div>
                  </td>
                  <td className="hidden md:table-cell">{formatDate(m.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

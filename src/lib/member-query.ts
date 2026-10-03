import "server-only";
import { and, desc, eq, like, or, type SQL } from "drizzle-orm";
import { db, schema } from "@/db";
import { MEMBER_STATUSES, MEMBER_TYPES, type MemberStatus, type MemberType } from "@/db/schema";

export type MemberFilters = { status: string; type: string; city: string; tag: string; q: string };

export function memberWhere(f: MemberFilters) {
  const where: SQL[] = [];
  if ((MEMBER_STATUSES as readonly string[]).includes(f.status)) where.push(eq(schema.members.status, f.status as MemberStatus));
  if ((MEMBER_TYPES as readonly string[]).includes(f.type)) where.push(eq(schema.members.memberType, f.type as MemberType));
  if (f.city) where.push(like(schema.members.city, f.city));
  if (f.tag) where.push(like(schema.members.tags, `%"${f.tag.toLowerCase()}"%`));
  if (f.q) {
    const digits = f.q.replace(/\D/g, "");
    where.push(
      or(
        like(schema.members.name, `%${f.q}%`),
        like(schema.members.stuckOn, `%${f.q}%`),
        ...(digits.length >= 3 ? [like(schema.members.whatsapp, `%${digits.replace(/^0/, "")}%`)] : []),
      )!,
    );
  }
  return where.length ? and(...where) : undefined;
}

export function findMembers(f: MemberFilters, limit = 500) {
  return db.query.members.findMany({
    where: memberWhere(f),
    orderBy: desc(schema.members.createdAt),
    columns: { pinHash: false },
    limit,
  });
}

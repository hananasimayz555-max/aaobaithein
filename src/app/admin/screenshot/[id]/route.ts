import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { getCurrentAdmin } from "@/lib/auth";

export async function GET(_req: Request, ctx: RouteContext<"/admin/screenshot/[id]">) {
  if (!(await getCurrentAdmin())) return new Response("Not allowed", { status: 401 });
  const { id } = await ctx.params;
  const row = await db.query.payments.findFirst({
    where: eq(schema.payments.id, Number(id)),
    columns: { screenshot: true },
  });
  const match = row?.screenshot?.match(/^data:(image\/(?:jpeg|png|webp));base64,(.+)$/);
  if (!match) return new Response("Not found", { status: 404 });
  return new Response(Buffer.from(match[2], "base64"), {
    headers: { "Content-Type": match[1], "Cache-Control": "private, max-age=86400" },
  });
}

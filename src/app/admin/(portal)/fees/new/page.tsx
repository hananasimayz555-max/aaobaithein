import type { Metadata } from "next";
import { PageHeader, sp } from "@/components/admin-ui";
import { FeeForm } from "@/components/fee-form";
import { requireAdmin } from "@/lib/auth";

export const metadata: Metadata = { title: "New fee" };

export default async function NewFee({ searchParams }: PageProps<"/admin/fees/new">) {
  await requireAdmin("fees");
  const error = sp((await searchParams).error);
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader back={{ href: "/admin/fees", label: "Fees and plans" }} title="New fee" />
      {error === "missing" && <p className="form-error mb-4">Name, amount, billing and applies-to are required.</p>}
      {error === "period" && <p className="form-error mb-4">A custom period needs a number of days.</p>}
      <FeeForm />
    </div>
  );
}

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Bunting, Wordmark } from "@/components/brand";
import { AdminLoginForm } from "@/components/admin-login-form";
import { getCurrentAdmin } from "@/lib/auth";

export const metadata: Metadata = { title: "Admin login", robots: { index: false } };

export default async function AdminLogin() {
  if (await getCurrentAdmin()) redirect("/admin");
  return (
    <div className="flex min-h-dvh flex-col bg-ink">
      <Bunting />
      <div className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm">
          <div className="mb-6 text-center">
            <Wordmark className="text-4xl" />
            <p className="mt-2 text-sm font-semibold text-muted-dark">Admin portal</p>
          </div>
          <div className="rounded-3xl bg-cream p-6 text-ink">
            <AdminLoginForm />
          </div>
        </div>
      </div>
    </div>
  );
}

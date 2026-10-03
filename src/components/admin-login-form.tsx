"use client";

import { useActionState } from "react";
import { adminLogIn } from "@/app/admin/_actions/auth";
import { FormMessage, SubmitButton, type FormState } from "./ui";

export function AdminLoginForm() {
  const [state, action] = useActionState<FormState, FormData>(adminLogIn, undefined);
  return (
    <form action={action} className="space-y-4">
      <label className="field">
        <span className="field-label">Email</span>
        <input name="email" type="email" className="input" required autoComplete="username" />
      </label>
      <label className="field">
        <span className="field-label">Password</span>
        <input name="password" type="password" className="input" required autoComplete="current-password" />
      </label>
      <FormMessage state={state} />
      <SubmitButton className="btn btn-amber w-full" pendingText="Signing in…">
        Sign in
      </SubmitButton>
    </form>
  );
}

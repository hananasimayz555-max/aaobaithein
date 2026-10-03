"use client";

import { useActionState, useState } from "react";
import {
  bookEvent,
  logIn,
  signUp,
  submitEventPayment,
  submitFeedback,
  submitMembershipPayment,
} from "@/app/(site)/actions";
import { FormMessage, SubmitButton, type FormState } from "./ui";

const TYPES = [
  { value: "student", label: "Student" },
  { value: "freelancer", label: "Freelancer" },
  { value: "shop_owner", label: "Shop owner" },
  { value: "founder", label: "Founder" },
  { value: "professional", label: "Young professional" },
];

export function JoinForm() {
  const [state, action] = useActionState<FormState, FormData>(signUp, undefined);
  return (
    <form action={action} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="field">
          <span className="field-label">Your name</span>
          <input name="name" className="input" required autoComplete="name" />
        </label>
        <label className="field">
          <span className="field-label">WhatsApp number</span>
          <input name="whatsapp" className="input" required inputMode="tel" placeholder="03XX XXXXXXX" autoComplete="tel" />
        </label>
        <label className="field">
          <span className="field-label">City</span>
          <input name="city" className="input" required placeholder="Islamabad" />
        </label>
        <label className="field">
          <span className="field-label">Age</span>
          <input name="age" className="input" required type="number" min={18} max={30} inputMode="numeric" />
        </label>
      </div>
      <fieldset className="space-y-2">
        <legend className="field-label mb-2">Who are you right now?</legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {TYPES.map((t) => (
            <label key={t.value} className="choice">
              <input type="radio" name="memberType" value={t.value} required />
              <span className="font-semibold">{t.label}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <label className="field">
        <span className="field-label">What&apos;s stuck in your business?</span>
        <textarea
          name="stuckOn"
          className="input"
          placeholder="Registration? Tax? First customers? Just scared to start? Sab chalega."
        />
      </label>
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="field">
          <span className="field-label">Choose a PIN</span>
          <input name="pin" className="input" required inputMode="numeric" pattern="\d{4,8}" type="password" />
          <span className="field-hint">4 to 8 digits. You&apos;ll log in with your number and this PIN.</span>
        </label>
        <label className="field">
          <span className="field-label">Type the PIN again</span>
          <input name="pinConfirm" className="input" required inputMode="numeric" pattern="\d{4,8}" type="password" />
        </label>
      </div>
      <FormMessage state={state} />
      <SubmitButton className="btn btn-amber btn-lg w-full sm:w-auto" pendingText="Signing you up…">
        Sign up and continue
      </SubmitButton>
    </form>
  );
}

export function LoginForm({ next }: { next: string }) {
  const [state, action] = useActionState<FormState, FormData>(logIn, undefined);
  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="next" value={next} />
      <label className="field">
        <span className="field-label">WhatsApp number</span>
        <input name="whatsapp" className="input" required inputMode="tel" placeholder="03XX XXXXXXX" autoComplete="tel" />
      </label>
      <label className="field">
        <span className="field-label">PIN</span>
        <input name="pin" className="input" required inputMode="numeric" type="password" autoComplete="current-password" />
      </label>
      <FormMessage state={state} />
      <SubmitButton className="btn btn-amber btn-lg w-full" pendingText="Checking…">
        Log in
      </SubmitButton>
    </form>
  );
}

/** Resizes the chosen image in the browser so uploads stay small on mobile data. */
function ScreenshotInput() {
  const [preview, setPreview] = useState<string>("");
  const [busy, setBusy] = useState(false);

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const bitmap = await createImageBitmap(file);
      const scale = Math.min(1, 1400 / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(bitmap.width * scale);
      canvas.height = Math.round(bitmap.height * scale);
      canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      let quality = 0.75;
      let url = canvas.toDataURL("image/jpeg", quality);
      while (url.length > 2_500_000 && quality > 0.3) {
        quality -= 0.15;
        url = canvas.toDataURL("image/jpeg", quality);
      }
      setPreview(url);
    } catch {
      setPreview("");
      alert("Couldn't read that image. Please try a different screenshot.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="field">
      <span className="field-label">Payment screenshot</span>
      <label className="choice cursor-pointer justify-between">
        <span className="font-semibold">{busy ? "Preparing…" : preview ? "Change screenshot" : "Choose screenshot"}</span>
        <input type="file" accept="image/*" className="sr-only" onChange={onChange} />
        <span className="btn btn-outline btn-sm">Upload</span>
      </label>
      <input type="hidden" name="screenshot" value={preview} />
      {preview && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={preview} alt="Your payment screenshot" className="mt-2 max-h-64 w-auto rounded-xl border-2 border-ink-line" />
      )}
    </div>
  );
}

export type PayAccounts = { easypaisa: string; jazzcash: string; bank: string };

function PaymentFields({ accounts }: { accounts: PayAccounts }) {
  const methods = [
    { value: "easypaisa", label: "Easypaisa", detail: accounts.easypaisa },
    { value: "jazzcash", label: "JazzCash", detail: accounts.jazzcash },
    { value: "bank", label: "Bank transfer", detail: accounts.bank },
  ].filter((m) => m.detail);
  return (
    <>
      <fieldset className="space-y-2">
        <legend className="field-label mb-2">Send the amount to one of these, then pick it here</legend>
        {methods.map((m, i) => (
          <label key={m.value} className="choice items-start">
            <input type="radio" name="method" value={m.value} required defaultChecked={i === 0} className="mt-1" />
            <span>
              <span className="block font-bold">{m.label}</span>
              <span className="block break-all text-sm text-muted-dark">{m.detail}</span>
            </span>
          </label>
        ))}
      </fieldset>
      <label className="field">
        <span className="field-label">Transaction ID (optional)</span>
        <input name="reference" className="input" placeholder="e.g. 0123456789" />
      </label>
      <ScreenshotInput />
    </>
  );
}

export type PlanOption = { id: number; name: string; description: string; amount: number; regular: number; period: string };

export function MembershipPaymentForm({ plans, accounts }: { plans: PlanOption[]; accounts: PayAccounts }) {
  const [state, action] = useActionState<FormState, FormData>(submitMembershipPayment, undefined);
  return (
    <form action={action} className="space-y-6">
      <fieldset className="space-y-2">
        <legend className="field-label mb-2">Pick your plan</legend>
        {plans.map((p, i) => (
          <label key={p.id} className="choice items-start justify-between">
            <span className="flex items-start gap-3">
              <input type="radio" name="feeId" value={p.id} defaultChecked={i === 0} required className="mt-1" />
              <span>
                <span className="block font-bold">{p.name}</span>
                {p.description && <span className="block text-sm text-muted-dark">{p.description}</span>}
              </span>
            </span>
            <span className="shrink-0 text-right">
              <span className="block font-display text-lg">Rs {p.amount.toLocaleString("en-PK")}</span>
              {p.regular !== p.amount && (
                <span className="block text-xs text-muted-dark line-through">Rs {p.regular.toLocaleString("en-PK")}</span>
              )}
              <span className="block text-xs text-muted-dark">{p.period}</span>
            </span>
          </label>
        ))}
      </fieldset>
      <label className="field">
        <span className="field-label">Discount code (optional)</span>
        <input name="discountCode" className="input uppercase" autoCapitalize="characters" />
      </label>
      <PaymentFields accounts={accounts} />
      <FormMessage state={state} />
      <SubmitButton className="btn btn-amber btn-lg w-full sm:w-auto" pendingText="Sending…">
        Submit payment
      </SubmitButton>
    </form>
  );
}

export function BookForm({ eventId, label }: { eventId: number; label: string }) {
  const [state, action] = useActionState<FormState, FormData>(bookEvent, undefined);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="eventId" value={eventId} />
      <label className="field">
        <span className="field-label">Discount code (optional)</span>
        <input name="discountCode" className="input uppercase" autoCapitalize="characters" />
      </label>
      <FormMessage state={state} />
      <SubmitButton className="btn btn-amber btn-lg w-full" pendingText="Booking…">
        {label}
      </SubmitButton>
    </form>
  );
}

export function EventPaymentForm({
  bookingId,
  balance,
  deposit,
  accounts,
}: {
  bookingId: number;
  balance: number;
  deposit: number | null;
  accounts: PayAccounts;
}) {
  const [state, action] = useActionState<FormState, FormData>(submitEventPayment, undefined);
  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="bookingId" value={bookingId} />
      {deposit ? (
        <fieldset className="space-y-2">
          <legend className="field-label mb-2">How much are you paying now?</legend>
          <label className="choice justify-between">
            <span className="flex items-center gap-3">
              <input type="radio" name="amountChoice" value="deposit" defaultChecked />
              <span className="font-bold">Deposit to hold my seat</span>
            </span>
            <span className="font-display">Rs {deposit.toLocaleString("en-PK")}</span>
          </label>
          <label className="choice justify-between">
            <span className="flex items-center gap-3">
              <input type="radio" name="amountChoice" value="full" />
              <span className="font-bold">Full amount</span>
            </span>
            <span className="font-display">Rs {balance.toLocaleString("en-PK")}</span>
          </label>
        </fieldset>
      ) : (
        <p className="rounded-2xl bg-ink px-4 py-3 font-semibold">
          Amount to pay: <span className="font-display text-amber">Rs {balance.toLocaleString("en-PK")}</span>
        </p>
      )}
      <PaymentFields accounts={accounts} />
      <FormMessage state={state} />
      <SubmitButton className="btn btn-amber btn-lg w-full sm:w-auto" pendingText="Sending…">
        Submit payment
      </SubmitButton>
    </form>
  );
}

export function FeedbackForm({ token }: { token: string }) {
  const [state, action] = useActionState<FormState, FormData>(submitFeedback, undefined);
  if (state?.ok) return <FormMessage state={state} />;
  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="token" value={token} />
      <fieldset>
        <legend className="field-label mb-2">How was it?</legend>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <label key={n} className="choice flex-1 justify-center">
              <input type="radio" name="rating" value={n} required className="sr-only" />
              <span className="font-display text-xl">{n}</span>
            </label>
          ))}
        </div>
        <p className="field-hint mt-1">1 = not for me, 5 = loved it</p>
      </fieldset>
      <label className="field">
        <span className="field-label">What should we do better?</span>
        <textarea name="comment" className="input" />
      </label>
      <label className="field">
        <span className="field-label">One line about your experience (optional)</span>
        <textarea
          name="testimonial"
          className="input"
          maxLength={400}
          placeholder="We may show this on the website with your first name, age and city."
        />
      </label>
      <FormMessage state={state} />
      <SubmitButton className="btn btn-amber btn-lg" pendingText="Sending…">
        Send feedback
      </SubmitButton>
    </form>
  );
}

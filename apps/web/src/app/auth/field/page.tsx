"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import { useAuth } from "@/components/auth-provider";
import { homePathForRole } from "@/lib/auth/routes";

export default function FieldSignInPage() {
  const { signInField } = useAuth();
  const router = useRouter();
  const [staffId, setStaffId] = useState("BTL-0031");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const user = await signInField(staffId, pin);
      router.replace(homePathForRole(user.role));
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to sign in");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-10">
      <Image
        src="/logo-ghana.png"
        alt="GBfoods"
        width={150}
        height={52}
        className="mb-8 h-12 w-auto"
      />
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">Stock Control</p>
      <h1 className="font-display mt-3 text-3xl font-semibold text-foreground">Field sign in</h1>
      <p className="mt-2 text-sm text-brand-ink">Enter your staff ID and PIN to open your depot.</p>

      <form
        onSubmit={onSubmit}
        className="mt-8 space-y-4 rounded-3xl border border-border bg-surface p-6"
      >
        <label className="block space-y-2 text-sm">
          <span className="font-medium text-brand-ink">Staff ID</span>
          <input
            className="w-full rounded-xl border border-border bg-background px-3 py-3 outline-none focus:border-brand"
            value={staffId}
            onChange={(event) => setStaffId(event.target.value)}
            autoComplete="username"
            required
          />
        </label>
        <label className="block space-y-2 text-sm">
          <span className="font-medium text-brand-ink">PIN</span>
          <input
            className="w-full rounded-xl border border-border bg-background px-3 py-3 outline-none focus:border-brand"
            value={pin}
            onChange={(event) => setPin(event.target.value)}
            type="password"
            inputMode="numeric"
            autoComplete="current-password"
            required
          />
        </label>
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-white hover:bg-brand-hover disabled:opacity-60"
        >
          {isSubmitting ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="mt-6 text-sm text-brand-ink">
        Ops or GBfoods?{" "}
        <Link href="/auth/ops" className="font-medium text-brand hover:text-brand-hover">
          Use email sign in
        </Link>
      </p>
    </main>
  );
}

"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import { useAuth } from "@/components/auth-provider";
import { homePathForRole } from "@/lib/auth/routes";

export default function OpsSignInPage() {
  const { signInOps } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("admin@gbfoods.local");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const user = await signInOps(email, password);
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
      <h1 className="font-display mt-3 text-3xl font-semibold text-foreground">Ops and client</h1>
      <p className="mt-2 text-sm text-brand-ink">
        Sign in with email for operations, quality, admin, or GBfoods review.
      </p>

      <form
        onSubmit={onSubmit}
        className="mt-8 space-y-4 rounded-3xl border border-border bg-surface p-6"
      >
        <label className="block space-y-2 text-sm">
          <span className="font-medium text-brand-ink">Email</span>
          <input
            className="w-full rounded-xl border border-border bg-background px-3 py-3 outline-none focus:border-brand"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            type="email"
            autoComplete="username"
            required
          />
        </label>
        <label className="block space-y-2 text-sm">
          <span className="font-medium text-brand-ink">Password</span>
          <input
            className="w-full rounded-xl border border-border bg-background px-3 py-3 outline-none focus:border-brand"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            type="password"
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
        Field crew?{" "}
        <Link href="/auth/field" className="font-medium text-brand hover:text-brand-hover">
          Use staff ID and PIN
        </Link>
      </p>
    </main>
  );
}

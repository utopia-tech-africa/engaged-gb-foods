"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

      <Card className="mt-8">
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="staff-id">Staff ID</Label>
              <Input
                id="staff-id"
                value={staffId}
                onChange={(event) => setStaffId(event.target.value)}
                autoComplete="username"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pin">PIN</Label>
              <Input
                id="pin"
                value={pin}
                onChange={(event) => setPin(event.target.value)}
                type="password"
                inputMode="numeric"
                autoComplete="current-password"
                required
              />
            </div>
            {error ? <p className="text-sm text-danger">{error}</p> : null}
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? "Signing in…" : "Sign in"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <p className="mt-6 text-sm text-brand-ink">
        Ops or GBfoods?{" "}
        <Link href="/auth/ops" className="font-medium text-brand hover:text-brand-hover">
          Use email sign in
        </Link>
      </p>
    </main>
  );
}

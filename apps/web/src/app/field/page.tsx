"use client";

import Link from "next/link";

import { useAuth } from "@/components/auth-provider";
import { RequireAuth } from "@/components/require-auth";
import { ShellFrame } from "@/components/shell-frame";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useGetMeDepots } from "@/lib/api/generated/assignments/assignments";
import type { UserRole } from "@/lib/auth/types";
import { cn } from "@/lib/utils";

const FIELD_ROLES: UserRole[] = ["qc", "handler", "cluster_supervisor", "regional_supervisor"];

export default function FieldHomePage() {
  const { user, accessToken } = useAuth();
  const depotsQuery = useGetMeDepots({ query: { enabled: Boolean(accessToken) } });
  const depots = depotsQuery.data ?? [];
  const loading = depotsQuery.isLoading;
  const error = depotsQuery.error?.message ?? null;

  return (
    <RequireAuth roles={FIELD_ROLES}>
      <ShellFrame title="Field workspace" eyebrow="Field">
        <div className="space-y-6">
          <p className="max-w-xl text-base text-brand-ink">
            Signed in as {user?.fullName}
            {user?.staffId ? ` · ${user.staffId}` : ""}. Check in at a depot or capture stock lots
            with batch evidence for today&apos;s visit.
          </p>

          <div className="flex flex-wrap gap-2">
            <Link href="/field/stock" className={cn(buttonVariants())}>
              Today&apos;s stock lots
            </Link>
            {user?.role !== "handler" ? (
              <Link
                href="/field/escalations/new"
                className={cn(buttonVariants({ variant: "outline" }))}
              >
                Report an exception
              </Link>
            ) : null}
          </div>

          {loading ? <p className="text-sm text-brand-ink/70">Loading assigned depots…</p> : null}
          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          {!loading && !error && depots.length === 0 ? (
            <p className="text-sm text-brand-ink/70">
              No depots in your assignment scope yet. Ask ops to link your account to a distributor.
            </p>
          ) : null}

          <ul className="grid gap-3 sm:grid-cols-2">
            {depots.map((depot) => (
              <li key={depot.id}>
                <Card className="transition hover:ring-brand/40">
                  <CardContent className="p-0">
                    <Link
                      href={`/field/check-in?depotId=${encodeURIComponent(depot.id)}`}
                      className="block p-4"
                    >
                      <p className="font-semibold text-brand-ink">{depot.name}</p>
                      <p className="mt-1 text-xs font-medium uppercase tracking-wide text-brand">
                        {depot.code}
                      </p>
                      <p className="mt-2 text-sm text-brand-ink/70">{depot.address}</p>
                    </Link>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        </div>
      </ShellFrame>
    </RequireAuth>
  );
}

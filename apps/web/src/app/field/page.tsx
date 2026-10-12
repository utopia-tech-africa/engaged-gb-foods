"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { useAuth } from "@/components/auth-provider";
import { RequireAuth } from "@/components/require-auth";
import { ShellFrame } from "@/components/shell-frame";
import { fetchMyDepots, type MyDepot } from "@/lib/attendance/api";
import type { UserRole } from "@/lib/auth/types";

const FIELD_ROLES: UserRole[] = ["qc", "handler", "cluster_supervisor", "regional_supervisor"];

export default function FieldHomePage() {
  const { user, accessToken } = useAuth();
  const [depots, setDepots] = useState<MyDepot[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accessToken) {
      return;
    }
    void fetchMyDepots(accessToken)
      .then(setDepots)
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Could not load depots");
      })
      .finally(() => setLoading(false));
  }, [accessToken]);

  return (
    <RequireAuth roles={FIELD_ROLES}>
      <ShellFrame title="Field workspace" eyebrow="Field">
        <div className="space-y-6">
          <p className="max-w-xl text-base text-brand-ink">
            Signed in as {user?.fullName}
            {user?.staffId ? ` · ${user.staffId}` : ""}. Choose a depot to check in with a selfie
            and your current location when GPS is available.
          </p>

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
                <Link
                  href={`/field/check-in?depotId=${encodeURIComponent(depot.id)}`}
                  className="block rounded-2xl border border-border bg-surface p-4 transition hover:border-brand hover:shadow-sm"
                >
                  <p className="font-semibold text-brand-ink">{depot.name}</p>
                  <p className="mt-1 text-xs font-medium uppercase tracking-wide text-brand">
                    {depot.code}
                  </p>
                  <p className="mt-2 text-sm text-brand-ink/70">{depot.address}</p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </ShellFrame>
    </RequireAuth>
  );
}

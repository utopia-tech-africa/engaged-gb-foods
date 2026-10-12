"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { useAuth } from "@/components/auth-provider";
import { RequireAuth } from "@/components/require-auth";
import { ShellFrame } from "@/components/shell-frame";
import type { UserRole } from "@/lib/auth/types";
import { fetchStockLots, type StockLot, ZONE_LABELS } from "@/lib/stock/api";

const CLIENT_ROLES: UserRole[] = ["gbfoods_reviewer", "admin"];

const PENDING_ZONES = new Set([
  "held_or_rejected",
  "recoverable_pending_approval",
  "conforming_pending_release",
]);

const todayIso = (): string => new Date().toISOString().slice(0, 10);

export default function ClientHomePage() {
  const { user, accessToken } = useAuth();
  const [lots, setLots] = useState<StockLot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) {
      return;
    }
    void fetchStockLots(accessToken, { date: todayIso() })
      .then(setLots)
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Could not load lots");
      })
      .finally(() => setLoading(false));
  }, [accessToken]);

  const pending = useMemo(() => lots.filter((lot) => PENDING_ZONES.has(lot.zone)), [lots]);

  return (
    <RequireAuth roles={CLIENT_ROLES}>
      <ShellFrame title="Client control room" eyebrow="GBfoods">
        <div className="space-y-6">
          <p className="max-w-xl text-base text-brand-ink">
            Signed in as {user?.fullName}. Record disposition decisions on held and pending-release
            stock from today&apos;s visits.
          </p>

          {loading ? <p className="text-sm text-brand-ink/70">Loading pending lots…</p> : null}
          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          {!loading && !error && pending.length === 0 ? (
            <p className="text-sm text-brand-ink/70">No lots awaiting disposition today.</p>
          ) : null}

          <ul className="space-y-3">
            {pending.map((lot) => (
              <li
                key={lot.id}
                className="rounded-2xl border border-border bg-surface p-4 text-sm text-brand-ink"
              >
                <p className="font-semibold">{lot.sku.name}</p>
                <p className="text-brand">{ZONE_LABELS[lot.zone]}</p>
                <p className="mt-1 text-brand-ink/70">
                  {lot.visit.depot.name} · batch {lot.batchCode}
                </p>
                <Link
                  href={`/client/lots/${lot.id}`}
                  className="mt-3 inline-flex rounded-full bg-brand px-4 py-2 text-xs font-semibold text-white"
                >
                  Disposition
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </ShellFrame>
    </RequireAuth>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { useAuth } from "@/components/auth-provider";
import { RequireAuth } from "@/components/require-auth";
import { ShellFrame } from "@/components/shell-frame";
import { fetchMyDepots, type MyDepot } from "@/lib/attendance/api";
import type { UserRole } from "@/lib/auth/types";
import { fetchStockLots, type StockLot, ZONE_LABELS } from "@/lib/stock/api";

const FIELD_ROLES: UserRole[] = ["qc", "handler", "cluster_supervisor", "regional_supervisor"];

const todayIso = (): string => new Date().toISOString().slice(0, 10);

const formatQty = (lot: StockLot): string => {
  const unitLabel = lot.unit === "cases" ? lot.sku.caseUnit : lot.sku.looseUnit;
  return `${lot.quantity} ${unitLabel} (${lot.baseQuantity} ${lot.sku.looseUnit} base)`;
};

export default function FieldStockListPage() {
  const { accessToken } = useAuth();
  const [depots, setDepots] = useState<MyDepot[]>([]);
  const [lots, setLots] = useState<StockLot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) {
      return;
    }
    void fetchMyDepots(accessToken)
      .then(setDepots)
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Could not load depots");
      });
  }, [accessToken]);

  useEffect(() => {
    if (!accessToken) {
      return;
    }
    setLoading(true);
    void fetchStockLots(accessToken, { date: todayIso() })
      .then(setLots)
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Could not load stock lots");
      })
      .finally(() => setLoading(false));
  }, [accessToken]);

  const sorted = useMemo(
    () => [...lots].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [lots],
  );

  return (
    <RequireAuth roles={FIELD_ROLES}>
      <ShellFrame title="Stock capture" eyebrow="Field">
        <div className="space-y-6">
          <p className="max-w-xl text-base text-brand-ink">
            Today&apos;s stock lots across your assigned depots. Capture batch, zone, quantity, and
            evidence photos on site.
          </p>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/field"
              className="rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium text-brand-ink hover:border-brand hover:text-brand"
            >
              Field home
            </Link>
          </div>

          {depots.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {depots.map((depot) => (
                <Link
                  key={depot.id}
                  href={`/field/stock/new?depotId=${encodeURIComponent(depot.id)}`}
                  className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand/90"
                >
                  New lot · {depot.code}
                </Link>
              ))}
            </div>
          ) : null}

          {loading ? <p className="text-sm text-brand-ink/70">Loading stock lots…</p> : null}
          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          {!loading && !error && sorted.length === 0 ? (
            <p className="text-sm text-brand-ink/70">No stock lots captured today yet.</p>
          ) : null}

          <ul className="space-y-3">
            {sorted.map((lot) => (
              <li
                key={lot.id}
                className="rounded-2xl border border-border bg-surface p-4 text-sm text-brand-ink"
              >
                <p className="font-semibold">{lot.sku.name}</p>
                <p className="mt-1 text-brand">{ZONE_LABELS[lot.zone]}</p>
                <p className="mt-2">
                  <span className="text-brand-ink/60">Depot:</span> {lot.visit.depot.name} (
                  {lot.visit.depot.code})
                </p>
                <p>
                  <span className="text-brand-ink/60">Batch:</span> {lot.batchCode}
                </p>
                <p>
                  <span className="text-brand-ink/60">Quantity:</span> {formatQty(lot)}
                </p>
                <p className="text-xs text-brand-ink/50">
                  {new Date(lot.createdAt).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </ShellFrame>
    </RequireAuth>
  );
}

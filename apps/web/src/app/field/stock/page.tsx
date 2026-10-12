"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { useAuth } from "@/components/auth-provider";
import { RequireAuth } from "@/components/require-auth";
import { ShellFrame } from "@/components/shell-frame";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { fetchMyDepots, type MyDepot } from "@/lib/attendance/api";
import type { UserRole } from "@/lib/auth/types";
import { fetchStockLots, type StockLot, ZONE_LABELS } from "@/lib/stock/api";
import { cn } from "@/lib/utils";

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

          <Link href="/field" className={cn(buttonVariants({ variant: "outline" }))}>
            Field home
          </Link>

          {depots.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {depots.map((depot) => (
                <Link
                  key={depot.id}
                  href={`/field/stock/new?depotId=${encodeURIComponent(depot.id)}`}
                  className={cn(buttonVariants({ size: "sm" }))}
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
              <li key={lot.id}>
                <Card>
                  <CardContent className="text-sm text-brand-ink">
                    <p className="font-semibold">{lot.sku.name}</p>
                    <Badge className="mt-1">{ZONE_LABELS[lot.zone]}</Badge>
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
                    <Link
                      href={`/field/visits/${lot.visitId}/reconcile`}
                      className={cn(buttonVariants({ variant: "link" }), "mt-3 h-auto p-0")}
                    >
                      Reconcile visit
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

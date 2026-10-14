"use client";

import { Package } from "lucide-react";
import Link from "next/link";

import { useAuth } from "@/components/auth-provider";
import { EmptyState } from "@/components/empty-state";
import { CardListSkeleton } from "@/components/list-skeleton";
import { RequireAuth } from "@/components/require-auth";
import { ShellFrame } from "@/components/shell-frame";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useGetMeDepots } from "@/lib/api/generated/assignments/assignments";
import type { StockLotResponseDto } from "@/lib/api/generated/model";
import { useGetStockLots } from "@/lib/api/generated/stock-lots/stock-lots";
import type { UserRole } from "@/lib/auth/types";
import { ZONE_LABELS } from "@/lib/stock/constants";
import { cn } from "@/lib/utils";

const FIELD_ROLES: UserRole[] = ["qc", "handler", "cluster_supervisor", "regional_supervisor"];

const todayIso = (): string => new Date().toISOString().slice(0, 10);

const formatQty = (lot: StockLotResponseDto): string => {
  const unitLabel = lot.unit === "cases" ? lot.sku.caseUnit : lot.sku.looseUnit;
  return `${lot.quantity} ${unitLabel} (${lot.baseQuantity} ${lot.sku.looseUnit} base)`;
};

export default function FieldStockListPage() {
  const { accessToken } = useAuth();
  const enabled = Boolean(accessToken);
  const depotsQuery = useGetMeDepots({ query: { enabled } });
  const lotsQuery = useGetStockLots({ date: todayIso() }, { query: { enabled } });

  const depots = depotsQuery.data ?? [];
  const loading = lotsQuery.isLoading;
  const error = depotsQuery.error?.message ?? lotsQuery.error?.message ?? null;
  const sorted = [...(lotsQuery.data ?? [])].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

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

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          {loading ? (
            <CardListSkeleton count={3} />
          ) : !error && sorted.length === 0 ? (
            <EmptyState
              icon={Package}
              title="No stock lots today"
              description="Capture the first lot from one of your assigned depots."
            />
          ) : null}

          {!loading && sorted.length > 0 ? (
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
          ) : null}
        </div>
      </ShellFrame>
    </RequireAuth>
  );
}

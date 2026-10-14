"use client";

import { Package } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { AttendancePhoto } from "@/components/attendance-photo";
import { useAuth } from "@/components/auth-provider";
import { DatePicker } from "@/components/date-picker";
import { EmptyState } from "@/components/empty-state";
import { CardListSkeleton } from "@/components/list-skeleton";
import { RequireAuth } from "@/components/require-auth";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import type { StockLotResponseDto } from "@/lib/api/generated/model";
import { useGetStockLots } from "@/lib/api/generated/stock-lots/stock-lots";
import { OPS_NETWORK_ROLES } from "@/lib/network/roles";
import { ZONE_LABELS } from "@/lib/stock/constants";
import { cn } from "@/lib/utils";

const todayIso = (): string => new Date().toISOString().slice(0, 10);

const formatQty = (lot: StockLotResponseDto): string => {
  const unitLabel = lot.unit === "cases" ? lot.sku.caseUnit : lot.sku.looseUnit;
  return `${lot.quantity} ${unitLabel} · ${lot.baseQuantity} ${lot.sku.looseUnit} base`;
};

export default function OpsStockPage() {
  const { accessToken } = useAuth();
  const [date, setDate] = useState(todayIso());
  const {
    data: rows = [],
    isLoading: loading,
    error: loadError,
  } = useGetStockLots({ date }, { query: { enabled: Boolean(accessToken) } });
  const error = loadError?.message ?? null;

  const sorted = [...rows].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <RequireAuth roles={[...OPS_NETWORK_ROLES, "cluster_supervisor", "regional_supervisor"]}>
      <div className="space-y-6">
        <h1 className="font-display text-3xl font-semibold text-foreground md:text-4xl">
          Stock lots
        </h1>
        <div className="max-w-xs space-y-2">
          <Label htmlFor="ops-stock-date">Date</Label>
          <DatePicker id="ops-stock-date" value={date} onChange={setDate} />
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        {loading ? (
          <CardListSkeleton count={3} />
        ) : !error && sorted.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No stock lots for this date"
            description="Crews may still be offline, or this day has no captures."
          />
        ) : null}

        {!loading && sorted.length > 0 ? (
          <ul className="space-y-4">
            {sorted.map((row) => (
              <li key={row.id}>
                <Card>
                  <CardContent className="text-sm text-brand-ink">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold">{row.sku.name}</p>
                        <Badge className="mt-1">{ZONE_LABELS[row.zone]}</Badge>
                      </div>
                      <p className="text-xs text-brand-ink/50">
                        {new Date(row.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="mt-3 grid gap-1">
                      <p>
                        <span className="text-brand-ink/60">Depot:</span> {row.visit.depot.name} (
                        {row.visit.depot.code})
                      </p>
                      <p>
                        <span className="text-brand-ink/60">Captured by:</span>{" "}
                        {row.createdBy.fullName}
                        {row.createdBy.staffId ? ` · ${row.createdBy.staffId}` : ""}
                      </p>
                      <p>
                        <span className="text-brand-ink/60">Batch:</span> {row.batchCode}
                        {row.expiryDate ? ` · exp ${row.expiryDate.slice(0, 10)}` : ""}
                      </p>
                      <p>
                        <span className="text-brand-ink/60">Quantity:</span> {formatQty(row)}
                      </p>
                      {row.notes ? (
                        <p>
                          <span className="text-brand-ink/60">Notes:</span> {row.notes}
                        </p>
                      ) : null}
                    </div>
                    <Link
                      href={`/ops/visits/${row.visitId}`}
                      className={cn(buttonVariants({ variant: "link" }), "mt-3 h-auto p-0")}
                    >
                      Visit reconciliation
                    </Link>
                    {row.evidence.length > 0 && accessToken ? (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {row.evidence.map((item) => (
                          <div key={item.id} className="w-24">
                            <AttendancePhoto
                              objectKey={item.objectKey}
                              alt={`${item.category} evidence`}
                              className="h-20 w-full rounded-lg object-cover"
                            />
                            <p className="mt-1 text-center text-[10px] uppercase tracking-wide text-brand-ink/60">
                              {item.category}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </RequireAuth>
  );
}

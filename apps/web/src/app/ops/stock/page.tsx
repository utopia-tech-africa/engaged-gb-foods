"use client";

import { useEffect, useMemo, useState } from "react";

import { AttendancePhoto } from "@/components/attendance-photo";
import { useAuth } from "@/components/auth-provider";
import { OpsNetworkNav } from "@/components/ops-network-nav";
import { RequireAuth } from "@/components/require-auth";
import { ShellFrame } from "@/components/shell-frame";
import { OPS_NETWORK_ROLES } from "@/lib/network/roles";
import { fetchStockLots, type StockLot, ZONE_LABELS } from "@/lib/stock/api";

const todayIso = (): string => new Date().toISOString().slice(0, 10);

const formatQty = (lot: StockLot): string => {
  const unitLabel = lot.unit === "cases" ? lot.sku.caseUnit : lot.sku.looseUnit;
  return `${lot.quantity} ${unitLabel} · ${lot.baseQuantity} ${lot.sku.looseUnit} base`;
};

export default function OpsStockPage() {
  const { accessToken } = useAuth();
  const [date, setDate] = useState(todayIso());
  const [rows, setRows] = useState<StockLot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) {
      return;
    }
    setLoading(true);
    void fetchStockLots(accessToken, { date })
      .then(setRows)
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Could not load stock lots");
      })
      .finally(() => setLoading(false));
  }, [accessToken, date]);

  const sorted = useMemo(
    () => [...rows].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [rows],
  );

  return (
    <RequireAuth roles={[...OPS_NETWORK_ROLES, "cluster_supervisor", "regional_supervisor"]}>
      <ShellFrame title="Stock lots" eyebrow="Operations">
        <div className="space-y-6">
          <OpsNetworkNav />
          <div className="flex flex-wrap items-end gap-4">
            <label className="block text-sm">
              <span className="font-medium text-brand-ink">Date</span>
              <input
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                className="mt-1 block rounded-lg border border-border bg-surface px-3 py-2 text-brand-ink"
              />
            </label>
          </div>

          {loading ? <p className="text-sm text-brand-ink/70">Loading stock lots…</p> : null}
          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          {!loading && !error && sorted.length === 0 ? (
            <p className="text-sm text-brand-ink/70">No stock lots for this date.</p>
          ) : null}

          <ul className="space-y-4">
            {sorted.map((row) => (
              <li
                key={row.id}
                className="rounded-2xl border border-border bg-surface p-4 text-sm text-brand-ink"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{row.sku.name}</p>
                    <p className="text-brand">{ZONE_LABELS[row.zone]}</p>
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
                    <span className="text-brand-ink/60">Captured by:</span> {row.createdBy.fullName}
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
                {row.evidence.length > 0 && accessToken ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {row.evidence.map((item) => (
                      <div key={item.id} className="w-24">
                        <AttendancePhoto
                          accessToken={accessToken}
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
              </li>
            ))}
          </ul>
        </div>
      </ShellFrame>
    </RequireAuth>
  );
}

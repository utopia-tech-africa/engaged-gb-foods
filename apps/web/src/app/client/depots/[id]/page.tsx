"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/components/auth-provider";
import { RequireAuth } from "@/components/require-auth";
import { ShellFrame } from "@/components/shell-frame";
import { type ClientDepotPack, fetchClientDepotPack, formatSyncTime } from "@/lib/client/api";
import { CLIENT_CONTROL_ROLES } from "@/lib/client/roles";
import { ZONE_LABELS } from "@/lib/stock/api";
import type { ReconciliationSnapshot } from "@/lib/visit/api";

const todayIso = (): string => new Date().toISOString().slice(0, 10);

export default function ClientDepotPackPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const depotId = params.id;
  const date = searchParams.get("date") ?? todayIso();
  const { accessToken } = useAuth();
  const [pack, setPack] = useState<ClientDepotPack | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!accessToken) {
      return;
    }
    setLoading(true);
    try {
      const data = await fetchClientDepotPack(accessToken, depotId, date);
      setPack(data);
      setError(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not load depot pack");
    } finally {
      setLoading(false);
    }
  }, [accessToken, depotId, date]);

  useEffect(() => {
    void load();
  }, [load]);

  const reconciliations = (pack?.reconciliations ?? []) as ReconciliationSnapshot[];

  return (
    <RequireAuth roles={CLIENT_CONTROL_ROLES}>
      <ShellFrame
        title={pack?.depot.name ?? "Depot pack"}
        eyebrow={pack ? `${pack.depot.code} · ${pack.depot.regionName}` : "GBfoods"}
      >
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <Link
              href={`/client?date=${encodeURIComponent(date)}`}
              className="text-brand font-semibold"
            >
              ← Control room
            </Link>
            <span className="text-brand-ink/60">Date {date}</span>
          </div>

          {loading ? <p className="text-sm text-brand-ink/70">Loading pack…</p> : null}
          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          {pack ? (
            <>
              <section className="rounded-2xl border border-border bg-surface p-4 text-sm text-brand-ink">
                <h2 className="font-semibold">Visits</h2>
                {pack.visits.length === 0 ? (
                  <p className="mt-2 text-brand-ink/70">No visits recorded for this day.</p>
                ) : (
                  <ul className="mt-2 space-y-1">
                    {pack.visits.map((visit) => (
                      <li key={visit.id}>
                        {visit.code} · {visit.status.replace(/_/g, " ")} · last sync{" "}
                        {formatSyncTime(visit.lastSyncedAt)}
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              {reconciliations.map((snapshot) => (
                <section
                  key={snapshot.visit.id}
                  className="rounded-2xl border border-border bg-surface p-4"
                >
                  <h2 className="text-sm font-semibold text-brand-ink">
                    Reconciliation · {snapshot.visit.code}
                  </h2>
                  {snapshot.lines.length === 0 ? (
                    <p className="mt-2 text-sm text-brand-ink/70">No stock lines yet.</p>
                  ) : (
                    <div className="mt-3 overflow-x-auto">
                      <table className="min-w-full text-left text-sm">
                        <thead className="text-xs uppercase text-brand-ink/60">
                          <tr>
                            <th className="py-2 pr-4">SKU / batch</th>
                            <th className="py-2 pr-4">Opening</th>
                            <th className="py-2 pr-4">Closing</th>
                            <th className="py-2">Variance</th>
                          </tr>
                        </thead>
                        <tbody>
                          {snapshot.lines.map((line) => (
                            <tr
                              key={`${line.skuId}-${line.batchCode}`}
                              className="border-t border-border"
                            >
                              <td className="py-2 pr-4">
                                {line.skuName}
                                <span className="block text-xs text-brand-ink/60">
                                  {line.batchCode}
                                </span>
                              </td>
                              <td className="py-2 pr-4">{line.opening}</td>
                              <td className="py-2 pr-4">{line.closingTotal}</td>
                              <td className="py-2">{line.variance}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>
              ))}

              <section className="rounded-2xl border border-border bg-surface p-4">
                <h2 className="text-sm font-semibold text-brand-ink">Quality holds</h2>
                {pack.holds.length === 0 ? (
                  <p className="mt-2 text-sm text-brand-ink/70">No held or rejected lots.</p>
                ) : (
                  <ul className="mt-3 space-y-3">
                    {pack.holds.map((hold) => (
                      <li
                        key={hold.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border p-3 text-sm"
                      >
                        <div>
                          <p className="font-semibold text-brand-ink">
                            {hold.skuName} · batch {hold.batchCode}
                          </p>
                          <p className="text-brand-ink/70">
                            {hold.baseQuantity} base units · {hold.visitCode}
                            {hold.custodian ? ` · custodian ${hold.custodian}` : ""}
                          </p>
                        </div>
                        {hold.pendingDisposition ? (
                          <Link
                            href={`/client/lots/${hold.id}`}
                            className="rounded-full bg-brand px-4 py-2 text-xs font-semibold text-white"
                          >
                            Disposition
                          </Link>
                        ) : (
                          <span className="text-xs text-brand-ink/60">Disposition recorded</span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="rounded-2xl border border-border bg-surface p-4">
                <h2 className="text-sm font-semibold text-brand-ink">All lots</h2>
                <ul className="mt-3 space-y-2 text-sm text-brand-ink">
                  {(
                    pack.lots as Array<{
                      id: string;
                      batchCode: string;
                      zone: keyof typeof ZONE_LABELS;
                      sku: { name: string };
                    }>
                  ).map((lot) => (
                    <li
                      key={lot.id}
                      className="flex justify-between gap-2 border-b border-border/60 py-2"
                    >
                      <span>
                        {lot.sku.name} · {lot.batchCode}
                      </span>
                      <span className="text-brand-ink/70">{ZONE_LABELS[lot.zone]}</span>
                    </li>
                  ))}
                </ul>
              </section>
            </>
          ) : null}
        </div>
      </ShellFrame>
    </RequireAuth>
  );
}

"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";

import { useAuth } from "@/components/auth-provider";
import { RequireAuth } from "@/components/require-auth";
import { ShellFrame } from "@/components/shell-frame";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useGetClientDepotsByIdPack } from "@/lib/api/generated/client/client";
import { formatSyncTime } from "@/lib/client/format";
import { CLIENT_CONTROL_ROLES } from "@/lib/client/roles";
import { ZONE_LABELS } from "@/lib/stock/constants";
import { cn } from "@/lib/utils";

const todayIso = (): string => new Date().toISOString().slice(0, 10);

export default function ClientDepotPackPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const depotId = params.id;
  const date = searchParams.get("date") ?? todayIso();
  const { accessToken } = useAuth();

  const packQuery = useGetClientDepotsByIdPack(
    depotId,
    { date },
    { query: { enabled: Boolean(accessToken) } },
  );
  const pack = packQuery.data;
  const loading = packQuery.isLoading;
  const error = packQuery.error?.message ?? null;
  const reconciliations = pack?.reconciliations ?? [];

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
              className={cn(buttonVariants({ variant: "link" }), "h-auto p-0")}
            >
              ← Control room
            </Link>
            <span className="text-brand-ink/60">Date {date}</span>
          </div>

          {loading ? <p className="text-sm text-brand-ink/70">Loading pack…</p> : null}
          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          {pack ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Visits</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-brand-ink">
                  {pack.visits.length === 0 ? (
                    <p className="text-brand-ink/70">No visits recorded for this day.</p>
                  ) : (
                    <ul className="space-y-1">
                      {pack.visits.map((visit) => (
                        <li key={visit.id}>
                          {visit.code} · {visit.status.replace(/_/g, " ")} · last sync{" "}
                          {formatSyncTime(visit.lastSyncedAt)}
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>

              {reconciliations.map((snapshot) => (
                <Card key={snapshot.visit.id}>
                  <CardHeader>
                    <CardTitle className="text-sm">
                      Reconciliation · {snapshot.visit.code}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {snapshot.lines.length === 0 ? (
                      <p className="text-sm text-brand-ink/70">No stock lines yet.</p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-xs uppercase text-brand-ink/60">
                              SKU / batch
                            </TableHead>
                            <TableHead className="text-xs uppercase text-brand-ink/60">
                              Opening
                            </TableHead>
                            <TableHead className="text-xs uppercase text-brand-ink/60">
                              Closing
                            </TableHead>
                            <TableHead className="text-xs uppercase text-brand-ink/60">
                              Variance
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {snapshot.lines.map((line) => (
                            <TableRow key={`${line.skuId}-${line.batchCode}`}>
                              <TableCell>
                                {line.skuName}
                                <span className="block text-xs text-brand-ink/60">
                                  {line.batchCode}
                                </span>
                              </TableCell>
                              <TableCell>{line.opening}</TableCell>
                              <TableCell>{line.closingTotal}</TableCell>
                              <TableCell>{line.variance}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              ))}

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Quality holds</CardTitle>
                </CardHeader>
                <CardContent>
                  {pack.holds.length === 0 ? (
                    <p className="text-sm text-brand-ink/70">No held or rejected lots.</p>
                  ) : (
                    <ul className="space-y-3">
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
                              className={cn(buttonVariants({ size: "sm" }))}
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
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">All lots</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-brand-ink">
                    {pack.lots.map((lot) => (
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
                </CardContent>
              </Card>
            </>
          ) : null}
        </div>
      </ShellFrame>
    </RequireAuth>
  );
}

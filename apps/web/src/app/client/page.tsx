"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useAuth } from "@/components/auth-provider";
import { RequireAuth } from "@/components/require-auth";
import { ShellFrame } from "@/components/shell-frame";
import {
  type ClientOverview,
  type ClientReviewStatus,
  downloadClientCsv,
  fetchClientOverview,
  formatSyncTime,
  REVIEW_STATUS_LABELS,
} from "@/lib/client/api";
import { CLIENT_CONTROL_ROLES } from "@/lib/client/roles";
import { fetchRegions, type Region } from "@/lib/network/api";

const todayIso = (): string => new Date().toISOString().slice(0, 10);

const visitStatusLabel = (status: string | null): string => {
  if (!status) {
    return "No visit";
  }
  return status.replace(/_/g, " ");
};

export default function ClientControlRoomPage() {
  const { user, accessToken } = useAuth();
  const [overview, setOverview] = useState<ClientOverview | null>(null);
  const [regions, setRegions] = useState<Region[]>([]);
  const [date, setDate] = useState(todayIso);
  const [regionId, setRegionId] = useState("");
  const [reviewStatus, setReviewStatus] = useState<"" | ClientReviewStatus>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exportBusy, setExportBusy] = useState<"reconciliation" | "holds" | null>(null);

  const load = useCallback(async () => {
    if (!accessToken) {
      return;
    }
    setLoading(true);
    try {
      const data = await fetchClientOverview(accessToken, {
        date,
        regionId: regionId || undefined,
        reviewStatus: reviewStatus || undefined,
      });
      setOverview(data);
      setError(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not load control room");
    } finally {
      setLoading(false);
    }
  }, [accessToken, date, regionId, reviewStatus]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!accessToken) {
      return;
    }
    void fetchRegions(accessToken)
      .then(setRegions)
      .catch(() => {
        /* regions optional for filter */
      });
  }, [accessToken]);

  const kpis = useMemo(
    () =>
      overview ?? {
        depotsComplete: 0,
        depotsTotal: 0,
        recordsToReview: 0,
        qualityHolds: 0,
        depotsWithSyncDelay: 0,
        lastSyncAt: null,
      },
    [overview],
  );

  const runExport = async (kind: "reconciliation" | "holds") => {
    if (!accessToken) {
      return;
    }
    setExportBusy(kind);
    try {
      await downloadClientCsv(accessToken, kind, {
        date,
        regionId: regionId || undefined,
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Export failed");
    } finally {
      setExportBusy(null);
    }
  };

  return (
    <RequireAuth roles={CLIENT_CONTROL_ROLES}>
      <ShellFrame title="Control room" eyebrow="GBfoods">
        <div className="space-y-8">
          <p className="max-w-2xl text-base text-brand-ink">
            Signed in as {user?.fullName}. Monitor depot progress, review queues, and sync health.
            Field offline drafts are not shown here until synced to the server.
          </p>

          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {[
              {
                label: "Depots complete",
                value: `${kpis.depotsComplete} / ${kpis.depotsTotal}`,
              },
              { label: "Records to review", value: String(kpis.recordsToReview) },
              { label: "Quality holds", value: String(kpis.qualityHolds) },
              { label: "Sync delays", value: String(kpis.depotsWithSyncDelay) },
              { label: "Last sync", value: formatSyncTime(kpis.lastSyncAt) },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-border bg-brand-muted/40 p-4"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-brand-ink/60">
                  {item.label}
                </p>
                <p className="mt-1 text-xl font-semibold text-brand-ink">{item.value}</p>
              </div>
            ))}
          </section>

          <section className="flex flex-wrap items-end gap-4 rounded-2xl border border-border bg-surface p-4">
            <label className="flex flex-col gap-1 text-sm text-brand-ink">
              <span className="font-medium">Date</span>
              <input
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                className="rounded-xl border border-border px-3 py-2"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm text-brand-ink">
              <span className="font-medium">Region</span>
              <select
                value={regionId}
                onChange={(event) => setRegionId(event.target.value)}
                className="min-w-[12rem] rounded-xl border border-border px-3 py-2"
              >
                <option value="">All regions</option>
                {regions.map((region) => (
                  <option key={region.id} value={region.id}>
                    {region.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm text-brand-ink">
              <span className="font-medium">Review status</span>
              <select
                value={reviewStatus}
                onChange={(event) => setReviewStatus(event.target.value as "" | ClientReviewStatus)}
                className="min-w-[12rem] rounded-xl border border-border px-3 py-2"
              >
                <option value="">All statuses</option>
                {(Object.keys(REVIEW_STATUS_LABELS) as ClientReviewStatus[]).map((key) => (
                  <option key={key} value={key}>
                    {REVIEW_STATUS_LABELS[key]}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex flex-wrap gap-2 pb-0.5">
              <button
                type="button"
                disabled={exportBusy !== null}
                onClick={() => void runExport("reconciliation")}
                className="rounded-full border border-brand bg-white px-4 py-2 text-xs font-semibold text-brand disabled:opacity-50"
              >
                {exportBusy === "reconciliation" ? "Exporting…" : "Export reconciliation CSV"}
              </button>
              <button
                type="button"
                disabled={exportBusy !== null}
                onClick={() => void runExport("holds")}
                className="rounded-full bg-brand px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
              >
                {exportBusy === "holds" ? "Exporting…" : "Export holds CSV"}
              </button>
            </div>
          </section>

          {loading ? <p className="text-sm text-brand-ink/70">Loading depots…</p> : null}
          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          {!loading && overview && overview.depots.length === 0 ? (
            <p className="text-sm text-brand-ink/70">No depots match these filters.</p>
          ) : null}

          {overview && overview.depots.length > 0 ? (
            <div className="overflow-x-auto rounded-2xl border border-border">
              <table className="min-w-full text-left text-sm text-brand-ink">
                <thead className="bg-brand-muted/50 text-xs uppercase tracking-wide text-brand-ink/70">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Depot</th>
                    <th className="px-4 py-3 font-semibold">Region</th>
                    <th className="px-4 py-3 font-semibold">Visit</th>
                    <th className="px-4 py-3 font-semibold">Coverage</th>
                    <th className="px-4 py-3 font-semibold">Review</th>
                    <th className="px-4 py-3 font-semibold">Holds</th>
                    <th className="px-4 py-3 font-semibold">Last sync</th>
                    <th className="px-4 py-3 font-semibold" />
                  </tr>
                </thead>
                <tbody>
                  {overview.depots.map((depot) => (
                    <tr key={depot.depotId} className="border-t border-border">
                      <td className="px-4 py-3">
                        <p className="font-semibold">{depot.name}</p>
                        <p className="text-xs text-brand-ink/60">{depot.code}</p>
                      </td>
                      <td className="px-4 py-3">{depot.regionName}</td>
                      <td className="px-4 py-3 capitalize">
                        {visitStatusLabel(depot.visitStatus)}
                      </td>
                      <td className="px-4 py-3">{depot.coverage}%</td>
                      <td className="px-4 py-3">
                        <span
                          className={
                            depot.reviewStatus === "hold"
                              ? "font-semibold text-brand"
                              : depot.reviewStatus === "pending"
                                ? "text-brand-ink"
                                : "text-brand-ink/60"
                          }
                        >
                          {REVIEW_STATUS_LABELS[depot.reviewStatus]}
                        </span>
                      </td>
                      <td className="px-4 py-3">{depot.openHolds}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {formatSyncTime(depot.lastSyncedAt)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/client/depots/${depot.depotId}?date=${encodeURIComponent(date)}`}
                          className="inline-flex rounded-full border border-brand px-3 py-1.5 text-xs font-semibold text-brand"
                        >
                          Open pack
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
      </ShellFrame>
    </RequireAuth>
  );
}

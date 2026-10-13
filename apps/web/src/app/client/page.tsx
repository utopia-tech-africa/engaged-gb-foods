"use client";

import { keepPreviousData } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";

import { useAuth } from "@/components/auth-provider";
import { DatePicker } from "@/components/date-picker";
import { RequireAuth } from "@/components/require-auth";
import { ShellFrame } from "@/components/shell-frame";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useGetClientOverview } from "@/lib/api/generated/client/client";
import type { ClientReviewStatus } from "@/lib/api/generated/model";
import { useGetRegions } from "@/lib/api/generated/regions/regions";
import { downloadClientCsv } from "@/lib/client/download-csv";
import { formatSyncTime, REVIEW_STATUS_LABELS } from "@/lib/client/format";
import { CLIENT_CONTROL_ROLES } from "@/lib/client/roles";
import { cn } from "@/lib/utils";

const ALL_FILTER = "__all__";

const todayIso = (): string => new Date().toISOString().slice(0, 10);

const visitStatusLabel = (status: string | null): string => {
  if (!status) {
    return "No visit";
  }
  return status.replace(/_/g, " ");
};

const reviewBadgeVariant = (status: ClientReviewStatus): "default" | "secondary" | "outline" => {
  if (status === "hold") {
    return "default";
  }
  if (status === "pending") {
    return "secondary";
  }
  return "outline";
};

export default function ClientControlRoomPage() {
  const { user, accessToken } = useAuth();
  const [date, setDate] = useState(todayIso);
  const [regionId, setRegionId] = useState("");
  const [reviewStatus, setReviewStatus] = useState<"" | ClientReviewStatus>("");
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportBusy, setExportBusy] = useState<"reconciliation" | "holds" | null>(null);

  const enabled = Boolean(accessToken);
  const overviewQuery = useGetClientOverview(
    {
      date,
      regionId: regionId || undefined,
      reviewStatus: reviewStatus || undefined,
    },
    { query: { enabled, placeholderData: keepPreviousData } },
  );
  // Regions only feed the optional filter, so a failed load is not surfaced.
  const regionsQuery = useGetRegions({ query: { enabled } });

  const overview = overviewQuery.data;
  const regions = regionsQuery.data ?? [];
  const loading = overviewQuery.isLoading;
  const error = exportError ?? overviewQuery.error?.message ?? null;

  const kpis = overview ?? {
    depotsComplete: 0,
    depotsTotal: 0,
    recordsToReview: 0,
    qualityHolds: 0,
    depotsWithSyncDelay: 0,
    lastSyncAt: null,
  };

  const runExport = async (kind: "reconciliation" | "holds") => {
    setExportBusy(kind);
    setExportError(null);
    try {
      await downloadClientCsv(kind, { date, regionId: regionId || undefined });
    } catch (err: unknown) {
      setExportError(err instanceof Error ? err.message : "Export failed");
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
              <Card key={item.label} className="bg-brand-muted/40">
                <CardContent className="p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-brand-ink/60">
                    {item.label}
                  </p>
                  <p className="mt-1 text-xl font-semibold text-brand-ink">{item.value}</p>
                </CardContent>
              </Card>
            ))}
          </section>

          <Card>
            <CardContent className="flex flex-wrap items-end gap-4">
              <div className="space-y-2">
                <Label htmlFor="client-date">Date</Label>
                <DatePicker id="client-date" value={date} onChange={setDate} />
              </div>
              <div className="min-w-[12rem] space-y-2">
                <Label>Region</Label>
                <Select
                  value={regionId || ALL_FILTER}
                  onValueChange={(value) => {
                    if (!value) {
                      return;
                    }
                    setRegionId(value === ALL_FILTER ? "" : value);
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All regions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL_FILTER}>All regions</SelectItem>
                    {regions.map((region) => (
                      <SelectItem key={region.id} value={region.id}>
                        {region.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="min-w-[12rem] space-y-2">
                <Label>Review status</Label>
                <Select
                  value={reviewStatus || ALL_FILTER}
                  onValueChange={(value) => {
                    if (!value) {
                      return;
                    }
                    setReviewStatus(value === ALL_FILTER ? "" : (value as ClientReviewStatus));
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL_FILTER}>All statuses</SelectItem>
                    {(Object.keys(REVIEW_STATUS_LABELS) as ClientReviewStatus[]).map((key) => (
                      <SelectItem key={key} value={key}>
                        {REVIEW_STATUS_LABELS[key]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-wrap gap-2 pb-0.5">
                <Button
                  type="button"
                  variant="outline"
                  disabled={exportBusy !== null}
                  onClick={() => void runExport("reconciliation")}
                >
                  {exportBusy === "reconciliation" ? "Exporting…" : "Export reconciliation CSV"}
                </Button>
                <Button
                  type="button"
                  disabled={exportBusy !== null}
                  onClick={() => void runExport("holds")}
                >
                  {exportBusy === "holds" ? "Exporting…" : "Export holds CSV"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {loading ? <p className="text-sm text-brand-ink/70">Loading depots…</p> : null}
          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          {!loading && overview && overview.depots.length === 0 ? (
            <p className="text-sm text-brand-ink/70">No depots match these filters.</p>
          ) : null}

          {overview && overview.depots.length > 0 ? (
            <Card className="overflow-hidden p-0">
              <Table>
                <TableHeader className="bg-brand-muted/50">
                  <TableRow>
                    <TableHead className="text-xs uppercase tracking-wide text-brand-ink/70">
                      Depot
                    </TableHead>
                    <TableHead className="text-xs uppercase tracking-wide text-brand-ink/70">
                      Region
                    </TableHead>
                    <TableHead className="text-xs uppercase tracking-wide text-brand-ink/70">
                      Visit
                    </TableHead>
                    <TableHead className="text-xs uppercase tracking-wide text-brand-ink/70">
                      Coverage
                    </TableHead>
                    <TableHead className="text-xs uppercase tracking-wide text-brand-ink/70">
                      Review
                    </TableHead>
                    <TableHead className="text-xs uppercase tracking-wide text-brand-ink/70">
                      Holds
                    </TableHead>
                    <TableHead className="text-xs uppercase tracking-wide text-brand-ink/70">
                      Last sync
                    </TableHead>
                    <TableHead className="text-right text-xs uppercase tracking-wide text-brand-ink/70" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {overview.depots.map((depot) => (
                    <TableRow key={depot.depotId}>
                      <TableCell>
                        <p className="font-semibold">{depot.name}</p>
                        <p className="text-xs text-brand-ink/60">{depot.code}</p>
                      </TableCell>
                      <TableCell>{depot.regionName}</TableCell>
                      <TableCell className="capitalize">
                        {visitStatusLabel(depot.visitStatus)}
                      </TableCell>
                      <TableCell>{depot.coverage}%</TableCell>
                      <TableCell>
                        <Badge variant={reviewBadgeVariant(depot.reviewStatus)}>
                          {REVIEW_STATUS_LABELS[depot.reviewStatus]}
                        </Badge>
                      </TableCell>
                      <TableCell>{depot.openHolds}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        {formatSyncTime(depot.lastSyncedAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link
                          href={`/client/depots/${depot.depotId}?date=${encodeURIComponent(date)}`}
                          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                        >
                          Open pack
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          ) : null}
        </div>
      </ShellFrame>
    </RequireAuth>
  );
}

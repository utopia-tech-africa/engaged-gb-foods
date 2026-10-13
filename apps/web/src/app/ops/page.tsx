"use client";

import {
  AlertTriangle,
  CheckCircle2,
  Package,
  ShieldAlert,
  Store,
  UserCheck,
  Users,
  WifiOff,
} from "lucide-react";
import { useState } from "react";

import { useAuth } from "@/components/auth-provider";
import { DatePicker } from "@/components/date-picker";
import { DailyReturnProgress } from "@/components/ops-dashboard/daily-return-progress";
import { EscalationTriggerChart } from "@/components/ops-dashboard/escalation-trigger-chart";
import { KpiCard } from "@/components/ops-dashboard/kpi-card";
import { RegionCoverageChart } from "@/components/ops-dashboard/region-coverage-chart";
import { StockZoneChart } from "@/components/ops-dashboard/stock-zone-chart";
import { VisitStatusChart } from "@/components/ops-dashboard/visit-status-chart";
import { RequireAuth } from "@/components/require-auth";
import { Label } from "@/components/ui/label";
import { useGetOpsDashboard } from "@/lib/api/generated/ops-dashboard/ops-dashboard";
import type { UserRole } from "@/lib/auth/types";

const DASHBOARD_ROLES: UserRole[] = [
  "admin",
  "national_ops",
  "national_quality",
  "regional_supervisor",
];

const todayIso = (): string => new Date().toISOString().slice(0, 10);

export default function OpsDashboardPage() {
  const { accessToken } = useAuth();
  const [date, setDate] = useState(todayIso());
  const { data, isLoading, error } = useGetOpsDashboard(
    { date },
    { query: { enabled: Boolean(accessToken) && Boolean(date) } },
  );

  const kpis = data?.kpis;

  return (
    <RequireAuth roles={DASHBOARD_ROLES}>
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-1">
            <h1 className="font-display text-3xl font-semibold text-foreground md:text-4xl">
              Operations desk
            </h1>
            <p className="text-sm text-muted-foreground">
              Network readiness, field progress and exceptions at a glance.
            </p>
          </div>
          <div className="w-full space-y-2 sm:w-52">
            <Label htmlFor="dashboard-date">Date</Label>
            <DatePicker
              id="dashboard-date"
              value={date}
              onChange={(next) => next && setDate(next)}
            />
          </div>
        </div>

        {isLoading ? <p className="text-sm text-muted-foreground">Loading dashboard…</p> : null}
        {error ? <p className="text-sm text-danger">{error.message}</p> : null}

        {data && kpis ? (
          <>
            <section aria-label="Key figures" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <KpiCard
                label="Depots ready"
                value={kpis.depotsReady}
                hint={`${kpis.depotsTotal} active · ${kpis.depotsHold} on hold`}
                icon={Store}
                tone="success"
              />
              <KpiCard
                label="Visits complete"
                value={kpis.visitsComplete}
                hint={`${kpis.visitsScheduled} scheduled · ${kpis.visitsInProgress} in progress`}
                icon={CheckCircle2}
                tone="success"
              />
              <KpiCard
                label="Visit exceptions"
                value={kpis.visitsException}
                icon={AlertTriangle}
                tone={kpis.visitsException > 0 ? "danger" : "default"}
              />
              <KpiCard
                label="Open escalations"
                value={kpis.openEscalations}
                icon={ShieldAlert}
                tone={kpis.openEscalations > 0 ? "danger" : "default"}
              />
              <KpiCard
                label="Quality holds"
                value={kpis.qualityHolds}
                hint="Held lots awaiting disposition"
                icon={Package}
                tone={kpis.qualityHolds > 0 ? "warning" : "default"}
              />
              <KpiCard
                label="Sync delayed"
                value={kpis.syncDelayedVisits}
                hint="In-progress visits not syncing"
                icon={WifiOff}
                tone={kpis.syncDelayedVisits > 0 ? "warning" : "default"}
              />
              <KpiCard label="Active field users" value={kpis.activeFieldUsers} icon={Users} />
              <KpiCard
                label="Dispatchable staff"
                value={kpis.dispatchableStaff}
                hint="Latest assessment passed"
                icon={UserCheck}
                tone="success"
              />
            </section>

            <section aria-label="Charts" className="grid gap-4 lg:grid-cols-2">
              <VisitStatusChart data={data.visitStatusChart} />
              <RegionCoverageChart data={data.regionCoverage} />
              <StockZoneChart data={data.stockByZone} />
              <EscalationTriggerChart data={data.escalationByTrigger} />
            </section>

            <section aria-label="Daily return" className="grid gap-4 lg:grid-cols-2">
              <DailyReturnProgress
                submission={data.dailyReturnSubmission}
                attendance={data.attendanceToday}
              />
            </section>
          </>
        ) : null}
      </div>
    </RequireAuth>
  );
}

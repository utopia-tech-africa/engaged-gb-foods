"use client";

import { format } from "date-fns";
import { useState } from "react";

import { useAuth } from "@/components/auth-provider";
import { DailyReturnForm } from "@/components/daily-return-form";
import { DailyReturnNationalCard } from "@/components/daily-return-national-card";
import { DailyReturnTable } from "@/components/daily-return-table";
import { DatePicker } from "@/components/date-picker";
import { RequireAuth } from "@/components/require-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  useGetDailyReturns,
  useGetDailyReturnsNationalSummary,
} from "@/lib/api/generated/daily-returns/daily-returns";
import { useGetRegions } from "@/lib/api/generated/regions/regions";
import { canWriteDailyReturn, OPS_NETWORK_ROLES, OPS_READINESS_ROLES } from "@/lib/network/roles";

export default function OpsDailyReturnPage() {
  const { accessToken, user } = useAuth();
  const [regionId, setRegionId] = useState("");
  const [date, setDate] = useState(() => format(new Date(), "yyyy-MM-dd"));

  const canWrite = user ? canWriteDailyReturn(user.role) : false;
  const showNational = user ? OPS_NETWORK_ROLES.includes(user.role) : false;
  const enabled = Boolean(accessToken) && date !== "";

  const regionsQuery = useGetRegions({ query: { enabled: Boolean(accessToken) } });
  const returnsQuery = useGetDailyReturns({ date }, { query: { enabled } });
  const summaryQuery = useGetDailyReturnsNationalSummary(
    { date },
    { query: { enabled: enabled && showNational } },
  );

  const regions = (regionsQuery.data ?? []).filter((region) => region.isActive);
  const returns = returnsQuery.data ?? [];
  const summary = summaryQuery.data ?? null;
  const isLoading = returnsQuery.isLoading || (showNational && summaryQuery.isLoading);
  const loadError = returnsQuery.error ?? summaryQuery.error ?? regionsQuery.error;

  const existing = returns.find((entry) => entry.regionId === regionId) ?? null;
  const formKey = `${regionId}|${date}|${existing?.updatedAt ?? "new"}`;

  return (
    <RequireAuth roles={OPS_READINESS_ROLES}>
      <div className="space-y-6">
        <h1 className="font-display text-3xl font-semibold text-foreground md:text-4xl">
          Daily regional return
        </h1>
        <div className="max-w-xs space-y-2">
          <Label htmlFor="daily-date">Return date</Label>
          <DatePicker id="daily-date" value={date} onChange={setDate} />
        </div>

        {showNational ? <DailyReturnNationalCard summary={summary} isLoading={isLoading} /> : null}

        {canWrite ? (
          <DailyReturnForm
            key={formKey}
            regions={regions}
            regionId={regionId}
            onRegionChange={setRegionId}
            date={date}
            existing={existing}
          />
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg">Returns for this date</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : loadError ? (
              <p className="text-sm text-danger">{loadError.message}</p>
            ) : (
              <DailyReturnTable
                returns={returns}
                canEdit={canWrite}
                onEdit={(entry) => setRegionId(entry.regionId)}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </RequireAuth>
  );
}

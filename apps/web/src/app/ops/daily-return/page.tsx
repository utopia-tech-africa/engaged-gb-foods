"use client";

import { format } from "date-fns";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { useAuth } from "@/components/auth-provider";
import { DailyReturnForm } from "@/components/daily-return-form";
import { DailyReturnNationalCard } from "@/components/daily-return-national-card";
import { DailyReturnTable } from "@/components/daily-return-table";
import { DatePicker } from "@/components/date-picker";
import { OpsNetworkNav } from "@/components/ops-network-nav";
import { RequireAuth } from "@/components/require-auth";
import { ShellFrame } from "@/components/shell-frame";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  type DailyReturn,
  fetchDailyReturns,
  fetchNationalSummary,
  type NationalSummary,
} from "@/lib/daily-return/api";
import { fetchRegions, type Region } from "@/lib/network/api";
import { canWriteDailyReturn, OPS_NETWORK_ROLES, OPS_READINESS_ROLES } from "@/lib/network/roles";

export default function OpsDailyReturnPage() {
  const { accessToken, user } = useAuth();
  const [regions, setRegions] = useState<Region[]>([]);
  const [regionId, setRegionId] = useState("");
  const [date, setDate] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [returns, setReturns] = useState<DailyReturn[]>([]);
  const [summary, setSummary] = useState<NationalSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const canWrite = user ? canWriteDailyReturn(user.role) : false;
  const showNational = user ? OPS_NETWORK_ROLES.includes(user.role) : false;

  useEffect(() => {
    if (!accessToken) {
      return;
    }
    fetchRegions(accessToken)
      .then((list) => setRegions(list.filter((region) => region.isActive)))
      .catch((loadError: unknown) =>
        toast.error(loadError instanceof Error ? loadError.message : "Unable to load regions"),
      );
  }, [accessToken]);

  const loadReturns = useCallback(
    async (token: string, day: string): Promise<void> => {
      setIsLoading(true);
      try {
        const [list, national] = await Promise.all([
          fetchDailyReturns(token, { date: day }),
          showNational ? fetchNationalSummary(token, day) : Promise.resolve(null),
        ]);
        setReturns(list);
        setSummary(national);
      } catch (loadError) {
        toast.error(loadError instanceof Error ? loadError.message : "Unable to load returns");
      } finally {
        setIsLoading(false);
      }
    },
    [showNational],
  );

  useEffect(() => {
    if (accessToken && date) {
      void loadReturns(accessToken, date);
    }
  }, [accessToken, date, loadReturns]);

  const existing = returns.find((entry) => entry.regionId === regionId) ?? null;
  const formKey = `${regionId}|${date}|${existing?.updatedAt ?? "new"}`;

  return (
    <RequireAuth roles={OPS_READINESS_ROLES}>
      <ShellFrame title="Daily regional return" eyebrow="Reporting">
        <div className="space-y-6">
          <OpsNetworkNav />

          <div className="max-w-xs space-y-2">
            <Label htmlFor="daily-date">Return date</Label>
            <DatePicker id="daily-date" value={date} onChange={setDate} />
          </div>

          {showNational ? (
            <DailyReturnNationalCard summary={summary} isLoading={isLoading} />
          ) : null}

          {canWrite && accessToken ? (
            <DailyReturnForm
              key={formKey}
              accessToken={accessToken}
              regions={regions}
              regionId={regionId}
              onRegionChange={setRegionId}
              date={date}
              existing={existing}
              onSaved={() => loadReturns(accessToken, date)}
            />
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle className="font-display text-lg">Returns for this date</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-sm text-muted-foreground">Loading…</p>
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
      </ShellFrame>
    </RequireAuth>
  );
}

"use client";

import { addDays, format } from "date-fns";
import { useMemo, useState } from "react";

import { useAuth } from "@/components/auth-provider";
import { DatePicker } from "@/components/date-picker";
import { DispatchPlanner } from "@/components/dispatch/dispatch-planner";
import { DispatchTable } from "@/components/dispatch/dispatch-table";
import { RequireAuth } from "@/components/require-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useGetClusters } from "@/lib/api/generated/clusters/clusters";
import { useGetDispatches } from "@/lib/api/generated/dispatches/dispatches";
import { canWriteDispatch, OPS_DISPATCH_ROLES } from "@/lib/network/roles";

export default function OpsDispatchPage() {
  const { accessToken, user } = useAuth();
  const [date, setDate] = useState(() => format(addDays(new Date(), 1), "yyyy-MM-dd"));
  const [clusterId, setClusterId] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const canWrite = user ? canWriteDispatch(user.role) : false;
  const enabled = Boolean(accessToken) && date !== "";

  const clustersQuery = useGetClusters(undefined, { query: { enabled: Boolean(accessToken) } });
  const dispatchesQuery = useGetDispatches({ date }, { query: { enabled } });

  const clusters = clustersQuery.data ?? [];
  const dispatches = dispatchesQuery.data ?? [];
  const existing = useMemo(
    () => dispatches.find((entry) => entry.id === selectedId) ?? null,
    [dispatches, selectedId],
  );

  const plannerClusterId = existing?.clusterId ?? clusterId;
  const plannerKey = `${plannerClusterId}|${date}|${existing?.updatedAt ?? "new"}`;

  return (
    <RequireAuth roles={OPS_DISPATCH_ROLES}>
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h1 className="font-display text-3xl font-semibold text-foreground md:text-4xl">
            Dispatch
          </h1>
          {selectedId ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setSelectedId(null);
                setClusterId("");
              }}
            >
              New plan
            </Button>
          ) : null}
        </div>

        <p className="max-w-2xl text-sm text-muted-foreground">
          Plan tomorrow&apos;s depot visits per cluster. Only recce-ready depots with a dispatchable
          QC can be added. Freezing locks the route and creates scheduled visits.
        </p>

        <div className="max-w-xs space-y-2">
          <Label htmlFor="dispatch-date">Visit date</Label>
          <DatePicker
            id="dispatch-date"
            value={date}
            onChange={(next) => {
              setDate(next);
              setSelectedId(null);
            }}
          />
        </div>

        {canWrite ? (
          <DispatchPlanner
            key={plannerKey}
            clusters={clusters}
            date={date}
            clusterId={plannerClusterId}
            onClusterChange={setClusterId}
            existing={existing}
            onCreated={(dispatch) => {
              setSelectedId(dispatch.id);
              setClusterId(dispatch.clusterId);
            }}
          />
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg">Plans for this date</CardTitle>
          </CardHeader>
          <CardContent>
            {dispatchesQuery.isLoading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : dispatchesQuery.error ? (
              <p className="text-sm text-danger">{dispatchesQuery.error.message}</p>
            ) : (
              <DispatchTable
                dispatches={dispatches}
                selectedId={selectedId}
                onSelect={(dispatch) => {
                  setSelectedId(dispatch.id);
                  setClusterId(dispatch.clusterId);
                }}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </RequireAuth>
  );
}

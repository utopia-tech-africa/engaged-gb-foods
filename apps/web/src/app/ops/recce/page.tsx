"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { useAuth } from "@/components/auth-provider";
import { OpsNetworkNav } from "@/components/ops-network-nav";
import { RecceForm } from "@/components/recce-form";
import { RecceTable } from "@/components/recce-table";
import { RequireAuth } from "@/components/require-auth";
import { ShellFrame } from "@/components/shell-frame";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Depot } from "@/lib/network/api";
import { fetchDepots } from "@/lib/network/api";
import { canWriteReadiness, OPS_READINESS_ROLES } from "@/lib/network/roles";
import { fetchRecces, type Recce } from "@/lib/recce/api";

export default function OpsReccePage() {
  const { accessToken, user } = useAuth();
  const [depots, setDepots] = useState<Depot[]>([]);
  const [recces, setRecces] = useState<Recce[]>([]);
  const [editing, setEditing] = useState<Recce | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const canWrite = user ? canWriteReadiness(user.role) : false;

  const loadData = useCallback(async (token: string): Promise<void> => {
    try {
      const [depotList, recceList] = await Promise.all([fetchDepots(token), fetchRecces(token)]);
      setDepots(depotList);
      setRecces(recceList);
    } catch (loadError) {
      toast.error(loadError instanceof Error ? loadError.message : "Unable to load recces");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (accessToken) {
      void loadData(accessToken);
    }
  }, [accessToken, loadData]);

  return (
    <RequireAuth roles={OPS_READINESS_ROLES}>
      <ShellFrame title="Depot recce" eyebrow="Readiness">
        <div className="space-y-6">
          <OpsNetworkNav />

          {canWrite && accessToken ? (
            <RecceForm
              key={editing?.id ?? "new"}
              accessToken={accessToken}
              depots={depots}
              editing={editing}
              onCancelEdit={() => setEditing(null)}
              onSaved={async () => {
                setEditing(null);
                await loadData(accessToken);
              }}
            />
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle className="font-display text-lg">Recces</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-sm text-muted-foreground">Loading…</p>
              ) : (
                <RecceTable
                  recces={recces}
                  canEdit={canWrite}
                  onEdit={(recce) => {
                    setEditing(recce);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                />
              )}
            </CardContent>
          </Card>
        </div>
      </ShellFrame>
    </RequireAuth>
  );
}

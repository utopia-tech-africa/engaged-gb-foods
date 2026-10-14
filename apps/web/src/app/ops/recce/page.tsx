"use client";

import { useState } from "react";

import { useAuth } from "@/components/auth-provider";
import { RecceForm } from "@/components/recce-form";
import { RecceTable } from "@/components/recce-table";
import { RequireAuth } from "@/components/require-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGetDepots } from "@/lib/api/generated/depots/depots";
import type { RecceResponseDto } from "@/lib/api/generated/model";
import { useGetRecces } from "@/lib/api/generated/recces/recces";
import { canWriteReadiness, OPS_READINESS_ROLES } from "@/lib/network/roles";

export default function OpsReccePage() {
  const { accessToken, user } = useAuth();
  const [editing, setEditing] = useState<RecceResponseDto | null>(null);

  const enabled = Boolean(accessToken);
  const depotsQuery = useGetDepots(undefined, { query: { enabled } });
  const reccesQuery = useGetRecces(undefined, { query: { enabled } });

  const canWrite = user ? canWriteReadiness(user.role) : false;
  const depots = depotsQuery.data ?? [];
  const recces = reccesQuery.data ?? [];
  const isLoading = depotsQuery.isLoading || reccesQuery.isLoading;
  const loadError = depotsQuery.error ?? reccesQuery.error;

  return (
    <RequireAuth roles={OPS_READINESS_ROLES}>
      <div className="space-y-6">
        <h1 className="font-display text-3xl font-semibold text-foreground md:text-4xl">
          Depot recce
        </h1>
        {canWrite ? (
          <RecceForm
            key={editing?.id ?? "new"}
            depots={depots}
            editing={editing}
            onCancelEdit={() => setEditing(null)}
            onSaved={() => setEditing(null)}
          />
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg">Recces</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : loadError ? (
              <p className="text-sm text-danger">{loadError.message}</p>
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
    </RequireAuth>
  );
}

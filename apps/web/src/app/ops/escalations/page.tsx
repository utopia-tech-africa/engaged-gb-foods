"use client";

import { useState } from "react";

import { useAuth } from "@/components/auth-provider";
import { EscalationTable } from "@/components/escalation-table";
import { EscalationTriageForm } from "@/components/escalation-triage-form";
import { TableSkeleton } from "@/components/list-skeleton";
import { RequireAuth } from "@/components/require-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGetEscalations } from "@/lib/api/generated/escalations/escalations";
import type { EscalationStatus } from "@/lib/api/generated/model";
import { STATUS_LABELS, STATUSES } from "@/lib/escalation/constants";
import { canTriageEscalation, OPS_READINESS_ROLES } from "@/lib/network/roles";

const ALL_STATUSES = "all";
const filterItems = [
  { value: ALL_STATUSES, label: "All statuses" },
  ...STATUSES.map((value) => ({ value, label: STATUS_LABELS[value] })),
];

export default function OpsEscalationsPage() {
  const { accessToken, user } = useAuth();
  const [statusFilter, setStatusFilter] = useState<string>("open");
  const [editingId, setEditingId] = useState<string | null>(null);

  const canEdit = user ? canTriageEscalation(user.role) : false;
  const params = statusFilter === ALL_STATUSES ? {} : { status: statusFilter as EscalationStatus };
  const escalationsQuery = useGetEscalations(params, { query: { enabled: Boolean(accessToken) } });

  const escalations = escalationsQuery.data ?? [];
  const editing = escalations.find((entry) => entry.id === editingId) ?? null;

  return (
    <RequireAuth roles={OPS_READINESS_ROLES}>
      <div className="space-y-6">
        <h1 className="font-display text-3xl font-semibold text-foreground md:text-4xl">
          Escalations
        </h1>
        <div className="max-w-xs space-y-2">
          <Label>Status</Label>
          <Select
            items={filterItems}
            value={statusFilter}
            onValueChange={(value) => value && setStatusFilter(value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {filterItems.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {canEdit && editing ? (
          <EscalationTriageForm
            key={`${editing.id}|${editing.updatedAt}`}
            escalation={editing}
            onDone={() => setEditingId(null)}
          />
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg">Field exceptions</CardTitle>
          </CardHeader>
          <CardContent>
            {escalationsQuery.isLoading ? (
              <TableSkeleton columns={7} rows={4} />
            ) : escalationsQuery.error ? (
              <p className="text-sm text-danger">{escalationsQuery.error.message}</p>
            ) : (
              <EscalationTable
                escalations={escalations}
                canEdit={canEdit}
                onEdit={(entry) => setEditingId(entry.id)}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </RequireAuth>
  );
}

"use client";

import { useState } from "react";

import { AssessmentForm } from "@/components/assessment-form";
import {
  AssessmentRosterTable,
  filterRoster,
  type RosterRow,
} from "@/components/assessment-roster-table";
import { useAuth } from "@/components/auth-provider";
import { OpsNetworkNav } from "@/components/ops-network-nav";
import { RequireAuth } from "@/components/require-auth";
import { ShellFrame } from "@/components/shell-frame";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGetAssessments } from "@/lib/api/generated/assessments/assessments";
import type { AssessmentResult } from "@/lib/api/generated/model";
import { useGetUsers } from "@/lib/api/generated/users/users";
import { ASSESSABLE_ROLES } from "@/lib/assessment/helpers";
import { canWriteReadiness, OPS_READINESS_ROLES } from "@/lib/network/roles";

type ResultFilter = AssessmentResult | "all";

const FILTER_ITEMS: { value: ResultFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pass", label: "Pass" },
  { value: "fail", label: "Fail" },
  { value: "pending", label: "Not assessed" },
];

export default function OpsAssessmentPage() {
  const { accessToken, user } = useAuth();
  const [filter, setFilter] = useState<ResultFilter>("all");

  const enabled = Boolean(accessToken);
  const usersQuery = useGetUsers(undefined, { query: { enabled } });
  const assessmentsQuery = useGetAssessments(undefined, { query: { enabled } });

  const canWrite = user ? canWriteReadiness(user.role) : false;
  const users = (usersQuery.data ?? []).filter((candidate) =>
    ASSESSABLE_ROLES.includes(candidate.role),
  );
  const assessments = assessmentsQuery.data ?? [];
  const isLoading = usersQuery.isLoading || assessmentsQuery.isLoading;
  const loadError = usersQuery.error ?? assessmentsQuery.error;

  const rows: RosterRow[] = users.map((candidate) => ({
    user: candidate,
    assessment: assessments.find((item) => item.userId === candidate.id) ?? null,
  }));

  return (
    <RequireAuth roles={OPS_READINESS_ROLES}>
      <ShellFrame title="Training assessment" eyebrow="Readiness">
        <div className="space-y-6">
          <OpsNetworkNav />

          {canWrite ? <AssessmentForm users={users} /> : null}

          <Card>
            <CardHeader>
              <CardTitle className="font-display text-lg">Roster</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="max-w-xs space-y-2">
                <Label>Result</Label>
                <Select
                  items={FILTER_ITEMS}
                  value={filter}
                  onValueChange={(value) => value && setFilter(value as ResultFilter)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FILTER_ITEMS.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {isLoading ? (
                <p className="text-sm text-muted-foreground">Loading…</p>
              ) : loadError ? (
                <p className="text-sm text-danger">{loadError.message}</p>
              ) : (
                <AssessmentRosterTable rows={filterRoster(rows, filter)} />
              )}
            </CardContent>
          </Card>
        </div>
      </ShellFrame>
    </RequireAuth>
  );
}

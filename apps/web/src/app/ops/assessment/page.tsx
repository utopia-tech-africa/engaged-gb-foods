"use client";

import { useState } from "react";

import { AssessmentForm } from "@/components/assessment-form";
import {
  AssessmentRosterTable,
  filterRoster,
  type RosterRow,
} from "@/components/assessment-roster-table";
import { useAuth } from "@/components/auth-provider";
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
  const usersQuery = useGetUsers({ isActive: true }, { query: { enabled } });
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
      <div className="space-y-6">
        <h1 className="font-display text-3xl font-semibold text-foreground md:text-4xl">
          Training assessment
        </h1>
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
              <TableSkeleton columns={5} rows={5} />
            ) : loadError ? (
              <p className="text-sm text-danger">{loadError.message}</p>
            ) : (
              <AssessmentRosterTable rows={filterRoster(rows, filter)} />
            )}
          </CardContent>
        </Card>
      </div>
    </RequireAuth>
  );
}

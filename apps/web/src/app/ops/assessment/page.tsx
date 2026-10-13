"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

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
import {
  ASSESSABLE_ROLES,
  type Assessment,
  type AssessmentResult,
  fetchAssessments,
} from "@/lib/assessment/api";
import { canWriteReadiness, OPS_READINESS_ROLES } from "@/lib/network/roles";
import { fetchUsers, type UserSummary } from "@/lib/users/api";

type ResultFilter = AssessmentResult | "all";

const FILTER_ITEMS: { value: ResultFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pass", label: "Pass" },
  { value: "fail", label: "Fail" },
  { value: "pending", label: "Not assessed" },
];

export default function OpsAssessmentPage() {
  const { accessToken, user } = useAuth();
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [filter, setFilter] = useState<ResultFilter>("all");
  const [isLoading, setIsLoading] = useState(true);

  const canWrite = user ? canWriteReadiness(user.role) : false;

  const loadData = useCallback(async (token: string): Promise<void> => {
    try {
      const [userList, assessmentList] = await Promise.all([
        fetchUsers(token),
        fetchAssessments(token),
      ]);
      setUsers(userList.filter((candidate) => ASSESSABLE_ROLES.includes(candidate.role)));
      setAssessments(assessmentList);
    } catch (loadError) {
      toast.error(loadError instanceof Error ? loadError.message : "Unable to load roster");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (accessToken) {
      void loadData(accessToken);
    }
  }, [accessToken, loadData]);

  const rows: RosterRow[] = users.map((candidate) => ({
    user: candidate,
    assessment: assessments.find((item) => item.userId === candidate.id) ?? null,
  }));

  return (
    <RequireAuth roles={OPS_READINESS_ROLES}>
      <ShellFrame title="Training assessment" eyebrow="Readiness">
        <div className="space-y-6">
          <OpsNetworkNav />

          {canWrite && accessToken ? (
            <AssessmentForm
              accessToken={accessToken}
              users={users}
              onSaved={() => loadData(accessToken)}
            />
          ) : null}

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

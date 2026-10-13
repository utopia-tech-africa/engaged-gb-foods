"use client";

import { format } from "date-fns";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Assessment, AssessmentResult } from "@/lib/assessment/api";
import type { UserSummary } from "@/lib/users/api";

export type RosterRow = { user: UserSummary; assessment: Assessment | null };

const resultOf = (row: RosterRow): AssessmentResult => row.assessment?.result ?? "pending";

export const filterRoster = (rows: RosterRow[], filter: AssessmentResult | "all"): RosterRow[] =>
  filter === "all" ? rows : rows.filter((row) => resultOf(row) === filter);

const failedSteps = (assessment: Assessment): string =>
  [
    assessment.safetyPass ? null : "safety",
    assessment.qualityPass ? null : "quality",
    assessment.recordsPass ? null : "records",
  ]
    .filter((step): step is string => step !== null)
    .join(", ");

export const AssessmentRosterTable = ({ rows }: { rows: RosterRow[] }) => {
  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">No users match this filter.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Staff ID</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Result</TableHead>
          <TableHead>Dispatch</TableHead>
          <TableHead>Failed steps</TableHead>
          <TableHead>Assessed</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => {
          const result = resultOf(row);
          return (
            <TableRow key={row.user.id}>
              <TableCell className="font-medium">{row.user.fullName}</TableCell>
              <TableCell className="font-mono text-xs">{row.user.staffId ?? "—"}</TableCell>
              <TableCell>{row.user.role.replace("_", " ")}</TableCell>
              <TableCell>
                <Badge
                  variant={
                    result === "pass" ? "default" : result === "fail" ? "destructive" : "secondary"
                  }
                >
                  {result}
                </Badge>
              </TableCell>
              <TableCell>{result === "pass" ? "Dispatchable" : "Not dispatchable"}</TableCell>
              <TableCell>{row.assessment ? failedSteps(row.assessment) || "—" : "—"}</TableCell>
              <TableCell>
                {row.assessment ? format(new Date(row.assessment.assessedAt), "dd MMM yyyy") : "—"}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};

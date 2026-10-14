"use client";

import { format } from "date-fns";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AssignmentResponseDto } from "@/lib/api/generated/model";
import {
  type AssignmentStatus,
  assignmentScopeLabel,
  assignmentStatus,
  SCOPE_TYPE_LABELS,
} from "@/lib/users/assignments";
import { USER_ROLE_LABELS } from "@/lib/users/roles";

type AssignmentsTableProps = {
  assignments: AssignmentResponseDto[];
  canWrite: boolean;
  onEnd: (assignment: AssignmentResponseDto) => void;
};

const headClass = "text-xs uppercase tracking-wide text-brand-ink";
const formatDay = (value: string): string => format(new Date(value), "dd MMM yyyy");

const STATUS_LABELS: Record<AssignmentStatus, string> = {
  active: "Active",
  upcoming: "Upcoming",
  ended: "Ended",
};

export const AssignmentsTable = ({ assignments, canWrite, onEnd }: AssignmentsTableProps) => (
  <Card className="overflow-hidden p-0">
    <Table>
      <TableHeader className="bg-brand-muted/40">
        <TableRow>
          <TableHead className={headClass}>Person</TableHead>
          <TableHead className={headClass}>Scope</TableHead>
          <TableHead className={headClass}>From</TableHead>
          <TableHead className={headClass}>To</TableHead>
          <TableHead className={headClass}>Status</TableHead>
          {canWrite ? <TableHead className={headClass}>Actions</TableHead> : null}
        </TableRow>
      </TableHeader>
      <TableBody>
        {assignments.map((assignment) => {
          const status = assignmentStatus(assignment);
          const scope = assignmentScopeLabel(assignment);
          return (
            <TableRow key={assignment.id}>
              <TableCell>
                <span className="block font-medium">{assignment.user.fullName}</span>
                <span className="text-xs text-brand-ink">
                  {USER_ROLE_LABELS[assignment.user.role]}
                  {assignment.user.staffId ? ` · ${assignment.user.staffId}` : ""}
                </span>
              </TableCell>
              <TableCell>
                <span className="block">{scope.name}</span>
                <span className="text-xs text-brand-ink">{SCOPE_TYPE_LABELS[scope.type]}</span>
              </TableCell>
              <TableCell>{formatDay(assignment.effectiveFrom)}</TableCell>
              <TableCell>
                {assignment.effectiveTo ? formatDay(assignment.effectiveTo) : "Open"}
              </TableCell>
              <TableCell>
                <Badge variant={status === "active" ? "secondary" : "outline"}>
                  {STATUS_LABELS[status]}
                </Badge>
              </TableCell>
              {canWrite ? (
                <TableCell>
                  {status === "ended" ? null : (
                    <Button size="sm" variant="outline" onClick={() => onEnd(assignment)}>
                      End assignment
                    </Button>
                  )}
                </TableCell>
              ) : null}
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  </Card>
);

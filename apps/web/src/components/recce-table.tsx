"use client";

import { format } from "date-fns";
import { ClipboardCheck } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { RecceResponseDto } from "@/lib/api/generated/model";

type RecceTableProps = {
  recces: RecceResponseDto[];
  canEdit: boolean;
  onEdit: (recce: RecceResponseDto) => void;
};

export const RecceTable = ({ recces, canEdit, onEdit }: RecceTableProps) => {
  if (recces.length === 0) {
    return (
      <EmptyState
        icon={ClipboardCheck}
        title="No recces recorded yet"
        description="Complete a recce checklist for a depot to show readiness."
      />
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Depot</TableHead>
          <TableHead>Decision</TableHead>
          <TableHead>Gaps</TableHead>
          <TableHead>Photos</TableHead>
          <TableHead>Recorded by</TableHead>
          <TableHead>Date</TableHead>
          {canEdit ? <TableHead className="text-right">Actions</TableHead> : null}
        </TableRow>
      </TableHeader>
      <TableBody>
        {recces.map((recce) => {
          const criticalCount = recce.gaps.filter((gap) => gap.isCritical).length;
          return (
            <TableRow key={recce.id}>
              <TableCell>
                <span className="font-mono text-xs">{recce.depot.code}</span> {recce.depot.name}
              </TableCell>
              <TableCell>
                <Badge variant={recce.decision === "ready" ? "default" : "destructive"}>
                  {recce.decision === "ready" ? "Ready" : "Hold"}
                </Badge>
              </TableCell>
              <TableCell>
                {recce.gaps.length}
                {criticalCount > 0 ? (
                  <Badge variant="destructive" className="ml-2">
                    {criticalCount} critical
                  </Badge>
                ) : null}
              </TableCell>
              <TableCell>{recce.evidence.length}</TableCell>
              <TableCell>{recce.author.fullName}</TableCell>
              <TableCell>{format(new Date(recce.createdAt), "dd MMM yyyy")}</TableCell>
              {canEdit ? (
                <TableCell className="text-right">
                  <Button type="button" variant="outline" size="sm" onClick={() => onEdit(recce)}>
                    Update
                  </Button>
                </TableCell>
              ) : null}
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};

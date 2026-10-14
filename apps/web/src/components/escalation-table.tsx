"use client";

import { format } from "date-fns";
import { AlertTriangle } from "lucide-react";

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
import type { EscalationResponseDto, EscalationStatus } from "@/lib/api/generated/model";
import { STATUS_LABELS, TRIGGER_LABELS } from "@/lib/escalation/constants";

type EscalationTableProps = {
  escalations: EscalationResponseDto[];
  canEdit: boolean;
  onEdit: (escalation: EscalationResponseDto) => void;
};

const STATUS_VARIANTS: Record<EscalationStatus, "destructive" | "secondary" | "outline"> = {
  open: "destructive",
  in_progress: "secondary",
  resolved: "outline",
};

export const EscalationTable = ({ escalations, canEdit, onEdit }: EscalationTableProps) => {
  if (escalations.length === 0) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="No escalations match this filter"
        description="Open exceptions from the field will appear here."
      />
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Depot</TableHead>
          <TableHead>Trigger</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Note</TableHead>
          <TableHead>Owner</TableHead>
          <TableHead>Due</TableHead>
          <TableHead>Reported</TableHead>
          {canEdit ? <TableHead className="text-right">Actions</TableHead> : null}
        </TableRow>
      </TableHeader>
      <TableBody>
        {escalations.map((entry) => (
          <TableRow key={entry.id}>
            <TableCell className="font-medium">{entry.depot.name}</TableCell>
            <TableCell>{TRIGGER_LABELS[entry.trigger]}</TableCell>
            <TableCell>
              <Badge variant={STATUS_VARIANTS[entry.status]}>{STATUS_LABELS[entry.status]}</Badge>
            </TableCell>
            <TableCell className="max-w-xs truncate">{entry.note}</TableCell>
            <TableCell>{entry.ownerName ?? "—"}</TableCell>
            <TableCell>
              {entry.dueAt ? format(new Date(entry.dueAt), "dd MMM yyyy") : "—"}
            </TableCell>
            <TableCell>
              {format(new Date(entry.createdAt), "dd MMM HH:mm")} · {entry.reportedBy.fullName}
            </TableCell>
            {canEdit ? (
              <TableCell className="text-right">
                <Button variant="outline" size="sm" onClick={() => onEdit(entry)}>
                  Update
                </Button>
              </TableCell>
            ) : null}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

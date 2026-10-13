"use client";

import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { DailyReturnResponseDto } from "@/lib/api/generated/model";

type DailyReturnTableProps = {
  returns: DailyReturnResponseDto[];
  canEdit: boolean;
  onEdit: (dailyReturn: DailyReturnResponseDto) => void;
};

export const DailyReturnTable = ({ returns, canEdit, onEdit }: DailyReturnTableProps) => {
  if (returns.length === 0) {
    return <p className="text-sm text-muted-foreground">No returns submitted for this date.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Region</TableHead>
          <TableHead>Planned</TableHead>
          <TableHead>Completed</TableHead>
          <TableHead>Exceptions</TableHead>
          <TableHead>Incidents</TableHead>
          <TableHead>Submitted by</TableHead>
          <TableHead>Submitted</TableHead>
          {canEdit ? <TableHead className="text-right">Actions</TableHead> : null}
        </TableRow>
      </TableHeader>
      <TableBody>
        {returns.map((entry) => (
          <TableRow key={entry.id}>
            <TableCell className="font-medium">{entry.region.name}</TableCell>
            <TableCell>{entry.depotsPlanned}</TableCell>
            <TableCell>{entry.depotsCompleted}</TableCell>
            <TableCell>{entry.depotsException}</TableCell>
            <TableCell className="max-w-xs truncate">{entry.incidentsSummary ?? "—"}</TableCell>
            <TableCell>{entry.submittedBy.fullName}</TableCell>
            <TableCell>{format(new Date(entry.submittedAt), "dd MMM HH:mm")}</TableCell>
            {canEdit ? (
              <TableCell className="text-right">
                <Button variant="outline" size="sm" onClick={() => onEdit(entry)}>
                  Edit
                </Button>
              </TableCell>
            ) : null}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

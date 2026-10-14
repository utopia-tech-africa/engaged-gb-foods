"use client";

import { Route } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { DispatchDayResponseDto } from "@/lib/api/generated/model";

type DispatchTableProps = {
  dispatches: DispatchDayResponseDto[];
  selectedId: string | null;
  onSelect: (dispatch: DispatchDayResponseDto) => void;
};

export const DispatchTable = ({ dispatches, selectedId, onSelect }: DispatchTableProps) => {
  if (dispatches.length === 0) {
    return (
      <EmptyState
        icon={Route}
        title="No dispatch plans for this date"
        description="Create a plan for a cluster, then freeze it when ready."
      />
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Cluster</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Depots</TableHead>
          <TableHead>Created by</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {dispatches.map((dispatch) => {
          const isSelected = dispatch.id === selectedId;
          return (
            <TableRow
              key={dispatch.id}
              data-state={isSelected ? "selected" : undefined}
              className="cursor-pointer"
              onClick={() => onSelect(dispatch)}
            >
              <TableCell className="font-medium">
                {dispatch.cluster.code} — {dispatch.cluster.name}
              </TableCell>
              <TableCell>
                <Badge variant={dispatch.status === "frozen" ? "default" : "secondary"}>
                  {dispatch.status}
                </Badge>
              </TableCell>
              <TableCell>{dispatch.slots.length}</TableCell>
              <TableCell>{dispatch.createdBy.fullName}</TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};

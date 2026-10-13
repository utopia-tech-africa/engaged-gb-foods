"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  getGetAssignmentsQueryKey,
  usePatchAssignmentsById,
} from "@/lib/api/generated/assignments/assignments";
import type { AssignmentResponseDto } from "@/lib/api/generated/model";
import { assignmentScopeLabel } from "@/lib/users/assignments";

type AssignmentEndDialogProps = {
  assignment: AssignmentResponseDto;
  onClose: () => void;
};

/** Confirms ending an assignment now. Mount only while open. */
export const AssignmentEndDialog = ({ assignment, onClose }: AssignmentEndDialogProps) => {
  const queryClient = useQueryClient();
  const endAssignment = usePatchAssignmentsById();
  const [error, setError] = useState<string | null>(null);
  const scope = assignmentScopeLabel(assignment);

  const onConfirm = async (): Promise<void> => {
    setError(null);
    try {
      await endAssignment.mutateAsync({ id: assignment.id, data: {} });
      await queryClient.invalidateQueries({ queryKey: getGetAssignmentsQueryKey() });
      onClose();
    } catch (mutationError) {
      setError(mutationError instanceof Error ? mutationError.message : "Unable to end assignment");
    }
  };

  return (
    <Dialog open onOpenChange={(open) => (open ? undefined : onClose())}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>End assignment</DialogTitle>
          <DialogDescription>
            {assignment.user.fullName} will lose access to {scope.name} depots from now.
          </DialogDescription>
        </DialogHeader>
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={endAssignment.isPending} onClick={() => void onConfirm()}>
            {endAssignment.isPending ? "Ending…" : "End assignment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

"use client";

import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";

import { DatePicker } from "@/components/date-picker";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  getGetEscalationsQueryKey,
  usePatchEscalationsById,
} from "@/lib/api/generated/escalations/escalations";
import type { EscalationResponseDto, EscalationStatus } from "@/lib/api/generated/model";
import { STATUS_LABELS, STATUSES, TRIGGER_LABELS } from "@/lib/escalation/constants";

type EscalationTriageFormProps = {
  escalation: EscalationResponseDto;
  onDone: () => void;
};

const statusItems = STATUSES.map((value) => ({ value, label: STATUS_LABELS[value] }));

/** Remount with a new `key` whenever the selected escalation changes. */
export const EscalationTriageForm = ({ escalation, onDone }: EscalationTriageFormProps) => {
  const queryClient = useQueryClient();
  const patchEscalation = usePatchEscalationsById();
  const [status, setStatus] = useState<EscalationStatus>(escalation.status);
  const [ownerName, setOwnerName] = useState(escalation.ownerName ?? "");
  const [dueDate, setDueDate] = useState(
    escalation.dueAt ? format(new Date(escalation.dueAt), "yyyy-MM-dd") : "",
  );
  const [writtenRecord, setWrittenRecord] = useState(escalation.writtenRecord ?? "");

  const onSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    try {
      await patchEscalation.mutateAsync({
        id: escalation.id,
        data: {
          status,
          ownerName: ownerName.trim(),
          writtenRecord: writtenRecord.trim(),
          ...(dueDate ? { dueAt: new Date(`${dueDate}T00:00:00.000Z`).toISOString() } : {}),
        },
      });
      await queryClient.invalidateQueries({ queryKey: getGetEscalationsQueryKey() });
      toast.success("Escalation updated");
      onDone();
    } catch (submitError) {
      toast.error(
        submitError instanceof Error ? submitError.message : "Unable to update escalation",
      );
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display text-lg">
          Update escalation · {escalation.depot.name} · {TRIGGER_LABELS[escalation.trigger]}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-4 text-sm text-muted-foreground">{escalation.note}</p>
        <form onSubmit={(event) => void onSubmit(event)} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                items={statusItems}
                value={status}
                onValueChange={(value) => value && setStatus(value as EscalationStatus)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusItems.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="escalation-owner">Owner</Label>
              <Input
                id="escalation-owner"
                value={ownerName}
                onChange={(event) => setOwnerName(event.target.value)}
                autoComplete="off"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="escalation-due">Due date</Label>
              <DatePicker id="escalation-due" value={dueDate} onChange={setDueDate} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="escalation-record">Written record</Label>
            <Textarea
              id="escalation-record"
              value={writtenRecord}
              onChange={(event) => setWrittenRecord(event.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={patchEscalation.isPending}>
              {patchEscalation.isPending ? "Saving…" : "Save changes"}
            </Button>
            <Button type="button" variant="outline" onClick={onDone}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

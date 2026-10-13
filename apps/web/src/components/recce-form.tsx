"use client";

import { useQueryClient } from "@tanstack/react-query";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";

import { type GapDraft, RecceGapRows } from "@/components/recce-gap-rows";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import type {
  DepotResponseDto,
  RecceChecklistResponseDto,
  RecceDecision,
  RecceResponseDto,
} from "@/lib/api/generated/model";
import {
  getGetReccesQueryKey,
  usePatchReccesById,
  usePostRecces,
} from "@/lib/api/generated/recces/recces";

type ChecklistFlag = Exclude<keyof RecceChecklistResponseDto, "stockEstimateNote">;

const CHECKLIST_ITEMS: { key: ChecklistFlag; label: string }[] = [
  { key: "access", label: "Access (vehicles and staff)" },
  { key: "stockEstimate", label: "Stock estimate done" },
  { key: "workspace", label: "Workspace available" },
  { key: "power", label: "Power available" },
  { key: "signal", label: "Mobile signal" },
  { key: "holdingZones", label: "Holding zones possible" },
];

const EMPTY_CHECKLIST: RecceChecklistResponseDto = {
  access: false,
  stockEstimate: false,
  workspace: false,
  power: false,
  signal: false,
  holdingZones: false,
};

const DECISION_ITEMS = [
  { value: "ready", label: "Ready" },
  { value: "hold", label: "Hold" },
];

type RecceFormProps = {
  depots: DepotResponseDto[];
  /** When set the form updates this recce (PATCH); otherwise it creates one. */
  editing: RecceResponseDto | null;
  onSaved: () => void;
  onCancelEdit: () => void;
};

export const RecceForm = ({ depots, editing, onSaved, onCancelEdit }: RecceFormProps) => {
  const queryClient = useQueryClient();
  const createRecce = usePostRecces();
  const updateRecce = usePatchReccesById();
  const [depotId, setDepotId] = useState(editing?.depotId ?? "");
  const [checklist, setChecklist] = useState<RecceChecklistResponseDto>(
    editing?.checklist ?? EMPTY_CHECKLIST,
  );
  const [decision, setDecision] = useState<RecceDecision>(editing?.decision ?? "hold");
  const [notes, setNotes] = useState(editing?.notes ?? "");
  const [gaps, setGaps] = useState<GapDraft[]>(
    editing?.gaps.map((gap) => ({
      key: gap.id,
      description: gap.description,
      ownerName: gap.ownerName,
      dueAt: gap.dueAt ? gap.dueAt.slice(0, 10) : "",
      isCritical: gap.isCritical,
    })) ?? [],
  );

  const hasCriticalGap = gaps.some((gap) => gap.isCritical);
  const effectiveDecision: RecceDecision = hasCriticalGap ? "hold" : decision;

  const onSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (!depotId) {
      toast.error("Select a depot");
      return;
    }

    const body = {
      checklist: {
        ...checklist,
        stockEstimateNote: checklist.stockEstimateNote?.trim() || undefined,
      },
      decision: effectiveDecision,
      notes: notes.trim(),
      gaps: gaps.map((gap) => ({
        description: gap.description,
        ownerName: gap.ownerName,
        dueAt: gap.dueAt || undefined,
        isCritical: gap.isCritical,
      })),
    };

    try {
      if (editing) {
        await updateRecce.mutateAsync({ id: editing.id, data: body });
        toast.success("Recce updated");
      } else {
        await createRecce.mutateAsync({ data: { depotId, ...body } });
        toast.success("Recce recorded");
      }
      await queryClient.invalidateQueries({ queryKey: getGetReccesQueryKey() });
      onSaved();
    } catch (submitError) {
      toast.error(submitError instanceof Error ? submitError.message : "Unable to save recce");
    }
  };

  const isSubmitting = createRecce.isPending || updateRecce.isPending;

  const depotItems = depots.map((depot) => ({
    value: depot.id,
    label: `${depot.code} — ${depot.name}`,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display text-lg">
          {editing ? `Update recce — ${editing.depot.name}` : "Record recce"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={(event) => void onSubmit(event)} className="space-y-5">
          <div className="max-w-md space-y-2">
            <Label>Depot</Label>
            <Select
              items={depotItems}
              value={depotId}
              disabled={editing !== null}
              onValueChange={(value) => value && setDepotId(value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select depot" />
              </SelectTrigger>
              <SelectContent>
                {depotItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <fieldset className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <legend className="mb-2 text-sm font-medium">Checklist</legend>
            {CHECKLIST_ITEMS.map((item) => (
              <div key={item.key} className="flex items-center gap-2">
                <Checkbox
                  id={`recce-${item.key}`}
                  checked={checklist[item.key]}
                  onCheckedChange={(checked) =>
                    setChecklist((current) => ({ ...current, [item.key]: checked }))
                  }
                />
                <Label htmlFor={`recce-${item.key}`}>{item.label}</Label>
              </div>
            ))}
          </fieldset>

          <div className="max-w-md space-y-2">
            <Label htmlFor="recce-stock-note">Stock estimate note</Label>
            <Input
              id="recce-stock-note"
              placeholder="e.g. about 400 cases"
              value={checklist.stockEstimateNote ?? ""}
              onChange={(event) =>
                setChecklist((current) => ({ ...current, stockEstimateNote: event.target.value }))
              }
            />
          </div>

          <RecceGapRows gaps={gaps} onChange={setGaps} />

          <div className="space-y-2">
            <Label htmlFor="recce-notes">Notes</Label>
            <Textarea
              id="recce-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </div>

          <div className="max-w-xs space-y-2">
            <Label>Decision</Label>
            <Select
              items={DECISION_ITEMS}
              value={effectiveDecision}
              onValueChange={(value) => value && setDecision(value as RecceDecision)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ready" disabled={hasCriticalGap}>
                  Ready
                </SelectItem>
                <SelectItem value="hold">Hold</SelectItem>
              </SelectContent>
            </Select>
            {hasCriticalGap ? (
              <p className="text-xs text-muted-foreground">
                A critical gap is open, so this depot stays on hold.
              </p>
            ) : null}
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving…" : editing ? "Save changes" : "Record recce"}
            </Button>
            {editing ? (
              <Button type="button" variant="outline" onClick={onCancelEdit}>
                Cancel
              </Button>
            ) : null}
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

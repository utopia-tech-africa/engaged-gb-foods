"use client";

import { PlusIcon, Trash2Icon } from "lucide-react";

import { DatePicker } from "@/components/date-picker";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type GapDraft = {
  key: string;
  description: string;
  ownerName: string;
  dueAt: string;
  isCritical: boolean;
};

export const createGapDraft = (): GapDraft => ({
  key: crypto.randomUUID(),
  description: "",
  ownerName: "",
  dueAt: "",
  isCritical: false,
});

type RecceGapRowsProps = {
  gaps: GapDraft[];
  disabled?: boolean;
  onChange: (gaps: GapDraft[]) => void;
};

export const RecceGapRows = ({ gaps, disabled, onChange }: RecceGapRowsProps) => {
  const updateGap = (key: string, patch: Partial<GapDraft>) =>
    onChange(gaps.map((gap) => (gap.key === key ? { ...gap, ...patch } : gap)));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>Gaps</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={() => onChange([...gaps, createGapDraft()])}
        >
          <PlusIcon className="size-4" />
          Add gap
        </Button>
      </div>
      {gaps.length === 0 ? (
        <p className="text-sm text-muted-foreground">No gaps recorded.</p>
      ) : null}
      {gaps.map((gap, index) => (
        <div
          key={gap.key}
          className="grid gap-3 rounded-lg border border-border p-3 md:grid-cols-[2fr_1fr_1fr_auto]"
        >
          <div className="space-y-1.5">
            <Label htmlFor={`gap-description-${gap.key}`}>Gap {index + 1}</Label>
            <Input
              id={`gap-description-${gap.key}`}
              required
              disabled={disabled}
              placeholder="What is missing or unsafe"
              value={gap.description}
              onChange={(event) => updateGap(gap.key, { description: event.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`gap-owner-${gap.key}`}>Owner</Label>
            <Input
              id={`gap-owner-${gap.key}`}
              required
              disabled={disabled}
              placeholder="Who fixes it"
              value={gap.ownerName}
              onChange={(event) => updateGap(gap.key, { ownerName: event.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`gap-due-${gap.key}`}>Deadline</Label>
            <DatePicker
              id={`gap-due-${gap.key}`}
              disabled={disabled}
              value={gap.dueAt}
              onChange={(dueAt) => updateGap(gap.key, { dueAt })}
            />
          </div>
          <div className="flex items-end gap-3">
            <div className="flex h-9 items-center gap-2">
              <Checkbox
                id={`gap-critical-${gap.key}`}
                disabled={disabled}
                checked={gap.isCritical}
                onCheckedChange={(checked) => updateGap(gap.key, { isCritical: checked })}
              />
              <Label htmlFor={`gap-critical-${gap.key}`}>Critical</Label>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`Remove gap ${index + 1}`}
              disabled={disabled}
              onClick={() => onChange(gaps.filter((item) => item.key !== gap.key))}
            >
              <Trash2Icon className="size-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};

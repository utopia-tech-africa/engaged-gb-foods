"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { CardListSkeleton } from "@/components/list-skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
  getGetDispatchesQueryKey,
  useGetDispatchesCandidates,
  usePostDispatches,
  usePostDispatchesByIdFreeze,
} from "@/lib/api/generated/dispatches/dispatches";
import type {
  DispatchCandidateResponseDto,
  DispatchDayResponseDto,
} from "@/lib/api/generated/model";

type ClusterOption = { id: string; code: string; name: string };

type DispatchPlannerProps = {
  clusters: ClusterOption[];
  date: string;
  clusterId: string;
  onClusterChange: (clusterId: string) => void;
  existing: DispatchDayResponseDto | null;
  onCreated?: (dispatch: DispatchDayResponseDto) => void;
};

type SlotDraft = {
  depotId: string;
  qcUserId: string;
};

const candidateKey = (candidate: DispatchCandidateResponseDto): string => candidate.depot.id;

export const DispatchPlanner = ({
  clusters,
  date,
  clusterId,
  onClusterChange,
  existing,
  onCreated,
}: DispatchPlannerProps) => {
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState(existing?.notes ?? "");
  const [selected, setSelected] = useState<Record<string, SlotDraft>>({});

  const candidatesQuery = useGetDispatchesCandidates(
    { date, clusterId, excludeDispatchId: existing?.id },
    { query: { enabled: Boolean(date && clusterId) } },
  );

  const createMutation = usePostDispatches();
  const freezeMutation = usePostDispatchesByIdFreeze();

  const candidates = candidatesQuery.data ?? [];
  const isFrozen = existing?.status === "frozen";

  const clusterItems = useMemo(
    () => [
      { value: "", label: "Select cluster" },
      ...clusters.map((cluster) => ({
        value: cluster.id,
        label: `${cluster.code} — ${cluster.name}`,
      })),
    ],
    [clusters],
  );

  useEffect(() => {
    if (!existing) {
      setSelected({});
      setNotes("");
      return;
    }
    setNotes(existing.notes ?? "");
    setSelected(
      Object.fromEntries(
        existing.slots.map((slot) => [
          slot.depotId,
          { depotId: slot.depotId, qcUserId: slot.qcUserId },
        ]),
      ),
    );
  }, [existing]);

  const selectable = candidates.filter(
    (candidate) => !candidate.blockReason && !candidate.alreadyPlanned,
  );

  const toggleDepot = (candidate: DispatchCandidateResponseDto, checked: boolean) => {
    const depotId = candidate.depot.id;
    setSelected((prev) => {
      if (!checked) {
        const next = { ...prev };
        delete next[depotId];
        return next;
      }
      const qcUserId = candidate.suggestedQc?.id ?? candidate.eligibleQcs[0]?.id;
      if (!qcUserId) {
        return prev;
      }
      return { ...prev, [depotId]: { depotId, qcUserId } };
    });
  };

  const setQc = (depotId: string, qcUserId: string) => {
    setSelected((prev) => ({
      ...prev,
      [depotId]: { depotId, qcUserId },
    }));
  };

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: getGetDispatchesQueryKey({ date }) });
    await candidatesQuery.refetch();
  };

  const saveDraft = async () => {
    if (!clusterId) {
      toast.error("Select a cluster");
      return;
    }
    const slots = Object.values(selected);
    if (slots.length === 0) {
      toast.error("Select at least one depot");
      return;
    }
    if (existing) {
      toast.message("Editing an existing draft — freeze it, or start a new date/cluster");
      return;
    }

    try {
      const created = await createMutation.mutateAsync({
        data: {
          clusterId,
          date,
          notes: notes.trim() || undefined,
          slots: slots.map((slot, index) => ({ ...slot, sortOrder: index })),
        },
      });
      toast.success("Draft dispatch saved");
      await invalidate();
      onCreated?.(created);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save draft");
    }
  };

  const freeze = async () => {
    if (!existing) {
      toast.error("Save a draft before freezing");
      return;
    }
    try {
      await freezeMutation.mutateAsync({ id: existing.id });
      toast.success("Route frozen — scheduled visits created");
      await invalidate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to freeze route");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display text-lg">
          {isFrozen ? "Frozen route" : "Plan next-day route"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Cluster</Label>
            <Select
              items={clusterItems}
              value={clusterId}
              onValueChange={(value) => value !== null && onClusterChange(value)}
              disabled={Boolean(existing)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select cluster" />
              </SelectTrigger>
              <SelectContent>
                {clusterItems
                  .filter((item) => item.value !== "")
                  .map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="dispatch-notes">Notes</Label>
            <Textarea
              id="dispatch-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              disabled={isFrozen || Boolean(existing)}
              placeholder="Optional route notes"
              rows={2}
            />
          </div>
        </div>

        {!clusterId ? (
          <p className="text-sm text-muted-foreground">Pick a cluster to see ready depots.</p>
        ) : candidatesQuery.isLoading ? (
          <CardListSkeleton count={3} />
        ) : candidatesQuery.error ? (
          <p className="text-sm text-danger">{candidatesQuery.error.message}</p>
        ) : (
          <ul className="divide-y divide-border rounded-md border border-border">
            {candidates.map((candidate) => {
              const depotId = candidateKey(candidate);
              const isSelected = Boolean(selected[depotId]);
              const blocked = Boolean(candidate.blockReason) || candidate.alreadyPlanned;
              const qcItems = candidate.eligibleQcs.map((qc) => ({
                value: qc.id,
                label: `${qc.fullName}${qc.staffId ? ` (${qc.staffId})` : ""}`,
              }));

              return (
                <li key={depotId} className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center">
                  <div className="flex flex-1 items-start gap-3">
                    <Checkbox
                      checked={isSelected}
                      disabled={isFrozen || blocked || Boolean(existing)}
                      onCheckedChange={(checked) => toggleDepot(candidate, checked === true)}
                      aria-label={`Include ${candidate.depot.code}`}
                    />
                    <div>
                      <p className="font-medium text-foreground">
                        {candidate.depot.code} — {candidate.depot.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {candidate.depot.distributorName} · {candidate.depot.readiness}
                      </p>
                      {candidate.alreadyPlanned ? (
                        <p className="text-sm text-amber-700">
                          Already on another plan for this day
                        </p>
                      ) : null}
                      {candidate.blockReason ? (
                        <p className="text-sm text-danger">{candidate.blockReason}</p>
                      ) : null}
                    </div>
                  </div>
                  {isSelected && qcItems.length > 0 ? (
                    <div className="w-full sm:w-56">
                      <Select
                        items={qcItems}
                        value={selected[depotId]?.qcUserId ?? ""}
                        onValueChange={(value) => value && setQc(depotId, value)}
                        disabled={isFrozen || Boolean(existing)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="QC" />
                        </SelectTrigger>
                        <SelectContent>
                          {qcItems.map((item) => (
                            <SelectItem key={item.value} value={item.value}>
                              {item.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : null}
                </li>
              );
            })}
            {candidates.length === 0 ? (
              <li className="p-3 text-sm text-muted-foreground">No depots in this cluster.</li>
            ) : null}
          </ul>
        )}

        {!isFrozen && !existing ? (
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              onClick={() => void saveDraft()}
              disabled={createMutation.isPending || selectable.length === 0}
            >
              {createMutation.isPending ? "Saving…" : "Save draft"}
            </Button>
            <p className="self-center text-sm text-muted-foreground">
              {Object.keys(selected).length} depot
              {Object.keys(selected).length === 1 ? "" : "s"} selected
            </p>
          </div>
        ) : null}

        {existing && !isFrozen ? (
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              onClick={() => void freeze()}
              disabled={freezeMutation.isPending || existing.slots.length === 0}
            >
              {freezeMutation.isPending ? "Freezing…" : "Freeze route"}
            </Button>
            <p className="self-center text-sm text-muted-foreground">
              Freezing creates scheduled visits and locks this plan.
            </p>
          </div>
        ) : null}

        {isFrozen ? (
          <p className="text-sm text-muted-foreground">
            Frozen {existing?.frozenAt ? new Date(existing.frozenAt).toLocaleString() : ""}.
            Scheduled visits are ready for field check-in.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
};

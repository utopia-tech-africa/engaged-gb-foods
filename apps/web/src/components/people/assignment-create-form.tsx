"use client";

import { useQueryClient } from "@tanstack/react-query";
import { type FormEvent, useState } from "react";

import { DatePicker } from "@/components/date-picker";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  type SelectOption,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getGetAssignmentsQueryKey,
  usePostAssignments,
} from "@/lib/api/generated/assignments/assignments";
import { useGetClusters } from "@/lib/api/generated/clusters/clusters";
import { useGetDistributors } from "@/lib/api/generated/distributors/distributors";
import type { CreateAssignmentDto, UserResponseDto } from "@/lib/api/generated/model";
import { useGetRegions } from "@/lib/api/generated/regions/regions";
import {
  type AssignmentScopeType,
  endOfDayIso,
  isScopeType,
  SCOPE_TYPE_LABELS,
  startOfDayIso,
} from "@/lib/users/assignments";
import { USER_ROLE_LABELS } from "@/lib/users/roles";

const SCOPE_TYPE_OPTIONS = (Object.keys(SCOPE_TYPE_LABELS) as AssignmentScopeType[]).map(
  (type) => ({ value: type, label: SCOPE_TYPE_LABELS[type] }),
);

type AssignmentCreateFormProps = {
  users: UserResponseDto[];
  enabled: boolean;
};

export const AssignmentCreateForm = ({ users, enabled }: AssignmentCreateFormProps) => {
  const queryClient = useQueryClient();
  const createAssignment = usePostAssignments();
  const [userId, setUserId] = useState("");
  const [scopeType, setScopeType] = useState<AssignmentScopeType>("distributor");
  const [scopeId, setScopeId] = useState("");
  const [effectiveFrom, setEffectiveFrom] = useState("");
  const [effectiveTo, setEffectiveTo] = useState("");
  const [error, setError] = useState<string | null>(null);

  const distributorsQuery = useGetDistributors(undefined, { query: { enabled } });
  const clustersQuery = useGetClusters(undefined, { query: { enabled } });
  const regionsQuery = useGetRegions({ query: { enabled } });

  const scopeOptions: Record<AssignmentScopeType, SelectOption[]> = {
    distributor: (distributorsQuery.data ?? []).map((item) => ({
      value: item.id,
      label: `${item.code} — ${item.name}`,
    })),
    cluster: (clustersQuery.data ?? []).map((item) => ({
      value: item.id,
      label: `${item.code} — ${item.name}`,
    })),
    region: (regionsQuery.data ?? []).map((item) => ({
      value: item.id,
      label: `${item.code} — ${item.name}`,
    })),
  };
  const options = scopeOptions[scopeType];
  const userOptions = users.map((user) => ({
    value: user.id,
    label: `${user.fullName} · ${USER_ROLE_LABELS[user.role]}${user.staffId ? ` · ${user.staffId}` : ""}`,
  }));

  const onSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setError(null);
    if (!userId || !scopeId) {
      setError("Choose a person and a scope");
      return;
    }
    const data: CreateAssignmentDto = {
      userId,
      distributorId: scopeType === "distributor" ? scopeId : undefined,
      clusterId: scopeType === "cluster" ? scopeId : undefined,
      regionId: scopeType === "region" ? scopeId : undefined,
      effectiveFrom: effectiveFrom ? startOfDayIso(effectiveFrom) : undefined,
      effectiveTo: effectiveTo ? endOfDayIso(effectiveTo) : undefined,
    };
    try {
      await createAssignment.mutateAsync({ data });
      await queryClient.invalidateQueries({ queryKey: getGetAssignmentsQueryKey() });
      setScopeId("");
      setEffectiveFrom("");
      setEffectiveTo("");
    } catch (mutationError) {
      setError(
        mutationError instanceof Error ? mutationError.message : "Unable to create assignment",
      );
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display text-lg">Add assignment</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={(event) => void onSubmit(event)} className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Person</Label>
            <Select
              items={userOptions}
              value={userId}
              onValueChange={(value) => value && setUserId(value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select person" />
              </SelectTrigger>
              <SelectContent>
                {userOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Scope type</Label>
            <Select
              items={SCOPE_TYPE_OPTIONS}
              value={scopeType}
              onValueChange={(value) => {
                if (value && isScopeType(value)) {
                  setScopeType(value);
                  setScopeId("");
                }
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select scope type" />
              </SelectTrigger>
              <SelectContent>
                {SCOPE_TYPE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>{SCOPE_TYPE_LABELS[scopeType]}</Label>
            <Select
              items={options}
              value={scopeId}
              onValueChange={(value) => value && setScopeId(value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={`Select ${SCOPE_TYPE_LABELS[scopeType].toLowerCase()}`} />
              </SelectTrigger>
              <SelectContent>
                {options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {options.length === 0 ? (
              <p className="text-xs text-brand-ink">
                No {SCOPE_TYPE_LABELS[scopeType].toLowerCase()}s available.
              </p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="assignment-from">Effective from (defaults to today)</Label>
            <DatePicker
              id="assignment-from"
              value={effectiveFrom}
              onChange={setEffectiveFrom}
              placeholder="Today"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="assignment-to">Effective to (optional)</Label>
            <DatePicker
              id="assignment-to"
              value={effectiveTo}
              onChange={setEffectiveTo}
              placeholder="Open-ended"
            />
          </div>
          {error ? <p className="text-sm text-danger md:col-span-2">{error}</p> : null}
          <Button
            type="submit"
            disabled={createAssignment.isPending}
            className="w-fit md:col-span-2"
          >
            {createAssignment.isPending ? "Saving…" : "Create assignment"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

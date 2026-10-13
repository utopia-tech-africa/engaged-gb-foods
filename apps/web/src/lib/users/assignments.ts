import type { AssignmentResponseDto } from "@/lib/api/generated/model";

export type AssignmentScopeType = "distributor" | "cluster" | "region";
export type AssignmentStatus = "active" | "upcoming" | "ended";

export const SCOPE_TYPE_LABELS: Record<AssignmentScopeType, string> = {
  distributor: "Distributor",
  cluster: "Cluster",
  region: "Region",
};

export const isScopeType = (value: string): value is AssignmentScopeType =>
  value === "distributor" || value === "cluster" || value === "region";

export const assignmentStatus = (
  assignment: AssignmentResponseDto,
  now: Date = new Date(),
): AssignmentStatus => {
  if (new Date(assignment.effectiveFrom) > now) {
    return "upcoming";
  }
  if (assignment.effectiveTo && new Date(assignment.effectiveTo) < now) {
    return "ended";
  }
  return "active";
};

export const assignmentScopeLabel = (
  assignment: AssignmentResponseDto,
): { type: AssignmentScopeType; name: string } => {
  if (assignment.distributor) {
    return { type: "distributor", name: assignment.distributor.name };
  }
  if (assignment.cluster) {
    return { type: "cluster", name: assignment.cluster.name };
  }
  return { type: "region", name: assignment.region?.name ?? "—" };
};

/** Date-only picker value to ISO start of day (UTC). */
export const startOfDayIso = (value: string): string => `${value}T00:00:00.000Z`;

/** Date-only picker value to ISO end of day (UTC), so the assignment covers that whole day. */
export const endOfDayIso = (value: string): string => `${value}T23:59:59.999Z`;

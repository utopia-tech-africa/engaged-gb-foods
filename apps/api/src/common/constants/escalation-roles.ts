import type { UserRole } from "@prisma/client";

/** Roles that may raise a field exception (escalation). */
export const ESCALATION_FIELD_WRITE_ROLES: UserRole[] = [
  "qc",
  "cluster_supervisor",
  "regional_supervisor",
  "national_ops",
  "national_quality",
  "admin",
];

/** Roles that may triage escalations: status, owner, due date, written record. */
export const ESCALATION_OPS_WRITE_ROLES: UserRole[] = [
  "admin",
  "national_ops",
  "national_quality",
  "regional_supervisor",
  "cluster_supervisor",
];

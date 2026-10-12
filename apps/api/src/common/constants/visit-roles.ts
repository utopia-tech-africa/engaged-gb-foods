import type { UserRole } from "@prisma/client";

/** Roles that may list and read visit reconciliation across the network. */
export const VISIT_READ_ROLES: UserRole[] = [
  "qc",
  "handler",
  "cluster_supervisor",
  "regional_supervisor",
  "national_ops",
  "national_quality",
  "admin",
  "gbfoods_reviewer",
];

/** Field roles that may sign as QC or depot representative and close visits on site. */
export const FIELD_VISIT_CLOSE_ROLES: UserRole[] = [
  "qc",
  "handler",
  "cluster_supervisor",
  "regional_supervisor",
];

/** Supervisor roles that may sign as cluster supervisor. */
export const VISIT_CLUSTER_SUPERVISOR_SIGN_ROLES: UserRole[] = [
  "cluster_supervisor",
  "regional_supervisor",
  "national_ops",
  "national_quality",
  "admin",
];

export const DISPOSITION_WRITE_ROLES: UserRole[] = ["gbfoods_reviewer", "admin"];

export const CUSTODIAN_WRITE_ROLES: UserRole[] = [
  "qc",
  "handler",
  "cluster_supervisor",
  "regional_supervisor",
  "admin",
];

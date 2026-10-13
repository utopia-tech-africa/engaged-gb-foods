import type { UserRole } from "@prisma/client";

/** Roles that may record or update recces and training assessments. */
export const READINESS_WRITE_ROLES: UserRole[] = [
  "admin",
  "national_ops",
  "regional_supervisor",
  "national_quality",
];

/** Roles that may list users (assessment roster pickers). */
export const USERS_READ_ROLES: UserRole[] = [
  "admin",
  "national_ops",
  "national_quality",
  "regional_supervisor",
];

/** Field roles that sit on the training assessment roster. */
export const ASSESSABLE_ROLES: UserRole[] = ["qc", "handler", "cluster_supervisor"];

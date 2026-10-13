import type { UserRole } from "@prisma/client";

/** Roles that sign in with staff ID + PIN. */
export const FIELD_USER_ROLES: UserRole[] = [
  "qc",
  "handler",
  "cluster_supervisor",
  "regional_supervisor",
];

/** Roles that sign in with email + password. */
export const DESK_USER_ROLES: UserRole[] = [
  "admin",
  "national_ops",
  "national_quality",
  "gbfoods_reviewer",
];

export const isFieldRole = (role: UserRole): boolean => FIELD_USER_ROLES.includes(role);

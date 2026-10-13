import type { UserRole } from "@/lib/auth/types";

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  qc: "QC",
  handler: "Handler",
  cluster_supervisor: "Cluster supervisor",
  regional_supervisor: "Regional supervisor",
  national_ops: "National ops",
  national_quality: "National quality",
  admin: "Admin",
  gbfoods_reviewer: "GBfoods reviewer",
};

/** Field roles sign in with staff ID + PIN. */
export const FIELD_USER_ROLES: UserRole[] = [
  "qc",
  "handler",
  "cluster_supervisor",
  "regional_supervisor",
];

/** Desk roles sign in with email + password. */
export const DESK_USER_ROLES: UserRole[] = [
  "admin",
  "national_ops",
  "national_quality",
  "gbfoods_reviewer",
];

export const ALL_USER_ROLES: UserRole[] = [...FIELD_USER_ROLES, ...DESK_USER_ROLES];

export const isFieldUserRole = (role: UserRole): boolean => FIELD_USER_ROLES.includes(role);

export const isUserRole = (value: string): value is UserRole =>
  ALL_USER_ROLES.some((role) => role === value);

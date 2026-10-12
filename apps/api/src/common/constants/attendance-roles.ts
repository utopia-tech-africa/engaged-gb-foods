import type { UserRole } from "@prisma/client";

/** Field roles that may record their own check-in/out. */
export const FIELD_ATTENDANCE_WRITE_ROLES: UserRole[] = [
  "qc",
  "handler",
  "cluster_supervisor",
  "regional_supervisor",
];

/** Supervisors and ops who may list attendance for others. */
export const ATTENDANCE_READ_ROLES: UserRole[] = [
  "cluster_supervisor",
  "regional_supervisor",
  "national_ops",
  "national_quality",
  "admin",
];

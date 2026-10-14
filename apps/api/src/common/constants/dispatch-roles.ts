import type { UserRole } from "@prisma/client";

/** Roles that may plan or freeze a next-day dispatch. */
export const DISPATCH_WRITE_ROLES: UserRole[] = [
  "cluster_supervisor",
  "regional_supervisor",
  "national_ops",
  "admin",
];

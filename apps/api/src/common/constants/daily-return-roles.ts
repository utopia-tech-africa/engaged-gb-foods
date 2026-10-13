import type { UserRole } from "@prisma/client";

/** Roles that may submit or update a regional daily return. */
export const DAILY_RETURN_WRITE_ROLES: UserRole[] = [
  "regional_supervisor",
  "national_ops",
  "admin",
];

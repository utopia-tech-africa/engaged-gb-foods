import type { UserRole } from "@prisma/client";

/** Ops staff who may view the network-wide dashboard. */
export const OPS_DASHBOARD_ROLES: UserRole[] = [
  "admin",
  "national_ops",
  "national_quality",
  "regional_supervisor",
];

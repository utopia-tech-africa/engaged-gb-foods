import type { UserRole } from "@prisma/client";

/** Field roles that may capture stock on assigned depots. */
export const FIELD_STOCK_WRITE_ROLES: UserRole[] = [
  "qc",
  "handler",
  "cluster_supervisor",
  "regional_supervisor",
];

/** Ops roles that may create SKUs. */
export const SKU_WRITE_ROLES: UserRole[] = ["admin", "national_ops"];

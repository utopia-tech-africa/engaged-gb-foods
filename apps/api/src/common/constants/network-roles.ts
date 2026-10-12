import type { UserRole } from "@prisma/client";

/** Any signed-in user with a valid access token. */
export const NETWORK_READ_ROLES: UserRole[] = [
  "qc",
  "handler",
  "cluster_supervisor",
  "regional_supervisor",
  "national_ops",
  "national_quality",
  "admin",
  "gbfoods_reviewer",
];

export const NETWORK_WRITE_ROLES: UserRole[] = ["admin", "national_ops"];

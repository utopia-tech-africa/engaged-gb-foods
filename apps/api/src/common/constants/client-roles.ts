import type { UserRole } from "@prisma/client";

/** GBfoods control room read access (overview, pack, exports). */
export const CLIENT_READ_ROLES: UserRole[] = [
  "gbfoods_reviewer",
  "admin",
  "national_ops",
  "national_quality",
];

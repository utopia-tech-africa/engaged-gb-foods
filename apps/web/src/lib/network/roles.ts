import type { UserRole } from "@/lib/auth/types";

export const OPS_NETWORK_ROLES: UserRole[] = ["national_ops", "national_quality", "admin"];

/** Matches API write guard: admin and national_ops only. */
export const OPS_NETWORK_WRITE_ROLES: UserRole[] = ["national_ops", "admin"];

export const canWriteNetwork = (role: UserRole): boolean => OPS_NETWORK_WRITE_ROLES.includes(role);

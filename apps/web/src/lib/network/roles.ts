import type { UserRole } from "@/lib/auth/types";

export const OPS_NETWORK_ROLES: UserRole[] = ["national_ops", "national_quality", "admin"];

/** Matches API write guard: admin and national_ops only. */
export const OPS_NETWORK_WRITE_ROLES: UserRole[] = ["national_ops", "admin"];

export const canWriteNetwork = (role: UserRole): boolean => OPS_NETWORK_WRITE_ROLES.includes(role);

/** Ops pages for recce and assessment: network ops plus regional supervisors. */
export const OPS_READINESS_ROLES: UserRole[] = [...OPS_NETWORK_ROLES, "regional_supervisor"];

/** Matches API write guard for recces and assessments. */
export const READINESS_WRITE_ROLES: UserRole[] = [
  "admin",
  "national_ops",
  "regional_supervisor",
  "national_quality",
];

export const canWriteReadiness = (role: UserRole): boolean => READINESS_WRITE_ROLES.includes(role);

/** Matches API write guard for daily returns. */
export const DAILY_RETURN_WRITE_ROLES: UserRole[] = [
  "regional_supervisor",
  "national_ops",
  "admin",
];

export const canWriteDailyReturn = (role: UserRole): boolean =>
  DAILY_RETURN_WRITE_ROLES.includes(role);

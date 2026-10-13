import type { UserRole } from "@/lib/auth/types";
import { requestJson } from "@/lib/network/api";

export type UserSummary = {
  id: string;
  fullName: string;
  staffId: string | null;
  role: UserRole;
  isActive: boolean;
};

export const fetchUsers = (
  accessToken: string,
  filters?: { role?: UserRole },
): Promise<UserSummary[]> => {
  const query = filters?.role ? `?role=${encodeURIComponent(filters.role)}` : "";
  return requestJson(accessToken, `/users${query}`);
};

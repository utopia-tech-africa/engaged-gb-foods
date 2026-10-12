import type { UserRole } from "@prisma/client";

export type AuthenticatedUser = {
  id: string;
  fullName: string;
  staffId: string | null;
  email: string | null;
  phone: string | null;
  role: UserRole;
  isActive: boolean;
};

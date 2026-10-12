export type UserRole =
  | "qc"
  | "handler"
  | "cluster_supervisor"
  | "regional_supervisor"
  | "national_ops"
  | "national_quality"
  | "admin"
  | "gbfoods_reviewer";

export type AuthUser = {
  id: string;
  fullName: string;
  staffId: string | null;
  email: string | null;
  phone: string | null;
  role: UserRole;
  isActive: boolean;
};

export type AuthTokenResponse = {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
};

export type AuthSession = {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
};

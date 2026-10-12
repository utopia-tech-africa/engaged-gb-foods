import type { UserRole } from "./types";

export const homePathForRole = (role: UserRole): string => {
  switch (role) {
    case "qc":
    case "handler":
    case "cluster_supervisor":
    case "regional_supervisor":
      return "/field";
    case "gbfoods_reviewer":
      return "/client";
    default:
      return "/ops";
  }
};

"use client";

import { useRouter } from "next/navigation";
import { type ReactNode, useEffect } from "react";

import { useAuth } from "@/components/auth-provider";
import { PageLoader } from "@/components/page-loader";
import type { UserRole } from "@/lib/auth/types";

type RequireAuthProps = {
  roles: UserRole[];
  children: ReactNode;
};

export const RequireAuth = ({ roles, children }: RequireAuthProps) => {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) {
      return;
    }
    if (!user) {
      router.replace("/");
      return;
    }
    if (!roles.includes(user.role)) {
      router.replace("/");
    }
  }, [isLoading, user, roles, router]);

  if (isLoading || !user || !roles.includes(user.role)) {
    return <PageLoader fullScreen label="Checking session…" />;
  }

  return children;
};

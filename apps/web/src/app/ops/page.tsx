"use client";

import { useAuth } from "@/components/auth-provider";
import { RequireAuth } from "@/components/require-auth";
import { ShellFrame } from "@/components/shell-frame";
import type { UserRole } from "@/lib/auth/types";

const OPS_ROLES: UserRole[] = ["national_ops", "national_quality", "admin"];

export default function OpsHomePage() {
  const { user } = useAuth();

  return (
    <RequireAuth roles={OPS_ROLES}>
      <ShellFrame title="Operations desk" eyebrow="Operations">
        <p className="max-w-xl text-base text-brand-ink">
          Signed in as {user?.fullName}. Network master data and review queues land next.
        </p>
      </ShellFrame>
    </RequireAuth>
  );
}

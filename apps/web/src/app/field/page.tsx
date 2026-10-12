"use client";

import { useAuth } from "@/components/auth-provider";
import { RequireAuth } from "@/components/require-auth";
import { ShellFrame } from "@/components/shell-frame";
import type { UserRole } from "@/lib/auth/types";

const FIELD_ROLES: UserRole[] = ["qc", "handler", "cluster_supervisor", "regional_supervisor"];

export default function FieldHomePage() {
  const { user } = useAuth();

  return (
    <RequireAuth roles={FIELD_ROLES}>
      <ShellFrame title="Field workspace" eyebrow="Field">
        <p className="max-w-xl text-base text-brand-ink">
          Signed in as {user?.fullName}
          {user?.staffId ? ` · ${user.staffId}` : ""}. Attendance and stock capture land in the next
          feature PRs.
        </p>
      </ShellFrame>
    </RequireAuth>
  );
}

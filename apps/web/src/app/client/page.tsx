"use client";

import { useAuth } from "@/components/auth-provider";
import { RequireAuth } from "@/components/require-auth";
import { ShellFrame } from "@/components/shell-frame";
import type { UserRole } from "@/lib/auth/types";

const CLIENT_ROLES: UserRole[] = ["gbfoods_reviewer"];

export default function ClientHomePage() {
  const { user } = useAuth();

  return (
    <RequireAuth roles={CLIENT_ROLES}>
      <ShellFrame title="Client control room" eyebrow="GBfoods">
        <p className="max-w-xl text-base text-brand-ink">
          Signed in as {user?.fullName}. Live depot progress and disposition decisions land after
          stock capture.
        </p>
      </ShellFrame>
    </RequireAuth>
  );
}

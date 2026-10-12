"use client";

import { useAuth } from "@/components/auth-provider";
import { OpsNetworkNav } from "@/components/ops-network-nav";
import { RequireAuth } from "@/components/require-auth";
import { ShellFrame } from "@/components/shell-frame";
import { OPS_NETWORK_ROLES } from "@/lib/network/roles";

export default function OpsHomePage() {
  const { user } = useAuth();

  return (
    <RequireAuth roles={OPS_NETWORK_ROLES}>
      <ShellFrame title="Operations desk" eyebrow="Operations">
        <div className="space-y-6">
          <p className="max-w-xl text-base text-brand-ink">
            Signed in as {user?.fullName}. Manage Ghana network master data — regions, distributors,
            and depots.
          </p>
          <OpsNetworkNav />
        </div>
      </ShellFrame>
    </RequireAuth>
  );
}

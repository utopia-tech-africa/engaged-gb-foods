"use client";

import { Warehouse } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

import { useAuth } from "@/components/auth-provider";
import { EmptyState } from "@/components/empty-state";
import { EscalationForm } from "@/components/escalation-form";
import { FormSkeleton } from "@/components/list-skeleton";
import { PageLoader } from "@/components/page-loader";
import { RequireAuth } from "@/components/require-auth";
import { ShellFrame } from "@/components/shell-frame";
import { useGetMeDepots } from "@/lib/api/generated/assignments/assignments";
import type { UserRole } from "@/lib/auth/types";

const FIELD_ESCALATION_ROLES: UserRole[] = ["qc", "cluster_supervisor", "regional_supervisor"];

function NewEscalationContent() {
  const searchParams = useSearchParams();
  const { accessToken } = useAuth();
  const depotsQuery = useGetMeDepots({ query: { enabled: Boolean(accessToken) } });

  if (depotsQuery.isLoading) {
    return <PageLoader label="Loading assigned depots…" />;
  }
  if (depotsQuery.error) {
    return <p className="text-sm text-red-600">{depotsQuery.error.message}</p>;
  }
  const depots = depotsQuery.data ?? [];
  if (depots.length === 0) {
    return (
      <EmptyState
        icon={Warehouse}
        title="No assigned depots"
        description="Ask ops to link your account to a distributor."
      />
    );
  }

  return (
    <EscalationForm
      depots={depots}
      initialDepotId={searchParams.get("depotId") ?? ""}
      initialVisitId={searchParams.get("visitId") ?? ""}
    />
  );
}

export default function NewEscalationPage() {
  return (
    <RequireAuth roles={FIELD_ESCALATION_ROLES}>
      <ShellFrame title="Report an exception" eyebrow="Field">
        <Suspense fallback={<FormSkeleton />}>
          <NewEscalationContent />
        </Suspense>
      </ShellFrame>
    </RequireAuth>
  );
}

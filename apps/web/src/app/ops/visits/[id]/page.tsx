"use client";

import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { useAuth } from "@/components/auth-provider";
import { OpsNetworkNav } from "@/components/ops-network-nav";
import { RequireAuth } from "@/components/require-auth";
import { ShellFrame } from "@/components/shell-frame";
import { SignaturePad } from "@/components/signature-pad";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getGetVisitsByIdReconciliationQueryKey,
  useGetVisitsByIdReconciliation,
  usePostVisitsByIdClose,
  usePostVisitsByIdSignatures,
} from "@/lib/api/generated/visits/visits";
import { OPS_NETWORK_ROLES } from "@/lib/network/roles";
import { ZONE_LABELS } from "@/lib/stock/constants";
import { uploadPhoto } from "@/lib/uploads";
import { cn } from "@/lib/utils";
import { SIGNATURE_ROLE_LABELS } from "@/lib/visit/constants";

export default function OpsVisitDetailPage() {
  const params = useParams<{ id: string }>();
  const visitId = params.id;
  const { accessToken, user } = useAuth();
  const queryClient = useQueryClient();
  const [actionError, setActionError] = useState<string | null>(null);
  const [supervisorName, setSupervisorName] = useState("");
  const [signatureFile, setSignatureFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [exceptionDescription, setExceptionDescription] = useState("");
  const [exceptionOwner, setExceptionOwner] = useState("");

  const reconciliationQuery = useGetVisitsByIdReconciliation(visitId, {
    query: { enabled: Boolean(accessToken) },
  });
  const postSignature = usePostVisitsByIdSignatures();
  const closeVisit = usePostVisitsByIdClose();

  const snapshot = reconciliationQuery.data;
  const loading = reconciliationQuery.isLoading;
  const error = actionError ?? reconciliationQuery.error?.message ?? null;
  const busy = isUploading || postSignature.isPending || closeVisit.isPending;

  const reload = () =>
    queryClient.invalidateQueries({ queryKey: getGetVisitsByIdReconciliationQueryKey(visitId) });

  useEffect(() => {
    if (user?.fullName && !supervisorName) {
      setSupervisorName(user.fullName);
    }
  }, [user?.fullName, supervisorName]);

  const saveSupervisorSignature = async () => {
    if (!supervisorName.trim()) {
      return;
    }
    setActionError(null);
    try {
      let imageObjectKey: string | undefined;
      if (signatureFile) {
        setIsUploading(true);
        try {
          imageObjectKey = await uploadPhoto(signatureFile, "signature");
        } finally {
          setIsUploading(false);
        }
      }
      await postSignature.mutateAsync({
        id: visitId,
        data: {
          role: "cluster_supervisor",
          signerName: supervisorName.trim(),
          imageObjectKey,
        },
      });
      await reload();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Could not save signature");
    }
  };

  const closeWithOpenAction = async () => {
    setActionError(null);
    try {
      await closeVisit.mutateAsync({
        id: visitId,
        data: {
          openActions: [{ description: exceptionDescription, ownerName: exceptionOwner }],
        },
      });
      await reload();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Could not close visit");
    }
  };

  return (
    <RequireAuth roles={[...OPS_NETWORK_ROLES, "cluster_supervisor", "regional_supervisor"]}>
      <ShellFrame title="Visit reconciliation" eyebrow="Operations">
        <div className="space-y-6">
          <OpsNetworkNav />
          <Link href="/ops/stock" className={cn(buttonVariants({ variant: "link" }), "h-auto p-0")}>
            ← Stock lots
          </Link>

          {loading ? <p className="text-sm text-brand-ink/70">Loading…</p> : null}
          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          {snapshot ? (
            <>
              <Card>
                <CardContent className="text-sm">
                  <p className="font-semibold">{snapshot.visit.depot.name}</p>
                  <p className="text-brand">{snapshot.visit.code}</p>
                  <p className="mt-1 text-brand-ink/70">
                    QC: {snapshot.visit.qcUser.fullName} · Status {snapshot.visit.status}
                  </p>
                  <Link
                    href={`/field/visits/${visitId}/reconcile`}
                    className={cn(buttonVariants({ variant: "link" }), "mt-2 h-auto p-0")}
                  >
                    Open field reconcile view
                  </Link>
                </CardContent>
              </Card>

              <Card className="overflow-hidden p-0">
                <Table>
                  <TableHeader className="bg-surface">
                    <TableRow>
                      <TableHead className="text-xs uppercase text-brand-ink/60">
                        SKU / batch
                      </TableHead>
                      <TableHead className="text-xs uppercase text-brand-ink/60">Opening</TableHead>
                      <TableHead className="text-xs uppercase text-brand-ink/60">Closing</TableHead>
                      <TableHead className="text-xs uppercase text-brand-ink/60">
                        Variance
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {snapshot.lines.map((line) => (
                      <TableRow key={`${line.skuId}-${line.batchCode}`}>
                        <TableCell>
                          {line.skuName}
                          <span className="block text-xs text-brand-ink/60">{line.batchCode}</span>
                        </TableCell>
                        <TableCell>{line.opening}</TableCell>
                        <TableCell>
                          {line.closingTotal}
                          <span className="block text-xs text-brand-ink/60">
                            {Object.entries(line.closingByZone)
                              .filter(([, q]) => q > 0)
                              .map(
                                ([z, q]) =>
                                  `${ZONE_LABELS[z as keyof typeof ZONE_LABELS] ?? z}: ${q}`,
                              )
                              .join(" · ")}
                          </span>
                        </TableCell>
                        <TableCell
                          className={`font-semibold ${line.variance === 0 ? "text-green-700" : "text-red-600"}`}
                        >
                          {line.variance}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>

              {!snapshot.canClose && snapshot.visit.status !== "complete" ? (
                <Card className="border-amber-200 bg-amber-50/50">
                  <CardHeader>
                    <CardTitle className="text-sm">Close as exception</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm">
                    <p className="text-brand-ink/70">
                      Record an open action when variance or signatures cannot be cleared today.
                    </p>
                    <div className="mt-3 space-y-2">
                      <Label htmlFor="exception-description">Open action description</Label>
                      <Input
                        id="exception-description"
                        type="text"
                        placeholder="Open action description"
                        value={exceptionDescription}
                        onChange={(event) => setExceptionDescription(event.target.value)}
                      />
                    </div>
                    <div className="mt-2 space-y-2">
                      <Label htmlFor="exception-owner">Owner name</Label>
                      <Input
                        id="exception-owner"
                        type="text"
                        placeholder="Owner name"
                        value={exceptionOwner}
                        onChange={(event) => setExceptionOwner(event.target.value)}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      className="mt-3"
                      disabled={busy}
                      onClick={() => void closeWithOpenAction()}
                    >
                      Close with open action
                    </Button>
                  </CardContent>
                </Card>
              ) : null}

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">
                    {SIGNATURE_ROLE_LABELS.cluster_supervisor}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Label htmlFor="supervisor-name" className="sr-only">
                    Supervisor name
                  </Label>
                  <Input
                    id="supervisor-name"
                    type="text"
                    value={supervisorName}
                    onChange={(event) => setSupervisorName(event.target.value)}
                    className="max-w-md"
                  />
                  <SignaturePad className="mt-3 max-w-md" onChange={setSignatureFile} />
                  <Button
                    type="button"
                    size="sm"
                    className="mt-3"
                    disabled={busy}
                    onClick={() => void saveSupervisorSignature()}
                  >
                    Save supervisor signature
                  </Button>
                  <p className="mt-3 text-xs text-brand-ink/60">
                    Recorded:{" "}
                    {snapshot.signatures
                      .filter((s) => s.role === "cluster_supervisor")
                      .map((s) => s.signerName)
                      .join(", ") || "Not yet"}
                  </p>
                </CardContent>
              </Card>
            </>
          ) : null}
        </div>
      </ShellFrame>
    </RequireAuth>
  );
}

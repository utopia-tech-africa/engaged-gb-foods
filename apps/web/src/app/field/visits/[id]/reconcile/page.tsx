"use client";

import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { useAuth } from "@/components/auth-provider";
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
import type { SignatureRole } from "@/lib/api/generated/model";
import {
  getGetStockLotsQueryKey,
  usePatchStockLotsByIdCustodian,
} from "@/lib/api/generated/stock-lots/stock-lots";
import {
  getGetVisitsByIdReconciliationQueryKey,
  useGetVisitsByIdReconciliation,
  usePostVisitsByIdClose,
  usePostVisitsByIdSignatures,
} from "@/lib/api/generated/visits/visits";
import type { UserRole } from "@/lib/auth/types";
import { ZONE_LABELS } from "@/lib/stock/constants";
import { uploadPhoto } from "@/lib/uploads";
import { cn } from "@/lib/utils";
import { SIGNATURE_ROLE_LABELS } from "@/lib/visit/constants";

const FIELD_ROLES: UserRole[] = ["qc", "handler", "cluster_supervisor", "regional_supervisor"];

export default function FieldReconcilePage() {
  const params = useParams<{ id: string }>();
  const visitId = params.id;
  const { accessToken, user } = useAuth();
  const queryClient = useQueryClient();
  const [actionError, setActionError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [qcName, setQcName] = useState("");
  const [depotRepName, setDepotRepName] = useState("");
  const [qcSignatureFile, setQcSignatureFile] = useState<File | null>(null);
  const [depotSignatureFile, setDepotSignatureFile] = useState<File | null>(null);
  const [custodianDrafts, setCustodianDrafts] = useState<Record<string, string>>({});

  const reconciliationQuery = useGetVisitsByIdReconciliation(visitId, {
    query: { enabled: Boolean(accessToken) },
  });
  const postSignature = usePostVisitsByIdSignatures();
  const patchCustodian = usePatchStockLotsByIdCustodian();
  const closeVisitMutation = usePostVisitsByIdClose();

  const snapshot = reconciliationQuery.data;
  const loading = reconciliationQuery.isLoading;
  const error = actionError ?? reconciliationQuery.error?.message ?? null;
  const busy =
    isUploading ||
    postSignature.isPending ||
    patchCustodian.isPending ||
    closeVisitMutation.isPending;

  const reload = () =>
    Promise.all([
      queryClient.invalidateQueries({
        queryKey: getGetVisitsByIdReconciliationQueryKey(visitId),
      }),
      queryClient.invalidateQueries({ queryKey: getGetStockLotsQueryKey() }),
    ]);

  const runAction = async (action: () => Promise<unknown>, fallbackMessage: string) => {
    setActionError(null);
    try {
      await action();
      await reload();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : fallbackMessage);
    }
  };

  useEffect(() => {
    if (user?.fullName && !qcName) {
      setQcName(user.fullName);
    }
  }, [user?.fullName, qcName]);

  const submitSignature = async (role: SignatureRole, signerName: string, file: File | null) => {
    if (!signerName.trim()) {
      return;
    }
    await runAction(async () => {
      let imageObjectKey: string | undefined;
      if (file) {
        setIsUploading(true);
        try {
          imageObjectKey = await uploadPhoto(file, "signature");
        } finally {
          setIsUploading(false);
        }
      }
      await postSignature.mutateAsync({
        id: visitId,
        data: { role, signerName: signerName.trim(), imageObjectKey },
      });
    }, "Could not save signature");
  };

  const saveCustodian = async (lotId: string) => {
    const value = custodianDrafts[lotId]?.trim();
    if (!value) {
      return;
    }
    await runAction(
      () => patchCustodian.mutateAsync({ id: lotId, data: { custodian: value } }),
      "Could not save custodian",
    );
  };

  const closeVisit = () =>
    runAction(
      () => closeVisitMutation.mutateAsync({ id: visitId, data: {} }),
      "Could not close visit",
    );

  return (
    <RequireAuth roles={FIELD_ROLES}>
      <ShellFrame title="Reconcile visit" eyebrow="Field">
        <div className="space-y-6">
          <Link
            href="/field/stock"
            className={cn(buttonVariants({ variant: "link" }), "h-auto p-0")}
          >
            ← Stock lots
          </Link>

          {loading ? <p className="text-sm text-brand-ink/70">Loading reconciliation…</p> : null}
          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          {snapshot ? (
            <>
              <Card>
                <CardContent className="text-sm">
                  <p className="font-semibold text-brand-ink">{snapshot.visit.depot.name}</p>
                  <p className="text-brand">{snapshot.visit.code}</p>
                  <p className="mt-1 text-brand-ink/70">
                    Status: {snapshot.visit.status}
                    {snapshot.visit.reconciledAt
                      ? ` · reconciled ${new Date(snapshot.visit.reconciledAt).toLocaleString()}`
                      : ""}
                  </p>
                </CardContent>
              </Card>

              <Card className="overflow-hidden p-0">
                <Table>
                  <TableHeader className="bg-surface">
                    <TableRow>
                      <TableHead className="text-xs uppercase tracking-wide text-brand-ink/60">
                        SKU / batch
                      </TableHead>
                      <TableHead className="text-xs uppercase tracking-wide text-brand-ink/60">
                        Opening
                      </TableHead>
                      <TableHead className="text-xs uppercase tracking-wide text-brand-ink/60">
                        In
                      </TableHead>
                      <TableHead className="text-xs uppercase tracking-wide text-brand-ink/60">
                        Out
                      </TableHead>
                      <TableHead className="text-xs uppercase tracking-wide text-brand-ink/60">
                        Closing
                      </TableHead>
                      <TableHead className="text-xs uppercase tracking-wide text-brand-ink/60">
                        Variance
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {snapshot.lines.map((line) => (
                      <TableRow key={`${line.skuId}-${line.batchCode}`}>
                        <TableCell>
                          <p className="font-medium">{line.skuName}</p>
                          <p className="text-xs text-brand-ink/60">{line.batchCode}</p>
                        </TableCell>
                        <TableCell>{line.opening}</TableCell>
                        <TableCell>{line.inward}</TableCell>
                        <TableCell>{line.outward}</TableCell>
                        <TableCell>
                          {line.closingTotal}
                          <ul className="mt-1 text-xs text-brand-ink/60">
                            {Object.entries(line.closingByZone)
                              .filter(([, qty]) => qty > 0)
                              .map(([zoneKey, qty]) => (
                                <li key={zoneKey}>
                                  {ZONE_LABELS[zoneKey as keyof typeof ZONE_LABELS] ?? zoneKey}:{" "}
                                  {qty}
                                </li>
                              ))}
                          </ul>
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

              {snapshot.heldLotsWithoutCustodian.length > 0 ? (
                <section className="space-y-3">
                  <h2 className="text-sm font-semibold text-brand-ink">Held lots need custodian</h2>
                  {snapshot.heldLotsWithoutCustodian.map((lot) => (
                    <Card key={lot.id}>
                      <CardContent className="flex flex-wrap items-end gap-2 text-sm">
                        <div className="min-w-[12rem] flex-1">
                          <p className="font-medium">{lot.skuName}</p>
                          <p className="text-xs text-brand-ink/60">
                            {lot.batchCode} · {lot.baseQuantity} base
                          </p>
                        </div>
                        <div className="min-w-[12rem] flex-1 space-y-2">
                          <Label htmlFor={`custodian-${lot.id}`} className="sr-only">
                            Custodian name
                          </Label>
                          <Input
                            id={`custodian-${lot.id}`}
                            type="text"
                            placeholder="Custodian name"
                            value={custodianDrafts[lot.id] ?? ""}
                            onChange={(event) =>
                              setCustodianDrafts((prev) => ({
                                ...prev,
                                [lot.id]: event.target.value,
                              }))
                            }
                          />
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          disabled={busy}
                          onClick={() => void saveCustodian(lot.id)}
                        >
                          Save
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </section>
              ) : null}

              <section className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">{SIGNATURE_ROLE_LABELS.qc}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Label htmlFor="qc-name" className="sr-only">
                      QC name
                    </Label>
                    <Input
                      id="qc-name"
                      type="text"
                      value={qcName}
                      onChange={(event) => setQcName(event.target.value)}
                    />
                    <SignaturePad className="mt-3" onChange={setQcSignatureFile} />
                    <Button
                      type="button"
                      size="sm"
                      className="mt-3"
                      disabled={busy}
                      onClick={() => void submitSignature("qc", qcName, qcSignatureFile)}
                    >
                      Save QC signature
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">
                      {SIGNATURE_ROLE_LABELS.depot_representative}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Label htmlFor="depot-rep-name" className="sr-only">
                      Depot representative name
                    </Label>
                    <Input
                      id="depot-rep-name"
                      type="text"
                      value={depotRepName}
                      onChange={(event) => setDepotRepName(event.target.value)}
                      placeholder="Depot representative name"
                    />
                    <SignaturePad className="mt-3" onChange={setDepotSignatureFile} />
                    <Button
                      type="button"
                      size="sm"
                      className="mt-3"
                      disabled={busy}
                      onClick={() =>
                        void submitSignature(
                          "depot_representative",
                          depotRepName,
                          depotSignatureFile,
                        )
                      }
                    >
                      Save depot signature
                    </Button>
                  </CardContent>
                </Card>
              </section>

              <Card>
                <CardContent className="text-sm">
                  <p>
                    <span className="font-medium">Missing signatures:</span>{" "}
                    {snapshot.missingSignatures.length === 0
                      ? "None"
                      : snapshot.missingSignatures.map((r) => SIGNATURE_ROLE_LABELS[r]).join(", ")}
                  </p>
                  <p className="mt-2">
                    Cluster supervisor sign-off is captured on the ops visit page.
                  </p>
                </CardContent>
              </Card>

              <Button
                type="button"
                disabled={busy || !snapshot.canClose}
                onClick={() => void closeVisit()}
              >
                Close visit
              </Button>
              {!snapshot.canClose ? (
                <p className="text-xs text-brand-ink/60">
                  Resolve variance, custodians, and all three signatures before closing.
                </p>
              ) : null}
            </>
          ) : null}
        </div>
      </ShellFrame>
    </RequireAuth>
  );
}

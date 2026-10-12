"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/components/auth-provider";
import { RequireAuth } from "@/components/require-auth";
import { ShellFrame } from "@/components/shell-frame";
import { SignaturePad } from "@/components/signature-pad";
import type { UserRole } from "@/lib/auth/types";
import { ZONE_LABELS } from "@/lib/stock/api";
import {
  fetchVisitReconciliation,
  patchStockLotCustodian,
  postVisitClose,
  postVisitSignature,
  type ReconciliationSnapshot,
  SIGNATURE_ROLE_LABELS,
  type SignatureRole,
  uploadSignatureImage,
} from "@/lib/visit/api";

const FIELD_ROLES: UserRole[] = ["qc", "handler", "cluster_supervisor", "regional_supervisor"];

export default function FieldReconcilePage() {
  const params = useParams<{ id: string }>();
  const visitId = params.id;
  const { accessToken, user } = useAuth();
  const [snapshot, setSnapshot] = useState<ReconciliationSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [qcName, setQcName] = useState("");
  const [depotRepName, setDepotRepName] = useState("");
  const [qcSignatureFile, setQcSignatureFile] = useState<File | null>(null);
  const [depotSignatureFile, setDepotSignatureFile] = useState<File | null>(null);
  const [custodianDrafts, setCustodianDrafts] = useState<Record<string, string>>({});

  const reload = useCallback(async () => {
    if (!accessToken) {
      return;
    }
    setLoading(true);
    try {
      const data = await fetchVisitReconciliation(accessToken, visitId);
      setSnapshot(data);
      setError(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not load reconciliation");
    } finally {
      setLoading(false);
    }
  }, [accessToken, visitId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    if (user?.fullName && !qcName) {
      setQcName(user.fullName);
    }
  }, [user?.fullName, qcName]);

  const submitSignature = async (role: SignatureRole, signerName: string, file: File | null) => {
    if (!accessToken || !signerName.trim()) {
      return;
    }
    setBusy(true);
    try {
      let imageObjectKey: string | undefined;
      if (file) {
        imageObjectKey = await uploadSignatureImage(accessToken, file);
      }
      await postVisitSignature(accessToken, visitId, {
        role,
        signerName: signerName.trim(),
        imageObjectKey,
      });
      await reload();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not save signature");
    } finally {
      setBusy(false);
    }
  };

  const saveCustodian = async (lotId: string) => {
    const value = custodianDrafts[lotId]?.trim();
    if (!accessToken || !value) {
      return;
    }
    setBusy(true);
    try {
      await patchStockLotCustodian(accessToken, lotId, value);
      await reload();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not save custodian");
    } finally {
      setBusy(false);
    }
  };

  const closeVisit = async () => {
    if (!accessToken) {
      return;
    }
    setBusy(true);
    try {
      await postVisitClose(accessToken, visitId);
      await reload();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not close visit");
    } finally {
      setBusy(false);
    }
  };

  return (
    <RequireAuth roles={FIELD_ROLES}>
      <ShellFrame title="Reconcile visit" eyebrow="Field">
        <div className="space-y-6">
          <Link href="/field/stock" className="text-sm font-medium text-brand hover:underline">
            ← Stock lots
          </Link>

          {loading ? <p className="text-sm text-brand-ink/70">Loading reconciliation…</p> : null}
          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          {snapshot ? (
            <>
              <div className="rounded-2xl border border-border bg-surface p-4 text-sm">
                <p className="font-semibold text-brand-ink">{snapshot.visit.depot.name}</p>
                <p className="text-brand">{snapshot.visit.code}</p>
                <p className="mt-1 text-brand-ink/70">
                  Status: {snapshot.visit.status}
                  {snapshot.visit.reconciledAt
                    ? ` · reconciled ${new Date(snapshot.visit.reconciledAt).toLocaleString()}`
                    : ""}
                </p>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-border">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-surface text-xs uppercase tracking-wide text-brand-ink/60">
                    <tr>
                      <th className="px-3 py-2">SKU / batch</th>
                      <th className="px-3 py-2">Opening</th>
                      <th className="px-3 py-2">In</th>
                      <th className="px-3 py-2">Out</th>
                      <th className="px-3 py-2">Closing</th>
                      <th className="px-3 py-2">Variance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {snapshot.lines.map((line) => (
                      <tr
                        key={`${line.skuId}-${line.batchCode}`}
                        className="border-t border-border"
                      >
                        <td className="px-3 py-2">
                          <p className="font-medium">{line.skuName}</p>
                          <p className="text-xs text-brand-ink/60">{line.batchCode}</p>
                        </td>
                        <td className="px-3 py-2">{line.opening}</td>
                        <td className="px-3 py-2">{line.inward}</td>
                        <td className="px-3 py-2">{line.outward}</td>
                        <td className="px-3 py-2">
                          {line.closingTotal}
                          <ul className="mt-1 text-xs text-brand-ink/60">
                            {Object.entries(line.closingByZone)
                              .filter(([, qty]) => qty > 0)
                              .map(([zone, qty]) => (
                                <li key={zone}>
                                  {ZONE_LABELS[zone as keyof typeof ZONE_LABELS] ?? zone}: {qty}
                                </li>
                              ))}
                          </ul>
                        </td>
                        <td
                          className={`px-3 py-2 font-semibold ${line.variance === 0 ? "text-green-700" : "text-red-600"}`}
                        >
                          {line.variance}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {snapshot.heldLotsWithoutCustodian.length > 0 ? (
                <section className="space-y-3">
                  <h2 className="text-sm font-semibold text-brand-ink">Held lots need custodian</h2>
                  {snapshot.heldLotsWithoutCustodian.map((lot) => (
                    <div
                      key={lot.id}
                      className="flex flex-wrap items-end gap-2 rounded-xl border border-border p-3 text-sm"
                    >
                      <div className="min-w-[12rem] flex-1">
                        <p className="font-medium">{lot.skuName}</p>
                        <p className="text-xs text-brand-ink/60">
                          {lot.batchCode} · {lot.baseQuantity} base
                        </p>
                      </div>
                      <input
                        type="text"
                        placeholder="Custodian name"
                        value={custodianDrafts[lot.id] ?? ""}
                        onChange={(event) =>
                          setCustodianDrafts((prev) => ({ ...prev, [lot.id]: event.target.value }))
                        }
                        className="rounded-lg border border-border px-3 py-2"
                      />
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void saveCustodian(lot.id)}
                        className="rounded-full bg-brand px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
                      >
                        Save
                      </button>
                    </div>
                  ))}
                </section>
              ) : null}

              <section className="grid gap-6 lg:grid-cols-2">
                <div className="rounded-2xl border border-border p-4">
                  <h2 className="text-sm font-semibold">{SIGNATURE_ROLE_LABELS.qc}</h2>
                  <input
                    type="text"
                    value={qcName}
                    onChange={(event) => setQcName(event.target.value)}
                    className="mt-2 w-full rounded-lg border border-border px-3 py-2 text-sm"
                  />
                  <SignaturePad className="mt-3" onChange={setQcSignatureFile} />
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void submitSignature("qc", qcName, qcSignatureFile)}
                    className="mt-3 rounded-full bg-brand px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
                  >
                    Save QC signature
                  </button>
                </div>

                <div className="rounded-2xl border border-border p-4">
                  <h2 className="text-sm font-semibold">
                    {SIGNATURE_ROLE_LABELS.depot_representative}
                  </h2>
                  <input
                    type="text"
                    value={depotRepName}
                    onChange={(event) => setDepotRepName(event.target.value)}
                    placeholder="Depot representative name"
                    className="mt-2 w-full rounded-lg border border-border px-3 py-2 text-sm"
                  />
                  <SignaturePad className="mt-3" onChange={setDepotSignatureFile} />
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      void submitSignature("depot_representative", depotRepName, depotSignatureFile)
                    }
                    className="mt-3 rounded-full bg-brand px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
                  >
                    Save depot signature
                  </button>
                </div>
              </section>

              <div className="rounded-xl border border-border bg-surface p-4 text-sm">
                <p>
                  <span className="font-medium">Missing signatures:</span>{" "}
                  {snapshot.missingSignatures.length === 0
                    ? "None"
                    : snapshot.missingSignatures.map((r) => SIGNATURE_ROLE_LABELS[r]).join(", ")}
                </p>
                <p className="mt-2">
                  Cluster supervisor sign-off is captured on the ops visit page.
                </p>
              </div>

              <button
                type="button"
                disabled={busy || !snapshot.canClose}
                onClick={() => void closeVisit()}
                className="rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                Close visit
              </button>
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

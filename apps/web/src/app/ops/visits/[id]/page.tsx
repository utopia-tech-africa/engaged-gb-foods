"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/components/auth-provider";
import { OpsNetworkNav } from "@/components/ops-network-nav";
import { RequireAuth } from "@/components/require-auth";
import { ShellFrame } from "@/components/shell-frame";
import { SignaturePad } from "@/components/signature-pad";
import { OPS_NETWORK_ROLES } from "@/lib/network/roles";
import { ZONE_LABELS } from "@/lib/stock/api";
import {
  fetchVisitReconciliation,
  postVisitClose,
  postVisitSignature,
  type ReconciliationSnapshot,
  SIGNATURE_ROLE_LABELS,
  uploadSignatureImage,
} from "@/lib/visit/api";

export default function OpsVisitDetailPage() {
  const params = useParams<{ id: string }>();
  const visitId = params.id;
  const { accessToken, user } = useAuth();
  const [snapshot, setSnapshot] = useState<ReconciliationSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [supervisorName, setSupervisorName] = useState("");
  const [signatureFile, setSignatureFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [exceptionDescription, setExceptionDescription] = useState("");
  const [exceptionOwner, setExceptionOwner] = useState("");

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
      setError(err instanceof Error ? err.message : "Could not load visit");
    } finally {
      setLoading(false);
    }
  }, [accessToken, visitId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    if (user?.fullName && !supervisorName) {
      setSupervisorName(user.fullName);
    }
  }, [user?.fullName, supervisorName]);

  const saveSupervisorSignature = async () => {
    if (!accessToken || !supervisorName.trim()) {
      return;
    }
    setBusy(true);
    try {
      let imageObjectKey: string | undefined;
      if (signatureFile) {
        imageObjectKey = await uploadSignatureImage(accessToken, signatureFile);
      }
      await postVisitSignature(accessToken, visitId, {
        role: "cluster_supervisor",
        signerName: supervisorName.trim(),
        imageObjectKey,
      });
      await reload();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not save signature");
    } finally {
      setBusy(false);
    }
  };

  return (
    <RequireAuth roles={[...OPS_NETWORK_ROLES, "cluster_supervisor", "regional_supervisor"]}>
      <ShellFrame title="Visit reconciliation" eyebrow="Operations">
        <div className="space-y-6">
          <OpsNetworkNav />
          <Link href="/ops/stock" className="text-sm font-medium text-brand hover:underline">
            ← Stock lots
          </Link>

          {loading ? <p className="text-sm text-brand-ink/70">Loading…</p> : null}
          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          {snapshot ? (
            <>
              <div className="rounded-2xl border border-border bg-surface p-4 text-sm">
                <p className="font-semibold">{snapshot.visit.depot.name}</p>
                <p className="text-brand">{snapshot.visit.code}</p>
                <p className="mt-1 text-brand-ink/70">
                  QC: {snapshot.visit.qcUser.fullName} · Status {snapshot.visit.status}
                </p>
                <Link
                  href={`/field/visits/${visitId}/reconcile`}
                  className="mt-2 inline-block text-brand hover:underline"
                >
                  Open field reconcile view
                </Link>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-border">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-surface text-xs uppercase text-brand-ink/60">
                    <tr>
                      <th className="px-3 py-2">SKU / batch</th>
                      <th className="px-3 py-2">Opening</th>
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
                          {line.skuName}
                          <span className="block text-xs text-brand-ink/60">{line.batchCode}</span>
                        </td>
                        <td className="px-3 py-2">{line.opening}</td>
                        <td className="px-3 py-2">
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

              {!snapshot.canClose && snapshot.visit.status !== "complete" ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 text-sm">
                  <h2 className="font-semibold text-brand-ink">Close as exception</h2>
                  <p className="mt-1 text-brand-ink/70">
                    Record an open action when variance or signatures cannot be cleared today.
                  </p>
                  <input
                    type="text"
                    placeholder="Open action description"
                    value={exceptionDescription}
                    onChange={(event) => setExceptionDescription(event.target.value)}
                    className="mt-3 w-full rounded-lg border border-border px-3 py-2"
                  />
                  <input
                    type="text"
                    placeholder="Owner name"
                    value={exceptionOwner}
                    onChange={(event) => setExceptionOwner(event.target.value)}
                    className="mt-2 w-full rounded-lg border border-border px-3 py-2"
                  />
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      if (!accessToken) {
                        return;
                      }
                      setBusy(true);
                      void postVisitClose(accessToken, visitId, {
                        openActions: [
                          {
                            description: exceptionDescription,
                            ownerName: exceptionOwner,
                          },
                        ],
                      })
                        .then(() => reload())
                        .catch((err: unknown) => {
                          setError(err instanceof Error ? err.message : "Could not close visit");
                        })
                        .finally(() => setBusy(false));
                    }}
                    className="mt-3 rounded-full border border-brand px-4 py-2 text-xs font-semibold text-brand disabled:opacity-50"
                  >
                    Close with open action
                  </button>
                </div>
              ) : null}

              <div className="rounded-2xl border border-border p-4">
                <h2 className="text-sm font-semibold">
                  {SIGNATURE_ROLE_LABELS.cluster_supervisor}
                </h2>
                <input
                  type="text"
                  value={supervisorName}
                  onChange={(event) => setSupervisorName(event.target.value)}
                  className="mt-2 w-full max-w-md rounded-lg border border-border px-3 py-2 text-sm"
                />
                <SignaturePad className="mt-3 max-w-md" onChange={setSignatureFile} />
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void saveSupervisorSignature()}
                  className="mt-3 rounded-full bg-brand px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
                >
                  Save supervisor signature
                </button>
                <p className="mt-3 text-xs text-brand-ink/60">
                  Recorded:{" "}
                  {snapshot.signatures
                    .filter((s) => s.role === "cluster_supervisor")
                    .map((s) => s.signerName)
                    .join(", ") || "Not yet"}
                </p>
              </div>
            </>
          ) : null}
        </div>
      </ShellFrame>
    </RequireAuth>
  );
}

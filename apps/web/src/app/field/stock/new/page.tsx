"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";

import { useAuth } from "@/components/auth-provider";
import { RequireAuth } from "@/components/require-auth";
import { ShellFrame } from "@/components/shell-frame";
import { fetchMyDepots, type MyDepot } from "@/lib/attendance/api";
import type { UserRole } from "@/lib/auth/types";
import {
  fetchSkus,
  postStockLot,
  requiredEvidenceForZone,
  type Sku,
  type StockEvidenceCategory,
  type StockLot,
  type StockUnit,
  type StockZone,
  uploadPhotoForStockEvidence,
  ZONE_LABELS,
} from "@/lib/stock/api";

const FIELD_ROLES: UserRole[] = ["qc", "handler", "cluster_supervisor", "regional_supervisor"];

const ALL_ZONES: StockZone[] = [
  "unexamined",
  "conforming_pending_release",
  "recoverable_pending_approval",
  "held_or_rejected",
  "released_remaining_on_site",
];

const EVIDENCE_LABELS: Record<StockEvidenceCategory, string> = {
  pack: "Pack photo",
  batch: "Batch label",
  defect: "Defect photo",
  position: "Position / location",
};

type GeoSnapshot = {
  latitude: number;
  longitude: number;
  accuracyMeters: number;
};

type EvidenceFiles = Partial<Record<StockEvidenceCategory, File>>;

function NewStockLotContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const depotId = searchParams.get("depotId");
  const visitId = searchParams.get("visitId");
  const { accessToken } = useAuth();

  const [depot, setDepot] = useState<MyDepot | null>(null);
  const [skus, setSkus] = useState<Sku[]>([]);
  const [skuId, setSkuId] = useState("");
  const [batchCode, setBatchCode] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [zone, setZone] = useState<StockZone>("unexamined");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState<StockUnit>("cases");
  const [notes, setNotes] = useState("");
  const [evidenceFiles, setEvidenceFiles] = useState<EvidenceFiles>({});
  const [geo, setGeo] = useState<GeoSnapshot | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<StockLot | null>(null);

  useEffect(() => {
    if (!accessToken) {
      return;
    }
    void fetchSkus(accessToken)
      .then((items) => {
        setSkus(items);
        if (items[0]) {
          setSkuId(items[0].id);
        }
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Could not load SKUs");
      });
  }, [accessToken]);

  useEffect(() => {
    if (!accessToken || !depotId) {
      return;
    }
    void fetchMyDepots(accessToken)
      .then((depots) => {
        const match = depots.find((item) => item.id === depotId) ?? null;
        setDepot(match);
        if (!match) {
          setError("Depot not found in your assignments.");
        }
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Could not load depot");
      });
  }, [accessToken, depotId]);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGeo({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracyMeters: position.coords.accuracy,
        });
      },
      () => {
        setGeo(null);
      },
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 0 },
    );
  }, []);

  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  const selectedSku = useMemo(() => skus.find((item) => item.id === skuId) ?? null, [skus, skuId]);

  const requiredCategories = useMemo(() => requiredEvidenceForZone(zone), [zone]);

  const onEvidenceChange =
    (category: StockEvidenceCategory) => (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) {
        return;
      }
      setEvidenceFiles((prev) => ({ ...prev, [category]: file }));
      setSuccess(null);
      setError(null);
    };

  const canSubmit = useMemo(() => {
    if (!accessToken || submitting || !skuId || !batchCode.trim() || !quantity) {
      return false;
    }
    if (!visitId && !depot) {
      return false;
    }
    const qty = Number.parseInt(quantity, 10);
    if (!Number.isFinite(qty) || qty < 1) {
      return false;
    }
    for (const category of requiredCategories) {
      if (!evidenceFiles[category]) {
        return false;
      }
    }
    return true;
  }, [
    accessToken,
    submitting,
    skuId,
    batchCode,
    quantity,
    visitId,
    depot,
    requiredCategories,
    evidenceFiles,
  ]);

  const onSubmit = async () => {
    if (!accessToken || !canSubmit) {
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const categoriesToUpload = [
        ...requiredCategories,
        ...(evidenceFiles.position ? (["position"] as const) : []),
      ];
      const uniqueCategories = [...new Set(categoriesToUpload)];

      const evidence: { category: StockEvidenceCategory; objectKey: string }[] = [];
      for (const category of uniqueCategories) {
        const file = evidenceFiles[category];
        if (!file) {
          continue;
        }
        const objectKey = await uploadPhotoForStockEvidence(accessToken, file);
        evidence.push({ category, objectKey });
      }

      const body = {
        ...(visitId ? { visitId } : { depotId: depot?.id }),
        skuId,
        batchCode: batchCode.trim(),
        ...(expiryDate ? { expiryDate } : {}),
        zone,
        quantity: Number.parseInt(quantity, 10),
        unit,
        ...(notes.trim() ? { notes: notes.trim() } : {}),
        ...(geo
          ? {
              latitude: geo.latitude,
              longitude: geo.longitude,
              accuracyMeters: geo.accuracyMeters,
            }
          : {}),
        evidence,
      };

      const lot = await postStockLot(accessToken, body);
      setSuccess(lot);
      setTimeout(() => {
        router.push("/field/stock");
      }, 1200);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not save stock lot");
    } finally {
      setSubmitting(false);
    }
  };

  const optionalCategories: StockEvidenceCategory[] = ["position"];

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <Link href="/field/stock" className="text-sm font-medium text-brand hover:underline">
        ← Back to today&apos;s lots
      </Link>

      {depot ? (
        <p className="text-sm text-brand-ink">
          Depot: <span className="font-semibold">{depot.name}</span> ({depot.code})
        </p>
      ) : visitId ? (
        <p className="text-sm text-brand-ink">Visit: {visitId}</p>
      ) : null}

      {skus.length === 0 ? (
        <p className="text-sm text-red-600">
          No SKUs available. Run seed:network or add SKUs in ops.
        </p>
      ) : null}

      <label className="block text-sm">
        <span className="font-medium text-brand-ink">SKU</span>
        <select
          value={skuId}
          onChange={(event) => setSkuId(event.target.value)}
          className="mt-1 block w-full rounded-lg border border-border bg-surface px-3 py-2 text-brand-ink"
        >
          {skus.map((sku) => (
            <option key={sku.id} value={sku.id}>
              {sku.name}
              {sku.brand ? ` · ${sku.brand}` : ""} (×{sku.packFactor}/case)
            </option>
          ))}
        </select>
      </label>

      <label className="block text-sm">
        <span className="font-medium text-brand-ink">Batch code</span>
        <input
          type="text"
          value={batchCode}
          onChange={(event) => setBatchCode(event.target.value)}
          className="mt-1 block w-full rounded-lg border border-border bg-surface px-3 py-2 text-brand-ink"
          autoComplete="off"
        />
      </label>

      <label className="block text-sm">
        <span className="font-medium text-brand-ink">Expiry date (optional)</span>
        <input
          type="date"
          value={expiryDate}
          onChange={(event) => setExpiryDate(event.target.value)}
          className="mt-1 block w-full rounded-lg border border-border bg-surface px-3 py-2 text-brand-ink"
        />
      </label>

      <label className="block text-sm">
        <span className="font-medium text-brand-ink">Zone</span>
        <select
          value={zone}
          onChange={(event) => setZone(event.target.value as StockZone)}
          className="mt-1 block w-full rounded-lg border border-border bg-surface px-3 py-2 text-brand-ink"
        >
          {ALL_ZONES.map((value) => (
            <option key={value} value={value}>
              {ZONE_LABELS[value]}
            </option>
          ))}
        </select>
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="block text-sm">
          <span className="font-medium text-brand-ink">Quantity</span>
          <input
            type="number"
            min={1}
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
            className="mt-1 block w-full rounded-lg border border-border bg-surface px-3 py-2 text-brand-ink"
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-brand-ink">Unit</span>
          <select
            value={unit}
            onChange={(event) => setUnit(event.target.value as StockUnit)}
            className="mt-1 block w-full rounded-lg border border-border bg-surface px-3 py-2 text-brand-ink"
          >
            <option value="cases">{selectedSku?.caseUnit ?? "cases"}</option>
            <option value="loose_packs">{selectedSku?.looseUnit ?? "loose packs"}</option>
          </select>
        </label>
      </div>

      <label className="block text-sm">
        <span className="font-medium text-brand-ink">Notes (optional)</span>
        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          rows={2}
          className="mt-1 block w-full rounded-lg border border-border bg-surface px-3 py-2 text-brand-ink"
        />
      </label>

      <div className="space-y-3 rounded-2xl border border-border bg-surface/80 p-4">
        <p className="text-sm font-semibold text-brand-ink">Evidence photos</p>
        {requiredCategories.length > 0 ? (
          <p className="text-xs text-brand-ink/70">
            This zone requires pack, batch, and defect photos.
          </p>
        ) : (
          <p className="text-xs text-brand-ink/70">
            Photos optional unless zone requires defect evidence.
          </p>
        )}
        {[
          ...requiredCategories,
          ...optionalCategories.filter((c) => !requiredCategories.includes(c)),
        ].map((category) => (
          <label key={category} className="block text-sm">
            <span className="font-medium text-brand-ink">
              {EVIDENCE_LABELS[category]}
              {requiredCategories.includes(category) ? " *" : ""}
            </span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              capture="environment"
              onChange={onEvidenceChange(category)}
              className="mt-1 block w-full text-sm text-brand-ink"
            />
          </label>
        ))}
      </div>

      {geo ? (
        <p className="text-xs text-brand-ink/60">
          GPS: {geo.latitude.toFixed(5)}, {geo.longitude.toFixed(5)} (±
          {Math.round(geo.accuracyMeters)} m)
        </p>
      ) : (
        <button
          type="button"
          onClick={requestLocation}
          className="text-xs font-medium text-brand hover:underline"
        >
          Retry location
        </button>
      )}

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {success ? (
        <p className="text-sm font-medium text-green-700">Stock lot saved. Redirecting…</p>
      ) : null}

      <button
        type="button"
        disabled={!canSubmit}
        onClick={() => void onSubmit()}
        className="w-full rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-brand/90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting ? "Saving…" : "Save stock lot"}
      </button>
    </div>
  );
}

export default function NewStockLotPage() {
  return (
    <RequireAuth roles={FIELD_ROLES}>
      <ShellFrame title="New stock lot" eyebrow="Field">
        <Suspense fallback={<p className="text-sm text-brand-ink/70">Loading form…</p>}>
          <NewStockLotContent />
        </Suspense>
      </ShellFrame>
    </RequireAuth>
  );
}

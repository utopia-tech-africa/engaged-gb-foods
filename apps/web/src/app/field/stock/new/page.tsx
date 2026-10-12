"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";

import { useAuth } from "@/components/auth-provider";
import { DatePicker } from "@/components/date-picker";
import { RequireAuth } from "@/components/require-auth";
import { ShellFrame } from "@/components/shell-frame";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
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
import { cn } from "@/lib/utils";

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
      <Link href="/field/stock" className={cn(buttonVariants({ variant: "link" }), "h-auto p-0")}>
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

      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="space-y-2">
            <Label>SKU</Label>
            <Select
              value={skuId}
              onValueChange={(value) => {
                if (value) {
                  setSkuId(value);
                }
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select SKU" />
              </SelectTrigger>
              <SelectContent>
                {skus.map((sku) => (
                  <SelectItem key={sku.id} value={sku.id}>
                    {sku.name}
                    {sku.brand ? ` · ${sku.brand}` : ""} (×{sku.packFactor}/case)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="batch-code">Batch code</Label>
            <Input
              id="batch-code"
              type="text"
              value={batchCode}
              onChange={(event) => setBatchCode(event.target.value)}
              autoComplete="off"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="expiry-date">Expiry date (optional)</Label>
            <DatePicker id="expiry-date" value={expiryDate} onChange={setExpiryDate} />
          </div>

          <div className="space-y-2">
            <Label>Zone</Label>
            <Select
              value={zone}
              onValueChange={(value) => {
                if (value) {
                  setZone(value as StockZone);
                }
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ALL_ZONES.map((value) => (
                  <SelectItem key={value} value={value}>
                    {ZONE_LABELS[value]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                min={1}
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Unit</Label>
              <Select
                value={unit}
                onValueChange={(value) => {
                  if (value) {
                    setUnit(value as StockUnit);
                  }
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cases">{selectedSku?.caseUnit ?? "cases"}</SelectItem>
                  <SelectItem value="loose_packs">
                    {selectedSku?.looseUnit ?? "loose packs"}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-surface/80">
        <CardHeader>
          <CardTitle className="text-sm">Evidence photos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
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
            <div key={category} className="space-y-2">
              <Label htmlFor={`evidence-${category}`}>
                {EVIDENCE_LABELS[category]}
                {requiredCategories.includes(category) ? " *" : ""}
              </Label>
              <input
                id={`evidence-${category}`}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                capture="environment"
                onChange={onEvidenceChange(category)}
                className="block w-full text-sm text-brand-ink file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-primary-foreground"
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {geo ? (
        <p className="text-xs text-brand-ink/60">
          GPS: {geo.latitude.toFixed(5)}, {geo.longitude.toFixed(5)} (±
          {Math.round(geo.accuracyMeters)} m)
        </p>
      ) : (
        <Button type="button" variant="link" className="h-auto p-0" onClick={requestLocation}>
          Retry location
        </Button>
      )}

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {success ? (
        <p className="text-sm font-medium text-green-700">Stock lot saved. Redirecting…</p>
      ) : null}

      <Button
        type="button"
        disabled={!canSubmit}
        className="w-full"
        onClick={() => void onSubmit()}
      >
        {submitting ? "Saving…" : "Save stock lot"}
      </Button>
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

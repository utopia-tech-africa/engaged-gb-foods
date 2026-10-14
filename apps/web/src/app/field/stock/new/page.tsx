"use client";

import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { useAuth } from "@/components/auth-provider";
import { DatePicker } from "@/components/date-picker";
import { FormSkeleton } from "@/components/list-skeleton";
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
import { useNetworkOnline } from "@/hooks/use-network-online";
import { useGetMeDepots } from "@/lib/api/generated/assignments/assignments";
import type {
  StockEvidenceCategory,
  StockLotResponseDto,
  StockUnit,
  StockZone,
} from "@/lib/api/generated/model";
import { useGetSkus } from "@/lib/api/generated/skus/skus";
import {
  getGetStockLotsQueryKey,
  usePostStockLots,
} from "@/lib/api/generated/stock-lots/stock-lots";
import type { UserRole } from "@/lib/auth/types";
import { enqueueStockLot } from "@/lib/field/field-offline-enqueue";
import { isNetworkError } from "@/lib/field/field-offline-errors";
import { requiredEvidenceForZone, ZONE_LABELS } from "@/lib/stock/constants";
import { uploadPhoto } from "@/lib/uploads";
import { cn } from "@/lib/utils";

const FIELD_ROLES: UserRole[] = ["qc", "handler", "cluster_supervisor", "regional_supervisor"];

const ALL_ZONES: StockZone[] = [
  "unexamined",
  "conforming_pending_release",
  "recoverable_pending_approval",
  "held_or_rejected",
  "released_remaining_on_site",
];

const ZONE_OPTIONS = ALL_ZONES.map((value) => ({ value, label: ZONE_LABELS[value] }));

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
  const online = useNetworkOnline();

  const queryClient = useQueryClient();
  const enabled = Boolean(accessToken);
  const skusQuery = useGetSkus({ query: { enabled } });
  const depotsQuery = useGetMeDepots({ query: { enabled: enabled && Boolean(depotId) } });
  const createStockLot = usePostStockLots();

  const [selectedSkuId, setSelectedSkuId] = useState("");
  const [batchCode, setBatchCode] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [zone, setZone] = useState<StockZone>("unexamined");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState<StockUnit>("cases");
  const [notes, setNotes] = useState("");
  const [evidenceFiles, setEvidenceFiles] = useState<EvidenceFiles>({});
  const [geo, setGeo] = useState<GeoSnapshot | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [success, setSuccess] = useState<StockLotResponseDto | null>(null);
  const [savedOffline, setSavedOffline] = useState(false);

  const skus = skusQuery.data ?? [];
  const skuId = selectedSkuId || skus[0]?.id || "";
  const depot = depotsQuery.data?.find((item) => item.id === depotId) ?? null;
  // Offline the cached SKU/depot lists may be unavailable; hide fetch errors while offline.
  const depotError =
    depotsQuery.error && online
      ? depotsQuery.error.message
      : depotsQuery.isSuccess && !depot
        ? "Depot not found in your assignments."
        : null;
  const error = actionError ?? (online ? skusQuery.error?.message : null) ?? depotError;
  const submitting = isUploading || createStockLot.isPending;

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

  const selectedSku = skus.find((item) => item.id === skuId) ?? null;
  const requiredCategories = requiredEvidenceForZone(zone);
  const skuOptions = skus.map((sku) => ({
    value: sku.id,
    label: `${sku.name}${sku.brand ? ` · ${sku.brand}` : ""} (×${sku.packFactor}/case)`,
  }));
  const unitOptions = [
    { value: "cases", label: selectedSku?.caseUnit ?? "cases" },
    { value: "loose_packs", label: selectedSku?.looseUnit ?? "loose packs" },
  ];

  const onEvidenceChange =
    (category: StockEvidenceCategory) => (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) {
        return;
      }
      setEvidenceFiles((prev) => ({ ...prev, [category]: file }));
      setSuccess(null);
      setActionError(null);
    };

  const canSubmit = (() => {
    if (!accessToken || submitting || !skuId || !batchCode.trim() || !quantity) {
      return false;
    }
    if (!visitId && !depotId) {
      return false;
    }
    if (!visitId && !depot && online) {
      return false;
    }
    const qty = Number.parseInt(quantity, 10);
    if (!Number.isFinite(qty) || qty < 1) {
      return false;
    }
    return requiredCategories.every((category) => Boolean(evidenceFiles[category]));
  })();

  const selectedEvidence = (): { category: StockEvidenceCategory; file: File }[] => {
    const categoriesToUpload = [
      ...requiredCategories,
      ...(evidenceFiles.position ? (["position"] as const) : []),
    ];
    const selected: { category: StockEvidenceCategory; file: File }[] = [];
    for (const category of new Set(categoriesToUpload)) {
      const file = evidenceFiles[category];
      if (file) {
        selected.push({ category, file });
      }
    }
    return selected;
  };

  const lotFields = () => ({
    ...(visitId ? { visitId } : { depotId: depotId ?? undefined }),
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
  });

  const saveOffline = async () => {
    await enqueueStockLot({ ...lotFields(), evidenceFiles: selectedEvidence() });
    setSavedOffline(true);
    toast.success("Saved offline — will sync when online");
    setTimeout(() => {
      router.push("/field/stock");
    }, 1500);
  };

  const onSubmit = async () => {
    if (!canSubmit) {
      return;
    }
    setActionError(null);
    try {
      if (!navigator.onLine) {
        await saveOffline();
        return;
      }
      setIsUploading(true);
      const evidence = await Promise.all(
        selectedEvidence().map(async ({ category, file }) => ({
          category,
          objectKey: await uploadPhoto(file, "stock_evidence"),
        })),
      ).finally(() => setIsUploading(false));

      const lot = await createStockLot.mutateAsync({ data: { ...lotFields(), evidence } });
      setSuccess(lot);
      await queryClient.invalidateQueries({ queryKey: getGetStockLotsQueryKey() });
      setTimeout(() => {
        router.push("/field/stock");
      }, 1200);
    } catch (err: unknown) {
      if (isNetworkError(err)) {
        try {
          await saveOffline();
          return;
        } catch {
          setActionError("Could not save offline on this device.");
          return;
        }
      }
      setActionError(err instanceof Error ? err.message : "Could not save stock lot");
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
              items={skuOptions}
              value={skuId}
              onValueChange={(value) => {
                if (value) {
                  setSelectedSkuId(value);
                }
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select SKU" />
              </SelectTrigger>
              <SelectContent>
                {skuOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
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
              items={ZONE_OPTIONS}
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
                {ZONE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
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
                items={unitOptions}
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
                  {unitOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
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
      {savedOffline ? (
        <p className="text-sm font-medium text-amber-800">
          Saved offline — will sync when online. Redirecting…
        </p>
      ) : null}

      <Button
        type="button"
        disabled={!canSubmit || savedOffline}
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
        <Suspense fallback={<FormSkeleton />}>
          <NewStockLotContent />
        </Suspense>
      </ShellFrame>
    </RequireAuth>
  );
}

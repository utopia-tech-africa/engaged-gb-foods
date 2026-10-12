"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useAuth } from "@/components/auth-provider";
import { RequireAuth } from "@/components/require-auth";
import { ShellFrame } from "@/components/shell-frame";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CLIENT_CONTROL_ROLES } from "@/lib/client/roles";
import { fetchStockLotById, type StockLot, ZONE_LABELS } from "@/lib/stock/api";
import { cn } from "@/lib/utils";
import {
  DISPOSITION_LABELS,
  type DispositionDecision,
  postStockLotDisposition,
} from "@/lib/visit/api";

const PENDING_ZONES = new Set([
  "held_or_rejected",
  "recoverable_pending_approval",
  "conforming_pending_release",
]);

export default function ClientLotDispositionPage() {
  const params = useParams<{ id: string }>();
  const lotId = params.id;
  const router = useRouter();
  const { accessToken } = useAuth();
  const [lot, setLot] = useState<StockLot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [decision, setDecision] = useState<DispositionDecision>("hold");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!accessToken) {
      return;
    }
    setLoading(true);
    void fetchStockLotById(accessToken, lotId)
      .then(setLot)
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Could not load lot");
      })
      .finally(() => setLoading(false));
  }, [accessToken, lotId]);

  const submit = async () => {
    if (!accessToken || !reason.trim()) {
      setError("Reason is required");
      return;
    }
    setBusy(true);
    try {
      await postStockLotDisposition(accessToken, lotId, {
        decision,
        reason: reason.trim(),
      });
      router.push("/client");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Disposition failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <RequireAuth roles={CLIENT_CONTROL_ROLES}>
      <ShellFrame title="Disposition" eyebrow="GBfoods">
        <div className="max-w-lg space-y-6">
          <Link href="/client" className={cn(buttonVariants({ variant: "link" }), "h-auto p-0")}>
            ← Control room
          </Link>

          {loading ? <p className="text-sm text-brand-ink/70">Loading lot…</p> : null}
          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          {lot ? (
            <>
              <Card>
                <CardContent className="text-sm">
                  <p className="font-semibold">{lot.sku.name}</p>
                  <p className="text-brand">{ZONE_LABELS[lot.zone]}</p>
                  <p className="mt-2 text-brand-ink/70">
                    {lot.visit.depot.name} · batch {lot.batchCode}
                  </p>
                  {!PENDING_ZONES.has(lot.zone) ? (
                    <p className="mt-2 text-amber-700">
                      This lot is not in a pending disposition zone.
                    </p>
                  ) : null}
                </CardContent>
              </Card>

              <div className="space-y-2">
                <Label>Decision</Label>
                <Select
                  value={decision}
                  onValueChange={(value) => {
                    if (value) {
                      setDecision(value as DispositionDecision);
                    }
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(DISPOSITION_LABELS) as DispositionDecision[]).map((key) => (
                      <SelectItem key={key} value={key}>
                        {DISPOSITION_LABELS[key]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="disposition-reason">Reason</Label>
                <Textarea
                  id="disposition-reason"
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  rows={4}
                  placeholder="Required rationale for audit trail"
                />
              </div>

              <Button type="button" disabled={busy} onClick={() => void submit()}>
                Submit disposition
              </Button>
            </>
          ) : null}
        </div>
      </ShellFrame>
    </RequireAuth>
  );
}

"use client";

import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

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
import type { DispositionDecision } from "@/lib/api/generated/model";
import {
  getGetStockLotsByIdQueryKey,
  useGetStockLotsById,
  usePostStockLotsByIdDisposition,
} from "@/lib/api/generated/stock-lots/stock-lots";
import { CLIENT_CONTROL_ROLES } from "@/lib/client/roles";
import { ZONE_LABELS } from "@/lib/stock/constants";
import { cn } from "@/lib/utils";
import { DISPOSITION_LABELS } from "@/lib/visit/constants";

const DECISION_OPTIONS = (Object.keys(DISPOSITION_LABELS) as DispositionDecision[]).map((key) => ({
  value: key,
  label: DISPOSITION_LABELS[key],
}));

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
  const queryClient = useQueryClient();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [decision, setDecision] = useState<DispositionDecision>("hold");
  const [reason, setReason] = useState("");

  const lotQuery = useGetStockLotsById(lotId, { query: { enabled: Boolean(accessToken) } });
  const createDisposition = usePostStockLotsByIdDisposition();

  const lot = lotQuery.data;
  const loading = lotQuery.isLoading;
  const busy = createDisposition.isPending;
  const error = submitError ?? lotQuery.error?.message ?? null;

  const submit = async () => {
    if (!reason.trim()) {
      setSubmitError("Reason is required");
      return;
    }
    setSubmitError(null);
    try {
      await createDisposition.mutateAsync({
        id: lotId,
        data: { decision, reason: reason.trim() },
      });
      await queryClient.invalidateQueries({ queryKey: getGetStockLotsByIdQueryKey(lotId) });
      router.push("/client");
      router.refresh();
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : "Disposition failed");
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
                  items={DECISION_OPTIONS}
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
                    {DECISION_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
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

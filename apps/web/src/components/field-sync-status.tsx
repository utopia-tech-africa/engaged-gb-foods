"use client";

import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { CloudOff, RefreshCw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useFieldOutboxCount } from "@/hooks/use-field-outbox-count";
import { useNetworkOnline } from "@/hooks/use-network-online";
import { useFieldLastSyncedAt } from "@/lib/field/field-last-synced";
import { flushFieldOutbox } from "@/lib/field/field-offline-flush";
import { cn } from "@/lib/utils";

/** Offline indicator, pending count, last sync time and a manual "Sync now" action. */
export const FieldSyncStatus = () => {
  const queryClient = useQueryClient();
  const online = useNetworkOnline();
  const pendingCount = useFieldOutboxCount();
  const lastSyncedAt = useFieldLastSyncedAt();
  const [syncing, setSyncing] = useState(false);

  const onSyncNow = async () => {
    setSyncing(true);
    try {
      const result = await flushFieldOutbox(queryClient);
      if (result.flushed === 0 && result.dropped === 0 && result.stopped) {
        toast.message("Could not sync yet", {
          description: "Check your connection and sign-in, then try again.",
        });
      }
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border px-4 py-3 text-sm",
        online ? "border-border bg-surface/80" : "border-amber-300 bg-amber-50 text-amber-950",
      )}
    >
      {online ? (
        <Badge variant="secondary">Online</Badge>
      ) : (
        <Badge variant="outline" className="border-amber-400 text-amber-900">
          <CloudOff aria-hidden />
          Offline
        </Badge>
      )}
      <span>
        {pendingCount === 0
          ? "Nothing waiting to sync"
          : `${pendingCount} ${pendingCount === 1 ? "record" : "records"} waiting to sync`}
      </span>
      <span className="text-brand-ink/70">
        {lastSyncedAt
          ? `Last synced ${format(lastSyncedAt, "d MMM, HH:mm")}`
          : "No saved records synced yet"}
      </span>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="ml-auto"
        disabled={syncing || !online}
        onClick={() => void onSyncNow()}
      >
        <RefreshCw className={cn(syncing && "animate-spin")} aria-hidden />
        {syncing ? "Syncing…" : "Sync now"}
      </Button>
    </div>
  );
};

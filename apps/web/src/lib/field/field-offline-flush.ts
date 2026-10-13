"use client";

import type { QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  getGetAttendanceQueryKey,
  getGetMeAttendanceTodayQueryKey,
  postAttendance,
} from "@/lib/api/generated/attendance/attendance";
import type { StockEvidenceInputDto, UploadPurpose } from "@/lib/api/generated/model";
import { getGetStockLotsQueryKey, postStockLots } from "@/lib/api/generated/stock-lots/stock-lots";
import { getGetVisitsQueryKey } from "@/lib/api/generated/visits/visits";
import { readAuthSession } from "@/lib/auth/storage";
import { uploadPhoto } from "@/lib/uploads";

import { writeLastSyncedAt } from "./field-last-synced";
import { isPermanentClientError } from "./field-offline-errors";
import {
  deleteFieldOutboxEntry,
  type FieldOutboxEntry,
  type FieldOutboxFile,
  listFieldOutboxEntries,
} from "./field-offline-idb";

export type FlushResult = {
  flushed: number;
  dropped: number;
  /** True when the run stopped early (offline, 401, or server error) and should retry later. */
  stopped: boolean;
};

const EMPTY_RESULT: FlushResult = { flushed: 0, dropped: 0, stopped: false };

export const fileFromBuffer = (stored: FieldOutboxFile): File =>
  new File([stored.arrayBuffer], stored.name, { type: stored.type });

const sendEntry = async (entry: FieldOutboxEntry): Promise<void> => {
  if (entry.kind === "attendance") {
    const { depotId, kind, geo, photo } = entry.payload;
    const photoObjectKey = await uploadPhoto(fileFromBuffer(photo), "attendance_photo");
    await postAttendance({
      depotId,
      kind,
      photoObjectKey,
      ...(geo ? geo : {}),
    });
    return;
  }

  const { evidenceFiles, ...fields } = entry.payload;
  // Stock evidence categories (pack/batch/defect/position) all use the `stock_evidence` purpose.
  const purpose: UploadPurpose = "stock_evidence";
  const evidence: StockEvidenceInputDto[] = [];
  for (const { category, ...file } of evidenceFiles) {
    evidence.push({ category, objectKey: await uploadPhoto(fileFromBuffer(file), purpose) });
  }
  await postStockLots({ ...fields, evidence });
};

const invalidateAfterSync = async (queryClient: QueryClient | undefined): Promise<void> => {
  if (!queryClient) {
    return;
  }
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: getGetAttendanceQueryKey() }),
    queryClient.invalidateQueries({ queryKey: getGetMeAttendanceTodayQueryKey() }),
    queryClient.invalidateQueries({ queryKey: getGetStockLotsQueryKey() }),
    queryClient.invalidateQueries({ queryKey: getGetVisitsQueryKey() }),
  ]);
};

const runFlush = async (queryClient: QueryClient | undefined): Promise<FlushResult> => {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return { ...EMPTY_RESULT, stopped: true };
  }
  if (!readAuthSession()?.accessToken) {
    return { ...EMPTY_RESULT, stopped: true };
  }

  let entries: FieldOutboxEntry[];
  try {
    entries = await listFieldOutboxEntries();
  } catch {
    return EMPTY_RESULT;
  }

  let flushed = 0;
  let dropped = 0;
  let stopped = false;

  for (const entry of entries) {
    try {
      await sendEntry(entry);
      await deleteFieldOutboxEntry(entry.id);
      flushed += 1;
    } catch (error: unknown) {
      if (isPermanentClientError(error)) {
        await deleteFieldOutboxEntry(entry.id);
        dropped += 1;
        toast.error("Could not sync a saved field record", {
          description: error.message.slice(0, 220),
        });
        continue;
      }
      // Network failure, 401, 408/429, or 5xx: keep the entry and retry on the next trigger.
      stopped = true;
      break;
    }
  }

  if (flushed > 0) {
    // Server receipt: the API accepted at least one queued record just now.
    writeLastSyncedAt(Date.now());
    await invalidateAfterSync(queryClient);
    toast.success(flushed === 1 ? "Saved record synced" : `${flushed} saved records synced`);
  }

  return { flushed, dropped, stopped };
};

let inFlight: Promise<FlushResult> | null = null;

/**
 * Sends queued attendance and stock lots oldest-first. Concurrent callers (online event,
 * manual button) share one run so a record is never posted twice.
 */
export const flushFieldOutbox = (queryClient?: QueryClient): Promise<FlushResult> => {
  if (!inFlight) {
    inFlight = runFlush(queryClient).finally(() => {
      inFlight = null;
    });
  }
  return inFlight;
};

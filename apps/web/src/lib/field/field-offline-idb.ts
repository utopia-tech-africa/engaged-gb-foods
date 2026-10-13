"use client";

/**
 * IndexedDB outbox for field writes (attendance + stock lots) captured offline.
 * Photo bytes are stored as ArrayBuffers and uploaded only when the queue flushes.
 */
import type {
  AttendanceKind,
  CreateStockLotDto,
  StockEvidenceCategory,
} from "@/lib/api/generated/model";

const DB_NAME = "gbfoods-field-offline";
const STORE = "field-outbox";
const DB_VERSION = 1;

export const FIELD_OUTBOX_CHANGED_EVENT = "gbfoods-field-outbox-changed";

export type FieldOutboxFile = {
  name: string;
  type: string;
  arrayBuffer: ArrayBuffer;
};

export type FieldOutboxGeo = {
  latitude: number;
  longitude: number;
  accuracyMeters: number;
};

export type AttendanceOutboxPayload = {
  depotId: string;
  kind: AttendanceKind;
  /** Epoch ms when the user pressed submit on the device. */
  capturedAt: number;
  geo?: FieldOutboxGeo;
  photo: FieldOutboxFile;
};

export type StockLotEvidenceFile = FieldOutboxFile & {
  category: StockEvidenceCategory;
  /** Epoch ms when the user pressed save on the device. */
  capturedAt: number;
};

/** `CreateStockLotDto` fields (depotId/visitId/...) without evidence object keys. */
export type StockLotOutboxPayload = Omit<CreateStockLotDto, "evidence"> & {
  evidenceFiles: StockLotEvidenceFile[];
};

export type FieldOutboxEntry =
  | { id: string; kind: "attendance"; createdAt: number; payload: AttendanceOutboxPayload }
  | { id: string; kind: "stock_lot"; createdAt: number; payload: StockLotOutboxPayload };

export const dispatchFieldOutboxChanged = (): void => {
  if (typeof window === "undefined") {
    return;
  }
  window.dispatchEvent(new CustomEvent(FIELD_OUTBOX_CHANGED_EVENT));
};

const openDb = (): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("Offline storage is not available on this device."));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error ?? new Error("Could not open offline storage."));
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id" });
      }
    };
  });

/** Runs one request in its own transaction and resolves with its result once committed. */
const withStore = async <TResult>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<TResult>,
): Promise<TResult> => {
  const db = await openDb();
  return new Promise<TResult>((resolve, reject) => {
    const transaction = db.transaction(STORE, mode);
    const request = run(transaction.objectStore(STORE));
    transaction.oncomplete = () => {
      db.close();
      resolve(request.result);
    };
    const fail = () => {
      db.close();
      reject(transaction.error ?? request.error ?? new Error("Offline storage failed."));
    };
    transaction.onerror = fail;
    transaction.onabort = fail;
  });
};

export const addFieldOutboxEntry = async (entry: FieldOutboxEntry): Promise<void> => {
  await withStore("readwrite", (store) => store.add(entry));
  dispatchFieldOutboxChanged();
};

export const deleteFieldOutboxEntry = async (id: string): Promise<void> => {
  await withStore("readwrite", (store) => store.delete(id));
  dispatchFieldOutboxChanged();
};

export const clearFieldOutbox = async (): Promise<void> => {
  await withStore("readwrite", (store) => store.clear());
  dispatchFieldOutboxChanged();
};

/** Oldest first, so the queue replays in capture order. */
export const listFieldOutboxEntries = async (): Promise<FieldOutboxEntry[]> => {
  const rows = await withStore<FieldOutboxEntry[]>("readonly", (store) => store.getAll());
  return [...rows].sort((a, b) => a.createdAt - b.createdAt);
};

export const countFieldOutboxEntries = (): Promise<number> =>
  withStore("readonly", (store) => store.count());

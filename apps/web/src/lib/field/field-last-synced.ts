"use client";

import { useSyncExternalStore } from "react";

export const LAST_SYNCED_STORAGE_KEY = "gbfoods.field.lastSyncedAt";
export const FIELD_LAST_SYNCED_EVENT = "gbfoods-field-last-synced";

/** Epoch ms of the last queued record the server accepted, or null if none yet. */
export const readLastSyncedAt = (): number | null => {
  if (typeof window === "undefined") {
    return null;
  }
  const raw = window.localStorage.getItem(LAST_SYNCED_STORAGE_KEY);
  if (!raw) {
    return null;
  }
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
};

export const writeLastSyncedAt = (timestamp: number): void => {
  window.localStorage.setItem(LAST_SYNCED_STORAGE_KEY, String(timestamp));
  window.dispatchEvent(new CustomEvent(FIELD_LAST_SYNCED_EVENT));
};

const subscribe = (onStoreChange: () => void): (() => void) => {
  window.addEventListener(FIELD_LAST_SYNCED_EVENT, onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    window.removeEventListener(FIELD_LAST_SYNCED_EVENT, onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
};

export const useFieldLastSyncedAt = (): number | null =>
  useSyncExternalStore(subscribe, readLastSyncedAt, () => null);

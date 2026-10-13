"use client";

import { useSyncExternalStore } from "react";

const subscribe = (onStoreChange: () => void): (() => void) => {
  window.addEventListener("online", onStoreChange);
  window.addEventListener("offline", onStoreChange);
  return () => {
    window.removeEventListener("online", onStoreChange);
    window.removeEventListener("offline", onStoreChange);
  };
};

const getSnapshot = (): boolean => navigator.onLine;

/** Assume online during SSR so the offline banner never flashes on first paint. */
const getServerSnapshot = (): boolean => true;

/** Tracks browser online/offline signals via `navigator.onLine` and window events. */
export const useNetworkOnline = (): boolean =>
  useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

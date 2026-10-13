"use client";

import { SerwistProvider } from "@serwist/next/react";
import { type ReactNode, useEffect } from "react";

const isDevelopment = process.env.NODE_ENV === "development";

type PwaProviderProps = {
  children: ReactNode;
};

/**
 * Registers the Serwist service worker in production so the app is installable and the offline
 * fallback is cached. In development the worker is disabled and any previous registration (and
 * its caches) is removed to avoid stale assets while iterating.
 * Uses `type: "classic"` because Serwist emits a non-ESM worker bundle.
 */
export const PwaProvider = ({ children }: PwaProviderProps) => {
  useEffect(() => {
    if (!isDevelopment || !("serviceWorker" in navigator)) {
      return;
    }
    void (async () => {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((registration) => registration.unregister()));
      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((key) => caches.delete(key)));
      }
      if (registrations.length > 0) {
        window.location.reload();
      }
    })();
  }, []);

  return (
    <SerwistProvider swUrl="/sw.js" disable={isDevelopment} options={{ type: "classic" }}>
      {children}
    </SerwistProvider>
  );
};

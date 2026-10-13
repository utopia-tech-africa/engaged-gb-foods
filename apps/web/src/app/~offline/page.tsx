import type { Metadata } from "next";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Offline",
  robots: { index: false, follow: false },
};

/** Shown when a document navigation fails offline and the service worker serves this fallback. */
export default function OfflinePage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-background px-6 text-center">
      <h1 className="font-display text-xl font-semibold text-foreground">You are offline</h1>
      <p className="max-w-sm text-sm text-brand-ink">
        This page is not available without a connection. Check-ins and stock lots you already saved
        on this device will sync automatically when you are back online.
      </p>
      <Link href="/field" className={buttonVariants({ variant: "outline" })}>
        Back to field workspace
      </Link>
    </div>
  );
}

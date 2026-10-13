"use client";

import { Download, X } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

const DISMISSED_KEY = "gbfoods.pwa.installDismissed";

/** Chromium fires this before showing its own install UI; it is not in lib.dom yet. */
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const isStandalone = (): boolean =>
  window.matchMedia("(display-mode: standalone)").matches ||
  ("standalone" in navigator && navigator.standalone === true);

const isIosSafari = (): boolean => /iphone|ipad|ipod/i.test(navigator.userAgent);

/** Small install nudge for field routes. Hidden once installed or dismissed. */
export const PwaInstallPrompt = () => {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosHint, setShowIosHint] = useState(false);

  useEffect(() => {
    if (isStandalone() || window.localStorage.getItem(DISMISSED_KEY)) {
      return;
    }
    if (isIosSafari()) {
      setShowIosHint(true);
    }
    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstallEvent(null);
      setShowIosHint(false);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (!installEvent && !showIosHint) {
    return null;
  }

  const dismiss = () => {
    window.localStorage.setItem(DISMISSED_KEY, "1");
    setInstallEvent(null);
    setShowIosHint(false);
  };

  const install = async () => {
    if (!installEvent) {
      return;
    }
    await installEvent.prompt();
    await installEvent.userChoice;
    setInstallEvent(null);
  };

  return (
    <div className="mt-4 flex items-center gap-3 rounded-xl border border-brand/30 bg-brand-muted px-4 py-3 text-sm text-brand-ink">
      <Download className="size-4 shrink-0 text-brand" aria-hidden />
      <p className="flex-1">
        {installEvent
          ? "Install GBfoods Stock Control for full-screen field use and offline capture."
          : "To install: tap Share in Safari, then Add to Home Screen."}
      </p>
      {installEvent ? (
        <Button type="button" size="sm" onClick={() => void install()}>
          Install
        </Button>
      ) : null}
      <Button type="button" size="icon-sm" variant="ghost" aria-label="Dismiss" onClick={dismiss}>
        <X aria-hidden />
      </Button>
    </div>
  );
};

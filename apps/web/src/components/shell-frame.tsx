"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";

import { useAuth } from "@/components/auth-provider";
import { FieldSyncStatus } from "@/components/field-sync-status";
import { PwaInstallPrompt } from "@/components/pwa-install-prompt";
import { Button } from "@/components/ui/button";

type ShellFrameProps = {
  title: string;
  eyebrow: string;
  children: ReactNode;
};

export const ShellFrame = ({ title, eyebrow, children }: ShellFrameProps) => {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const isFieldRoute = usePathname().startsWith("/field");

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-6 py-8 md:px-10">
      <header className="flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/GB_Logo.svg"
            alt="GBfoods"
            width={131}
            height={77}
            unoptimized
            className="h-10 w-auto"
          />
        </Link>
        <div className="text-right">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">{eyebrow}</p>
          <p className="mt-1 text-sm text-brand-ink">{user?.fullName}</p>
        </div>
      </header>

      {isFieldRoute ? (
        <>
          <FieldSyncStatus />
          <PwaInstallPrompt />
        </>
      ) : null}

      <section className="mt-10 space-y-3">
        <h1 className="font-display text-3xl font-semibold text-foreground md:text-4xl">{title}</h1>
        {children}
      </section>

      <div className="mt-auto pt-10">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            void signOut().then(() => router.replace("/"));
          }}
        >
          Sign out
        </Button>
      </div>
    </div>
  );
};

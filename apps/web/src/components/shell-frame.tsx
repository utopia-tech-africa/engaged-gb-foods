"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";

type ShellFrameProps = {
  title: string;
  eyebrow: string;
  children: ReactNode;
};

export const ShellFrame = ({ title, eyebrow, children }: ShellFrameProps) => {
  const { user, signOut } = useAuth();
  const router = useRouter();

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-6 py-8 md:px-10">
      <header className="flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/logo-ghana.png"
            alt="GBfoods"
            width={140}
            height={48}
            className="h-10 w-auto"
          />
        </Link>
        <div className="text-right">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">{eyebrow}</p>
          <p className="mt-1 text-sm text-brand-ink">{user?.fullName}</p>
        </div>
      </header>

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

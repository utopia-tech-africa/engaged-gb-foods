import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type EmptyStateProps = {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  /** Visual height of the empty panel. */
  size?: "sm" | "md" | "lg";
};

const sizeClass = {
  sm: "min-h-40 px-4 py-8",
  md: "min-h-56 px-6 py-12",
  lg: "min-h-72 px-6 py-16",
} as const;

export const EmptyState = ({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className,
  size = "md",
}: EmptyStateProps) => (
  <div
    role="status"
    className={cn(
      "flex w-full flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/60 text-center",
      sizeClass[size],
      className,
    )}
  >
    <span className="flex size-12 items-center justify-center rounded-full bg-brand-muted text-brand">
      <Icon className="size-5" aria-hidden />
    </span>
    <p className="mt-4 font-medium text-foreground">{title}</p>
    {description ? (
      <p className="mt-1 max-w-sm text-sm leading-relaxed text-muted-foreground">{description}</p>
    ) : null}
    {action ? <div className="mt-5">{action}</div> : null}
  </div>
);

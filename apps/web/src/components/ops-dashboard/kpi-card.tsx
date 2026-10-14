import type { LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type KpiTone = "default" | "warning" | "danger" | "success";

const TONE_CLASSES: Record<KpiTone, string> = {
  default: "bg-brand-muted text-brand",
  warning: "bg-amber-100 text-warning",
  danger: "bg-red-100 text-danger",
  success: "bg-green-100 text-success",
};

type KpiCardProps = {
  label: string;
  value: number | string;
  hint?: string;
  icon: LucideIcon;
  tone?: KpiTone;
};

export const KpiCard = ({ label, value, hint, icon: Icon, tone = "default" }: KpiCardProps) => (
  <Card size="sm">
    <CardContent className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="mt-1 font-display text-2xl font-semibold tabular-nums text-foreground">
          {value}
        </p>
        {hint ? <p className="mt-0.5 truncate text-xs text-muted-foreground">{hint}</p> : null}
      </div>
      <span
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-lg",
          TONE_CLASSES[tone],
        )}
      >
        <Icon className="size-4" aria-hidden />
      </span>
    </CardContent>
  </Card>
);

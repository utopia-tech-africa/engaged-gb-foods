import { BarChart3, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { EmptyState } from "@/components/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ChartCardProps = {
  title: string;
  description?: string;
  isEmpty?: boolean;
  emptyMessage?: string;
  emptyIcon?: LucideIcon;
  children: ReactNode;
};

export const ChartCard = ({
  title,
  description,
  isEmpty = false,
  emptyMessage = "No data for this day.",
  emptyIcon = BarChart3,
  children,
}: ChartCardProps) => (
  <Card>
    <CardHeader>
      <CardTitle className="font-display text-base">{title}</CardTitle>
      {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
    </CardHeader>
    <CardContent>
      {isEmpty ? (
        <EmptyState
          icon={emptyIcon}
          title={emptyMessage}
          size="sm"
          className="border-0 bg-muted/30"
        />
      ) : (
        children
      )}
    </CardContent>
  </Card>
);

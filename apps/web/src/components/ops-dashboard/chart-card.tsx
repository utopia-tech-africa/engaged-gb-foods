import type { ReactNode } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ChartCardProps = {
  title: string;
  description?: string;
  isEmpty?: boolean;
  emptyMessage?: string;
  children: ReactNode;
};

export const ChartCard = ({
  title,
  description,
  isEmpty = false,
  emptyMessage = "No data for this day.",
  children,
}: ChartCardProps) => (
  <Card>
    <CardHeader>
      <CardTitle className="font-display text-base">{title}</CardTitle>
      {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
    </CardHeader>
    <CardContent>
      {isEmpty ? (
        <div className="flex h-56 items-center justify-center text-sm text-muted-foreground">
          {emptyMessage}
        </div>
      ) : (
        children
      )}
    </CardContent>
  </Card>
);

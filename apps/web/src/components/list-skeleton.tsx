import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const range = (count: number): string[] =>
  Array.from({ length: count }, (_, index) => `slot-${index + 1}`);

type TableSkeletonProps = {
  rows?: number;
  columns?: number;
  className?: string;
};

export const TableSkeleton = ({ rows = 6, columns = 4, className }: TableSkeletonProps) => {
  const columnIds = range(columns);
  const rowIds = range(rows);

  return (
    <div
      role="status"
      aria-label="Loading"
      aria-busy="true"
      className={cn("overflow-hidden rounded-xl border border-border bg-card", className)}
    >
      <div className="flex gap-4 border-b border-border bg-muted/50 px-4 py-3">
        {columnIds.map((columnId) => (
          <Skeleton key={`head-${columnId}`} className="h-3 flex-1" />
        ))}
      </div>
      <ul className="divide-y divide-border">
        {rowIds.map((rowId) => (
          <li key={rowId} className="flex items-center gap-4 px-4 py-3.5">
            {columnIds.map((columnId) => (
              <Skeleton
                key={`${rowId}-${columnId}`}
                className={cn("h-4 flex-1", columnId === "slot-1" && "max-w-20")}
              />
            ))}
          </li>
        ))}
      </ul>
    </div>
  );
};

type CardListSkeletonProps = {
  count?: number;
  className?: string;
  /** Photo + details layout used by attendance. */
  withMedia?: boolean;
};

export const CardListSkeleton = ({
  count = 4,
  className,
  withMedia = false,
}: CardListSkeletonProps) => (
  <ul role="status" aria-label="Loading" aria-busy="true" className={cn("space-y-3", className)}>
    {range(count).map((cardId) => (
      <li key={cardId}>
        <Card>
          <CardContent
            className={cn(withMedia ? "grid gap-4 md:grid-cols-[7.5rem_1fr]" : "space-y-3")}
          >
            {withMedia ? <Skeleton className="h-28 w-full rounded-lg" /> : null}
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
              <Skeleton className="h-4 w-full max-w-md" />
              <Skeleton className="h-4 w-2/3 max-w-xs" />
              <Skeleton className="h-3 w-28" />
            </div>
          </CardContent>
        </Card>
      </li>
    ))}
  </ul>
);

type DashboardSkeletonProps = {
  className?: string;
};

export const DashboardSkeleton = ({ className }: DashboardSkeletonProps) => (
  <div
    role="status"
    aria-label="Loading dashboard"
    aria-busy="true"
    className={cn("space-y-6", className)}
  >
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {range(4).map((kpiId) => (
        <Card key={kpiId}>
          <CardContent className="space-y-3 pt-1">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-32" />
          </CardContent>
        </Card>
      ))}
    </div>
    <div className="grid gap-4 lg:grid-cols-2">
      {range(4).map((chartId) => (
        <Card key={chartId}>
          <CardContent className="space-y-4 pt-1">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-56 w-full rounded-lg" />
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
);

type FormSkeletonProps = {
  className?: string;
};

export const FormSkeleton = ({ className }: FormSkeletonProps) => (
  <div
    role="status"
    aria-label="Loading form"
    aria-busy="true"
    className={cn("space-y-4 rounded-xl border border-border bg-card p-5", className)}
  >
    <Skeleton className="h-5 w-40" />
    <Skeleton className="h-11 w-full" />
    <Skeleton className="h-11 w-full" />
    <Skeleton className="h-24 w-full" />
    <Skeleton className="h-11 w-36" />
  </div>
);

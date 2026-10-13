"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { NationalSummaryResponseDto } from "@/lib/api/generated/model";

type NationalCardProps = {
  summary: NationalSummaryResponseDto | null;
  isLoading: boolean;
};

const Stat = ({ label, value }: { label: string; value: string | number }) => (
  <div className="rounded-lg border border-border bg-surface p-4">
    <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
    <p className="mt-1 font-display text-2xl text-brand-ink">{value}</p>
  </div>
);

export const DailyReturnNationalCard = ({ summary, isLoading }: NationalCardProps) => (
  <Card>
    <CardHeader>
      <CardTitle className="font-display text-lg">National summary</CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      {isLoading || !summary ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-4">
            <Stat
              label="Regions submitted"
              value={`${summary.regionsSubmitted} / ${summary.regionsTotal}`}
            />
            <Stat label="Depots planned" value={summary.totals.depotsPlanned} />
            <Stat label="Depots completed" value={summary.totals.depotsCompleted} />
            <Stat label="Exceptions" value={summary.totals.depotsException} />
          </div>
          <ul className="flex flex-wrap gap-2">
            {summary.returns.map((row) => (
              <li key={row.region.id}>
                <Badge variant={row.submitted ? "default" : "outline"}>
                  {row.region.name}: {row.submitted ? "In" : "Outstanding"}
                </Badge>
              </li>
            ))}
          </ul>
        </>
      )}
    </CardContent>
  </Card>
);

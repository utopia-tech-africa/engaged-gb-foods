"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { ChartCard } from "@/components/ops-dashboard/chart-card";
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { OpsRegionCoverageDto } from "@/lib/api/generated/model";

const COVERAGE_CONFIG = {
  complete: { label: "Complete", color: "var(--chart-3)" },
  exception: { label: "Exception", color: "var(--chart-1)" },
} satisfies ChartConfig;

type RegionCoverageChartProps = {
  data: OpsRegionCoverageDto[];
};

export const RegionCoverageChart = ({ data }: RegionCoverageChartProps) => (
  <ChartCard
    title="Region coverage"
    description="Depots with a complete or exception visit, by region"
    isEmpty={data.length === 0}
    emptyMessage="No active regions."
  >
    <ChartContainer config={COVERAGE_CONFIG} className="aspect-auto h-72 w-full">
      <BarChart data={data} margin={{ left: 0, right: 8 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="regionCode" tickLine={false} axisLine={false} tickMargin={8} />
        <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={28} />
        <ChartTooltip
          content={
            <ChartTooltipContent
              labelFormatter={(label) => {
                const region = data.find((row) => row.regionCode === label);
                return region ? `${region.regionName} · ${region.depots} depots` : label;
              }}
            />
          }
        />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar
          dataKey="complete"
          stackId="coverage"
          fill="var(--color-complete)"
          radius={[0, 0, 4, 4]}
        />
        <Bar
          dataKey="exception"
          stackId="coverage"
          fill="var(--color-exception)"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ChartContainer>
  </ChartCard>
);

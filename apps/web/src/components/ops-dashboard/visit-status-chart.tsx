"use client";

import { Cell, Pie, PieChart } from "recharts";

import { ChartCard } from "@/components/ops-dashboard/chart-card";
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { OpsVisitStatusCountDto } from "@/lib/api/generated/model";

const STATUS_CONFIG = {
  scheduled: { label: "Scheduled", color: "var(--chart-2)" },
  in_progress: { label: "In progress", color: "var(--chart-4)" },
  complete: { label: "Complete", color: "var(--chart-3)" },
  exception: { label: "Exception", color: "var(--chart-1)" },
} satisfies ChartConfig;

type VisitStatusChartProps = {
  data: OpsVisitStatusCountDto[];
};

export const VisitStatusChart = ({ data }: VisitStatusChartProps) => {
  const total = data.reduce((sum, row) => sum + row.count, 0);
  const rows = data
    .filter((row) => row.count > 0)
    .map((row) => ({
      ...row,
      fill: STATUS_CONFIG[row.status as keyof typeof STATUS_CONFIG]?.color ?? "var(--chart-2)",
    }));

  return (
    <ChartCard
      title="Visit status"
      description={`${total} visit${total === 1 ? "" : "s"} on this day`}
      isEmpty={total === 0}
      emptyMessage="No visits scheduled for this day."
    >
      <ChartContainer config={STATUS_CONFIG} className="mx-auto aspect-square max-h-72 w-full">
        <PieChart>
          <ChartTooltip content={<ChartTooltipContent nameKey="status" hideLabel />} />
          <Pie data={rows} dataKey="count" nameKey="status" innerRadius="55%" strokeWidth={2}>
            {rows.map((row) => (
              <Cell key={row.status} fill={row.fill} />
            ))}
          </Pie>
          <ChartLegend content={<ChartLegendContent nameKey="status" />} />
        </PieChart>
      </ChartContainer>
    </ChartCard>
  );
};

"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { ChartCard } from "@/components/ops-dashboard/chart-card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { EscalationTrigger, OpsEscalationTriggerCountDto } from "@/lib/api/generated/model";
import { TRIGGER_LABELS } from "@/lib/escalation/constants";

const ESCALATION_CONFIG = {
  count: { label: "Escalations", color: "var(--chart-5)" },
} satisfies ChartConfig;

type EscalationTriggerChartProps = {
  data: OpsEscalationTriggerCountDto[];
};

export const EscalationTriggerChart = ({ data }: EscalationTriggerChartProps) => {
  const rows = data.map((row) => ({
    ...row,
    label: TRIGGER_LABELS[row.trigger as EscalationTrigger] ?? row.trigger,
  }));

  return (
    <ChartCard
      title="Open escalations by trigger"
      description="Open and in-progress, across all days"
      isEmpty={rows.every((row) => row.count === 0)}
      emptyMessage="No open escalations."
    >
      <ChartContainer config={ESCALATION_CONFIG} className="aspect-auto h-72 w-full">
        <BarChart data={rows} margin={{ left: 0, right: 8 }}>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            interval={0}
            tick={{ fontSize: 11 }}
          />
          <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={28} />
          <ChartTooltip content={<ChartTooltipContent hideLabel />} />
          <Bar dataKey="count" fill="var(--color-count)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ChartContainer>
    </ChartCard>
  );
};

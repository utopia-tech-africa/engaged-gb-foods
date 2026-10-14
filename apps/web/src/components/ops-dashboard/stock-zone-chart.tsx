"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { ChartCard } from "@/components/ops-dashboard/chart-card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { OpsStockZoneDto, StockZone } from "@/lib/api/generated/model";
import { ZONE_LABELS } from "@/lib/stock/constants";

const STOCK_CONFIG = {
  baseQuantity: { label: "Base units", color: "var(--chart-1)" },
} satisfies ChartConfig;

type StockZoneChartProps = {
  data: OpsStockZoneDto[];
};

export const StockZoneChart = ({ data }: StockZoneChartProps) => {
  const rows = data.map((row) => ({
    ...row,
    label: ZONE_LABELS[row.zone as StockZone] ?? row.zone,
  }));
  const hasStock = rows.some((row) => row.lots > 0);

  return (
    <ChartCard
      title="Stock by zone"
      description="Base-unit quantity recorded on this day's visits"
      isEmpty={!hasStock}
      emptyMessage="No stock lots recorded for this day."
    >
      <ChartContainer config={STOCK_CONFIG} className="aspect-auto h-72 w-full">
        <BarChart data={rows} layout="vertical" margin={{ left: 0, right: 16 }}>
          <CartesianGrid horizontal={false} />
          <YAxis
            dataKey="label"
            type="category"
            tickLine={false}
            axisLine={false}
            width={130}
            tick={{ fontSize: 11 }}
          />
          <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} />
          <ChartTooltip content={<ChartTooltipContent hideLabel />} />
          <Bar dataKey="baseQuantity" fill="var(--color-baseQuantity)" radius={4} />
        </BarChart>
      </ChartContainer>
    </ChartCard>
  );
};

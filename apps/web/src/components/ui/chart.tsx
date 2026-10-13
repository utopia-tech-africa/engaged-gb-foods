"use client";

import { cn } from "cn";
import * as React from "react";
import * as RechartsPrimitive from "recharts";

export type ChartConfig = Record<
  string,
  {
    label?: React.ReactNode;
    color?: string;
  }
>;

type ChartContextValue = {
  config: ChartConfig;
};

const ChartContext = React.createContext<ChartContextValue | null>(null);

const useChart = (): ChartContextValue => {
  const context = React.useContext(ChartContext);
  if (!context) {
    throw new Error("useChart must be used within a <ChartContainer />");
  }
  return context;
};

type ChartContainerProps = React.ComponentProps<"div"> & {
  config: ChartConfig;
  children: React.ComponentProps<typeof RechartsPrimitive.ResponsiveContainer>["children"];
};

/**
 * Wraps a recharts chart, exposes `--color-<key>` CSS variables from `config`
 * and applies the shared GBfoods chart styling.
 */
function ChartContainer({ id, className, children, config, style, ...props }: ChartContainerProps) {
  const uniqueId = React.useId();
  const chartId = `chart-${id ?? uniqueId.replace(/:/g, "")}`;

  const colorVariables = Object.fromEntries(
    Object.entries(config)
      .filter(([, item]) => item.color)
      .map(([key, item]) => [`--color-${key}`, item.color]),
  ) as React.CSSProperties;

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-slot="chart"
        data-chart={chartId}
        style={{ ...colorVariables, ...style }}
        className={cn(
          "flex aspect-video justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-hidden [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-reference-line_[stroke='#ccc']]:stroke-border [&_.recharts-sector]:outline-hidden [&_.recharts-sector[stroke='#fff']]:stroke-transparent [&_.recharts-surface]:outline-hidden",
          className,
        )}
        {...props}
      >
        <RechartsPrimitive.ResponsiveContainer>{children}</RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  );
}

const ChartTooltip = RechartsPrimitive.Tooltip;

type TooltipPayloadItem = {
  name?: string | number;
  dataKey?: string | number;
  value?: string | number | readonly (string | number)[];
  color?: string;
  payload?: Record<string, unknown>;
};

type ChartTooltipContentProps = {
  active?: boolean;
  payload?: readonly TooltipPayloadItem[];
  label?: React.ReactNode;
  className?: string;
  hideLabel?: boolean;
  /** Payload key (or `name`) used to look up the entry in the chart config. */
  nameKey?: string;
  labelFormatter?: (label: React.ReactNode) => React.ReactNode;
};

function ChartTooltipContent({
  active,
  payload,
  label,
  className,
  hideLabel = false,
  nameKey,
  labelFormatter,
}: ChartTooltipContentProps) {
  const { config } = useChart();

  if (!active || !payload?.length) {
    return null;
  }

  const resolveKey = (item: TooltipPayloadItem): string => {
    const fromPayload = nameKey ? item.payload?.[nameKey] : undefined;
    return String(fromPayload ?? item.name ?? item.dataKey ?? "value");
  };

  const heading = (() => {
    if (hideLabel) {
      return null;
    }
    const first = payload[0];
    const configLabel = first && !label ? config[resolveKey(first)]?.label : null;
    const raw = label ?? configLabel;
    if (!raw) {
      return null;
    }
    return labelFormatter ? labelFormatter(raw) : raw;
  })();

  return (
    <div
      className={cn(
        "grid min-w-32 items-start gap-1.5 rounded-lg border border-border bg-popover px-2.5 py-1.5 text-xs text-popover-foreground shadow-xl",
        className,
      )}
    >
      {heading ? <div className="font-medium">{heading}</div> : null}
      <div className="grid gap-1.5">
        {payload.map((item) => {
          const key = resolveKey(item);
          const itemConfig = config[key];
          const indicatorColor =
            item.color ?? (item.payload?.fill as string | undefined) ?? itemConfig?.color;
          return (
            <div key={`${key}-${String(item.dataKey)}`} className="flex items-center gap-2">
              <span
                className="size-2.5 shrink-0 rounded-[2px]"
                style={{ backgroundColor: indicatorColor }}
              />
              <span className="flex-1 text-muted-foreground">{itemConfig?.label ?? key}</span>
              {item.value !== undefined ? (
                <span className="font-mono font-medium text-foreground tabular-nums">
                  {typeof item.value === "number"
                    ? item.value.toLocaleString()
                    : String(item.value)}
                </span>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const ChartLegend = RechartsPrimitive.Legend;

type LegendPayloadItem = {
  value?: string | number;
  dataKey?: string | number;
  color?: string;
  payload?: Record<string, unknown>;
};

type ChartLegendContentProps = {
  payload?: readonly LegendPayloadItem[];
  className?: string;
  nameKey?: string;
};

function ChartLegendContent({ payload, className, nameKey }: ChartLegendContentProps) {
  const { config } = useChart();

  if (!payload?.length) {
    return null;
  }

  return (
    <div className={cn("flex flex-wrap items-center justify-center gap-4 pt-3", className)}>
      {payload.map((item) => {
        const fromPayload = nameKey ? item.payload?.[nameKey] : undefined;
        const key = String(fromPayload ?? item.dataKey ?? item.value ?? "value");
        const itemConfig = config[key];
        return (
          <div key={key} className="flex items-center gap-1.5 text-muted-foreground">
            <span
              className="size-2 shrink-0 rounded-[2px]"
              style={{ backgroundColor: item.color }}
            />
            {itemConfig?.label ?? key}
          </div>
        );
      })}
    </div>
  );
}

export {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  useChart,
};

"use client";

import { type FormEvent, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { type DailyReturn, submitDailyReturn, updateDailyReturn } from "@/lib/daily-return/api";
import type { Region } from "@/lib/network/api";

type DailyReturnFormProps = {
  accessToken: string;
  regions: Region[];
  regionId: string;
  onRegionChange: (regionId: string) => void;
  date: string;
  /** The return already filed for this region and date, if any. */
  existing: DailyReturn | null;
  onSaved: () => Promise<void>;
};

const toCount = (value: string): number | undefined => {
  const trimmed = value.trim();
  return trimmed === "" ? undefined : Number(trimmed);
};

const countText = (value: number | undefined): string => (value === undefined ? "" : String(value));

const CountField = ({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) => (
  <div className="space-y-2">
    <Label htmlFor={id}>{label}</Label>
    <Input
      id={id}
      type="number"
      min={0}
      inputMode="numeric"
      placeholder="Auto from visits"
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  </div>
);

/** Remount with a new `key` whenever the region, date, or existing return changes. */
export const DailyReturnForm = ({
  accessToken,
  regions,
  regionId,
  onRegionChange,
  date,
  existing,
  onSaved,
}: DailyReturnFormProps) => {
  const [planned, setPlanned] = useState(countText(existing?.depotsPlanned));
  const [completed, setCompleted] = useState(countText(existing?.depotsCompleted));
  const [exception, setException] = useState(countText(existing?.depotsException));
  const [coverage, setCoverage] = useState(existing?.coverageSummary ?? "");
  const [stockStatus, setStockStatus] = useState(existing?.stockStatusSummary ?? "");
  const [variances, setVariances] = useState(existing?.variancesSummary ?? "");
  const [incidents, setIncidents] = useState(existing?.incidentsSummary ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const regionItems = regions.map((region) => ({ value: region.id, label: region.name }));

  const onSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (!regionId) {
      toast.error("Select a region");
      return;
    }
    if (!date) {
      toast.error("Pick a date");
      return;
    }

    const body = {
      coverageSummary: coverage,
      stockStatusSummary: stockStatus,
      variancesSummary: variances.trim(),
      incidentsSummary: incidents.trim(),
      depotsPlanned: toCount(planned),
      depotsCompleted: toCount(completed),
      depotsException: toCount(exception),
    };

    setIsSubmitting(true);
    try {
      if (existing) {
        await updateDailyReturn(accessToken, existing.id, body);
        toast.success("Daily return updated");
      } else {
        await submitDailyReturn(accessToken, { regionId, date, ...body });
        toast.success("Daily return submitted");
      }
      await onSaved();
    } catch (submitError) {
      toast.error(submitError instanceof Error ? submitError.message : "Unable to save return");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display text-lg">
          {existing ? "Update daily return" : "Submit daily return"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={(event) => void onSubmit(event)} className="space-y-5">
          <div className="max-w-md space-y-2">
            <Label>Region</Label>
            <Select
              items={regionItems}
              value={regionId}
              onValueChange={(value) => value && onRegionChange(value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select region" />
              </SelectTrigger>
              <SelectContent>
                {regionItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <CountField
              id="daily-planned"
              label="Depots planned"
              value={planned}
              onChange={setPlanned}
            />
            <CountField
              id="daily-completed"
              label="Depots completed"
              value={completed}
              onChange={setCompleted}
            />
            <CountField
              id="daily-exception"
              label="Depots with exceptions"
              value={exception}
              onChange={setException}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="daily-coverage">Coverage</Label>
              <Textarea
                id="daily-coverage"
                required
                value={coverage}
                onChange={(event) => setCoverage(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="daily-stock">Stock status</Label>
              <Textarea
                id="daily-stock"
                required
                value={stockStatus}
                onChange={(event) => setStockStatus(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="daily-variances">Variances</Label>
              <Textarea
                id="daily-variances"
                value={variances}
                onChange={(event) => setVariances(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="daily-incidents">Incidents</Label>
              <Textarea
                id="daily-incidents"
                value={incidents}
                onChange={(event) => setIncidents(event.target.value)}
              />
            </div>
          </div>

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving…" : existing ? "Update return" : "Submit return"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

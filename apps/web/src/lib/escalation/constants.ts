import type { EscalationStatus, EscalationTrigger } from "@/lib/api/generated/model";

export const TRIGGER_LABELS: Record<EscalationTrigger, string> = {
  quality_or_safety: "Quality or safety",
  count_mismatch: "Count mismatch",
  access_or_crew: "Access or crew",
  excess_volume_or_delay: "Excess volume or delay",
};

export const STATUS_LABELS: Record<EscalationStatus, string> = {
  open: "Open",
  in_progress: "In progress",
  resolved: "Resolved",
};

export const TRIGGERS = Object.keys(TRIGGER_LABELS) as EscalationTrigger[];
export const STATUSES = Object.keys(STATUS_LABELS) as EscalationStatus[];

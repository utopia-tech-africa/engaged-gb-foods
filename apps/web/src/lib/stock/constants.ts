import type { StockEvidenceCategory, StockZone } from "@/lib/api/generated/model";

export const ZONE_LABELS: Record<StockZone, string> = {
  unexamined: "Unexamined",
  conforming_pending_release: "Conforming · pending release",
  recoverable_pending_approval: "Recoverable · pending approval",
  held_or_rejected: "Held or rejected",
  released_remaining_on_site: "Released · remaining on site",
};

export const zonesRequiringDefectEvidence: StockZone[] = [
  "held_or_rejected",
  "recoverable_pending_approval",
];

export const requiredEvidenceForZone = (zone: StockZone): StockEvidenceCategory[] => {
  if (zonesRequiringDefectEvidence.includes(zone)) {
    return ["pack", "batch", "defect"];
  }
  return [];
};

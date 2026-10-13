import type { ClientReviewStatus } from "@/lib/api/generated/model";

export const REVIEW_STATUS_LABELS: Record<ClientReviewStatus, string> = {
  pending: "Pending review",
  hold: "Quality hold",
  reviewed: "Reviewed",
};

export const formatSyncTime = (value: string | null | undefined): string => {
  if (!value) {
    return "Never";
  }
  return new Date(value).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

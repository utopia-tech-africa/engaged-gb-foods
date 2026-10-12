const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api/v1";

export type ClientReviewStatus = "pending" | "hold" | "reviewed";

export type ClientOverviewDepot = {
  depotId: string;
  code: string;
  name: string;
  regionName: string;
  visitStatus: string | null;
  coverage: number;
  reviewStatus: ClientReviewStatus;
  lastSyncedAt: string | null;
  openHolds: number;
};

export type ClientOverview = {
  date: string;
  lastSyncAt: string | null;
  depotsComplete: number;
  depotsTotal: number;
  recordsToReview: number;
  qualityHolds: number;
  depotsWithSyncDelay: number;
  depots: ClientOverviewDepot[];
};

export type ClientDepotPack = {
  date: string;
  depot: {
    id: string;
    code: string;
    name: string;
    regionName: string;
  };
  visits: Array<{
    id: string;
    code: string;
    status: string;
    lastSyncedAt: string | null;
  }>;
  reconciliations: unknown[];
  lots: unknown[];
  holds: Array<{
    id: string;
    visitCode: string;
    skuName: string;
    batchCode: string;
    baseQuantity: number;
    custodian: string | null;
    pendingDisposition: boolean;
  }>;
};

const requestJson = async <T>(
  accessToken: string,
  path: string,
  init: RequestInit = {},
): Promise<T> => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(init.body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed with ${response.status}`);
  }

  return (await response.json()) as T;
};

const buildQuery = (params: Record<string, string | undefined>): string => {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) {
      search.set(key, value);
    }
  }
  const query = search.toString();
  return query ? `?${query}` : "";
};

export const fetchClientOverview = async (
  accessToken: string,
  filters: {
    date?: string;
    regionId?: string;
    depotId?: string;
    reviewStatus?: ClientReviewStatus;
  },
): Promise<ClientOverview> => {
  const query = buildQuery({
    date: filters.date,
    regionId: filters.regionId,
    depotId: filters.depotId,
    reviewStatus: filters.reviewStatus,
  });
  return requestJson(accessToken, `/client/overview${query}`);
};

export const fetchClientDepotPack = async (
  accessToken: string,
  depotId: string,
  date?: string,
): Promise<ClientDepotPack> => {
  const query = buildQuery({ date });
  return requestJson(accessToken, `/client/depots/${encodeURIComponent(depotId)}/pack${query}`);
};

export const downloadClientCsv = async (
  accessToken: string,
  kind: "reconciliation" | "holds",
  filters: { date?: string; regionId?: string },
): Promise<void> => {
  const query = buildQuery({ date: filters.date, regionId: filters.regionId });
  const path =
    kind === "reconciliation"
      ? `/client/export/reconciliation.csv${query}`
      : `/client/export/holds.csv${query}`;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Export failed with ${response.status}`);
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = kind === "reconciliation" ? "reconciliation.csv" : "holds.csv";
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
};

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

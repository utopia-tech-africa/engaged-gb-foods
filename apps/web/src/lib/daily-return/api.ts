import { requestJson } from "@/lib/network/api";

export type DailyReturn = {
  id: string;
  regionId: string;
  date: string;
  submittedAt: string;
  submittedByUserId: string;
  coverageSummary: string;
  stockStatusSummary: string;
  variancesSummary: string | null;
  incidentsSummary: string | null;
  depotsPlanned: number;
  depotsCompleted: number;
  depotsException: number;
  createdAt: string;
  updatedAt: string;
  region: { id: string; code: string; name: string };
  submittedBy: { id: string; fullName: string; role: string };
};

export type DailyReturnTotals = {
  depotsPlanned: number;
  depotsCompleted: number;
  depotsException: number;
};

export type NationalSummaryRow = {
  region: { id: string; code: string; name: string };
  submitted: boolean;
  return: DailyReturn | null;
};

export type NationalSummary = {
  date: string;
  regionsSubmitted: number;
  regionsTotal: number;
  totals: DailyReturnTotals;
  returns: NationalSummaryRow[];
};

export type SubmitDailyReturnInput = {
  regionId: string;
  date: string;
  coverageSummary: string;
  stockStatusSummary: string;
  variancesSummary?: string;
  incidentsSummary?: string;
  depotsPlanned?: number;
  depotsCompleted?: number;
  depotsException?: number;
};

export type UpdateDailyReturnInput = Partial<Omit<SubmitDailyReturnInput, "regionId" | "date">>;

export const fetchDailyReturns = (
  accessToken: string,
  filters?: { regionId?: string; date?: string },
): Promise<DailyReturn[]> => {
  const params = new URLSearchParams();
  if (filters?.regionId) {
    params.set("regionId", filters.regionId);
  }
  if (filters?.date) {
    params.set("date", filters.date);
  }
  const query = params.toString();
  return requestJson(accessToken, `/daily-returns${query ? `?${query}` : ""}`);
};

export const fetchNationalSummary = (accessToken: string, date: string): Promise<NationalSummary> =>
  requestJson(accessToken, `/daily-returns/national/summary?date=${encodeURIComponent(date)}`);

/** Creates the return, or updates it when one already exists for the region and date. */
export const submitDailyReturn = (
  accessToken: string,
  body: SubmitDailyReturnInput,
): Promise<DailyReturn> => requestJson(accessToken, "/daily-returns", { method: "POST", body });

export const updateDailyReturn = (
  accessToken: string,
  id: string,
  body: UpdateDailyReturnInput,
): Promise<DailyReturn> =>
  requestJson(accessToken, `/daily-returns/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body,
  });

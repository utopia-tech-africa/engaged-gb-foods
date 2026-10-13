import { type DepotReadiness, requestJson } from "@/lib/network/api";

export type RecceDecision = "ready" | "hold";

export type RecceChecklist = {
  access: boolean;
  stockEstimate: boolean;
  stockEstimateNote?: string;
  workspace: boolean;
  power: boolean;
  signal: boolean;
  holdingZones: boolean;
};

export type RecceGap = {
  id: string;
  recceId: string;
  description: string;
  ownerName: string;
  dueAt: string | null;
  isCritical: boolean;
  createdAt: string;
};

export type RecceEvidence = {
  id: string;
  recceId: string;
  objectKey: string;
  capturedAt: string;
  createdAt: string;
};

export type Recce = {
  id: string;
  depotId: string;
  checklist: RecceChecklist;
  decision: RecceDecision;
  notes: string | null;
  authorUserId: string;
  createdAt: string;
  updatedAt: string;
  depot: { id: string; code: string; name: string; readiness: DepotReadiness };
  author: { id: string; fullName: string; role: string };
  gaps: RecceGap[];
  evidence: RecceEvidence[];
};

export type RecceGapInput = {
  description: string;
  ownerName: string;
  dueAt?: string;
  isCritical: boolean;
};

export type CreateRecceInput = {
  depotId: string;
  checklist: RecceChecklist;
  decision: RecceDecision;
  notes?: string;
  gaps?: RecceGapInput[];
  evidenceKeys?: string[];
};

export type UpdateRecceInput = Partial<Omit<CreateRecceInput, "depotId">>;

export const fetchRecces = (
  accessToken: string,
  filters?: { depotId?: string; decision?: RecceDecision },
): Promise<Recce[]> => {
  const params = new URLSearchParams();
  if (filters?.depotId) {
    params.set("depotId", filters.depotId);
  }
  if (filters?.decision) {
    params.set("decision", filters.decision);
  }
  const query = params.toString();
  return requestJson(accessToken, `/recces${query ? `?${query}` : ""}`);
};

export const fetchRecce = (accessToken: string, id: string): Promise<Recce> =>
  requestJson(accessToken, `/recces/${encodeURIComponent(id)}`);

export const createRecce = (accessToken: string, body: CreateRecceInput): Promise<Recce> =>
  requestJson(accessToken, "/recces", { method: "POST", body });

export const updateRecce = (
  accessToken: string,
  id: string,
  body: UpdateRecceInput,
): Promise<Recce> =>
  requestJson(accessToken, `/recces/${encodeURIComponent(id)}`, { method: "PATCH", body });

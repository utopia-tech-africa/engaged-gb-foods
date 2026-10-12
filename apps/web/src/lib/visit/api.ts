const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api/v1";

export type SignatureRole = "qc" | "cluster_supervisor" | "depot_representative";

export type DispositionDecision = "release" | "hold" | "reject" | "approve_repack";

export type VisitSummary = {
  id: string;
  code: string;
  date: string;
  status: string;
  reconciledAt: string | null;
  depot: { id: string; code: string; name: string };
  qcUser: { id: string; fullName: string; staffId: string | null };
  signatures?: VisitSignature[];
};

export type VisitSignature = {
  id: string;
  visitId: string;
  role: SignatureRole;
  signerName: string;
  imageObjectKey: string | null;
  signedAt: string;
  signedByUserId: string | null;
};

export type ReconciliationLine = {
  skuId: string;
  batchCode: string;
  skuName: string;
  opening: number;
  inward: number;
  outward: number;
  closingByZone: Record<string, number>;
  closingTotal: number;
  variance: number;
  lotIds: string[];
};

export type ReconciliationSnapshot = {
  visit: VisitSummary;
  lines: ReconciliationLine[];
  heldLotsWithoutCustodian: {
    id: string;
    skuId: string;
    batchCode: string;
    skuName: string;
    baseQuantity: number;
  }[];
  signatures: VisitSignature[];
  missingSignatures: SignatureRole[];
  canClose: boolean;
};

type JsonRequestInit = Omit<RequestInit, "body"> & { body?: unknown };

const requestJson = async <T>(
  accessToken: string,
  path: string,
  init: JsonRequestInit = {},
): Promise<T> => {
  const headers: HeadersInit = {
    Authorization: `Bearer ${accessToken}`,
    ...(init.body !== undefined ? { "Content-Type": "application/json" } : {}),
    ...init.headers,
  };

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
    body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
  });

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const payload = (await response.json()) as { message?: string | string[] };
      if (typeof payload.message === "string") {
        message = payload.message;
      } else if (Array.isArray(payload.message)) {
        message = payload.message.join(", ");
      }
    } catch {
      // Keep default message.
    }
    throw new Error(message);
  }

  return (await response.json()) as T;
};

export const fetchVisits = (
  accessToken: string,
  params: { depotId?: string; date?: string; status?: string },
): Promise<VisitSummary[]> => {
  const search = new URLSearchParams();
  if (params.depotId) {
    search.set("depotId", params.depotId);
  }
  if (params.date) {
    search.set("date", params.date);
  }
  if (params.status) {
    search.set("status", params.status);
  }
  const query = search.toString();
  return requestJson(accessToken, `/visits${query ? `?${query}` : ""}`);
};

export const fetchVisitReconciliation = (
  accessToken: string,
  visitId: string,
): Promise<ReconciliationSnapshot> =>
  requestJson(accessToken, `/visits/${encodeURIComponent(visitId)}/reconciliation`);

export const postVisitSignature = (
  accessToken: string,
  visitId: string,
  body: { role: SignatureRole; signerName: string; imageObjectKey?: string },
): Promise<VisitSignature> =>
  requestJson(accessToken, `/visits/${encodeURIComponent(visitId)}/signatures`, {
    method: "POST",
    body,
  });

export const postVisitClose = (
  accessToken: string,
  visitId: string,
  body?: {
    openActions?: {
      description: string;
      ownerName: string;
      dueAt?: string;
      acceptedByGBfoods?: boolean;
    }[];
  },
): Promise<VisitSummary> =>
  requestJson(accessToken, `/visits/${encodeURIComponent(visitId)}/close`, {
    method: "POST",
    body: body ?? {},
  });

export const patchStockLotCustodian = (
  accessToken: string,
  lotId: string,
  custodian: string,
): Promise<unknown> =>
  requestJson(accessToken, `/stock-lots/${encodeURIComponent(lotId)}/custodian`, {
    method: "PATCH",
    body: { custodian },
  });

export const postStockLotDisposition = (
  accessToken: string,
  lotId: string,
  body: { decision: DispositionDecision; reason: string },
): Promise<unknown> =>
  requestJson(accessToken, `/stock-lots/${encodeURIComponent(lotId)}/disposition`, {
    method: "POST",
    body,
  });

export const uploadSignatureImage = async (accessToken: string, file: File): Promise<string> => {
  const form = new FormData();
  form.append("file", file);

  const response = await fetch(`${API_BASE_URL}/uploads/local`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: form,
  });

  if (!response.ok) {
    throw new Error(`Signature upload failed (${response.status})`);
  }

  const payload = (await response.json()) as { objectKey: string };
  return payload.objectKey;
};

export const SIGNATURE_ROLE_LABELS: Record<SignatureRole, string> = {
  qc: "QC sign-off",
  cluster_supervisor: "Cluster supervisor",
  depot_representative: "Depot representative",
};

export const DISPOSITION_LABELS: Record<DispositionDecision, string> = {
  release: "Release",
  hold: "Hold",
  reject: "Reject",
  approve_repack: "Approve repack",
};

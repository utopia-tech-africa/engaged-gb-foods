const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api/v1";

export type StockZone =
  | "unexamined"
  | "conforming_pending_release"
  | "recoverable_pending_approval"
  | "held_or_rejected"
  | "released_remaining_on_site";

export type StockUnit = "cases" | "loose_packs";

export type StockEvidenceCategory = "pack" | "batch" | "defect" | "position";

export type Sku = {
  id: string;
  name: string;
  brand: string | null;
  packFactor: number;
  caseUnit: string;
  looseUnit: string;
  isActive: boolean;
};

export type StockEvidence = {
  id: string;
  category: StockEvidenceCategory;
  objectKey: string;
  capturedAt: string;
};

export type StockLot = {
  id: string;
  visitId: string;
  skuId: string;
  batchCode: string;
  expiryDate: string | null;
  zone: StockZone;
  quantity: number;
  unit: StockUnit;
  baseQuantity: number;
  notes: string | null;
  latitude: number | null;
  longitude: number | null;
  accuracyMeters: number | null;
  createdAt: string;
  sku: Sku;
  evidence: StockEvidence[];
  visit: {
    id: string;
    code: string;
    date: string;
    status: string;
    depot: { id: string; code: string; name: string };
  };
  createdBy: {
    id: string;
    fullName: string;
    staffId: string | null;
    role: string;
  };
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

export const fetchSkus = (accessToken: string): Promise<Sku[]> => requestJson(accessToken, "/skus");

export const fetchStockLots = (
  accessToken: string,
  params: { date?: string; depotId?: string; visitId?: string },
): Promise<StockLot[]> => {
  const search = new URLSearchParams();
  if (params.date) {
    search.set("date", params.date);
  }
  if (params.depotId) {
    search.set("depotId", params.depotId);
  }
  if (params.visitId) {
    search.set("visitId", params.visitId);
  }
  return requestJson(accessToken, `/stock-lots?${search.toString()}`);
};

export const postStockLot = (
  accessToken: string,
  body: {
    visitId?: string;
    depotId?: string;
    skuId: string;
    batchCode: string;
    expiryDate?: string;
    zone: StockZone;
    quantity: number;
    unit: StockUnit;
    notes?: string;
    latitude?: number;
    longitude?: number;
    accuracyMeters?: number;
    evidence: { category: StockEvidenceCategory; objectKey: string }[];
  },
): Promise<StockLot> => requestJson(accessToken, "/stock-lots", { method: "POST", body });

export const presignStockEvidence = (
  accessToken: string,
  body: { contentType: string; contentLength: number },
): Promise<{ uploadUrl: string; objectKey: string; method: "PUT" }> =>
  requestJson(accessToken, "/uploads/presign", {
    method: "POST",
    body: { ...body, purpose: "stock_evidence" },
  });

export const uploadStockEvidenceLocal = async (
  accessToken: string,
  file: File,
): Promise<{ objectKey: string }> => {
  const form = new FormData();
  form.append("file", file);

  const response = await fetch(`${API_BASE_URL}/uploads/local`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: form,
  });

  if (!response.ok) {
    throw new Error(`Local upload failed (${response.status})`);
  }

  return (await response.json()) as { objectKey: string };
};

export const uploadPhotoForStockEvidence = async (
  accessToken: string,
  file: File,
): Promise<string> => {
  try {
    const presigned = await presignStockEvidence(accessToken, {
      contentType: file.type,
      contentLength: file.size,
    });
    const putResponse = await fetch(presigned.uploadUrl, {
      method: presigned.method,
      headers: { "Content-Type": file.type },
      body: file,
    });
    if (!putResponse.ok) {
      throw new Error("R2 upload failed");
    }
    return presigned.objectKey;
  } catch {
    const local = await uploadStockEvidenceLocal(accessToken, file);
    return local.objectKey;
  }
};

export const fetchPhotoObjectUrl = async (
  accessToken: string,
  objectKey: string,
): Promise<string> => {
  const response = await fetch(
    `${API_BASE_URL}/uploads/content?objectKey=${encodeURIComponent(objectKey)}`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  if (!response.ok) {
    throw new Error(`Could not load photo (${response.status})`);
  }
  const blob = await response.blob();
  return URL.createObjectURL(blob);
};

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

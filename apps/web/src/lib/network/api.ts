const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api/v1";

export type Region = {
  id: string;
  code: string;
  name: string;
  slug: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Distributor = {
  id: string;
  regionId: string;
  clusterId: string | null;
  name: string;
  code: string;
  contactName: string | null;
  contactPhone: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type DepotReadiness = "unknown" | "ready" | "hold";

export type Depot = {
  id: string;
  distributorId: string;
  code: string;
  name: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  contactName: string | null;
  contactPhone: string | null;
  openingHours: string | null;
  readiness: DepotReadiness;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
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

export const fetchRegions = (accessToken: string): Promise<Region[]> =>
  requestJson(accessToken, "/regions");

export const fetchDistributors = (
  accessToken: string,
  regionId?: string,
): Promise<Distributor[]> => {
  const query = regionId ? `?regionId=${encodeURIComponent(regionId)}` : "";
  return requestJson(accessToken, `/distributors${query}`);
};

export const createDistributor = (
  accessToken: string,
  body: {
    name: string;
    code: string;
    regionId: string;
    contactName?: string;
    contactPhone?: string;
  },
): Promise<Distributor> => requestJson(accessToken, "/distributors", { method: "POST", body });

export const fetchDepots = (
  accessToken: string,
  filters?: { distributorId?: string; regionId?: string },
): Promise<Depot[]> => {
  const params = new URLSearchParams();
  if (filters?.distributorId) {
    params.set("distributorId", filters.distributorId);
  }
  if (filters?.regionId) {
    params.set("regionId", filters.regionId);
  }
  const query = params.toString();
  return requestJson(accessToken, `/depots${query ? `?${query}` : ""}`);
};

export const createDepot = (
  accessToken: string,
  body: {
    distributorId: string;
    code: string;
    name: string;
    address: string;
    latitude?: number;
    longitude?: number;
    contactName?: string;
    contactPhone?: string;
  },
): Promise<Depot> => requestJson(accessToken, "/depots", { method: "POST", body });

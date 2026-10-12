const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api/v1";

export type CustomFetchConfig = {
  url: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  params?: Record<string, unknown>;
  data?: unknown;
  headers?: HeadersInit;
  signal?: AbortSignal;
};

export const customFetch = async <T>({
  url,
  method,
  params,
  data,
  headers,
  signal,
}: CustomFetchConfig): Promise<T> => {
  const query = params
    ? `?${new URLSearchParams(
        Object.entries(params)
          .filter(([, value]) => value !== undefined && value !== null)
          .map(([key, value]) => [key, String(value)]),
      ).toString()}`
    : "";

  const response = await fetch(`${API_BASE_URL}${url}${query}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: data === undefined ? undefined : JSON.stringify(data),
    signal,
    credentials: "include",
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed with ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
};

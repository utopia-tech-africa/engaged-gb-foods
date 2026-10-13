import { readAuthSession } from "@/lib/auth/storage";

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api/v1";

export type CustomFetchConfig = {
  url: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  params?: Record<string, unknown>;
  data?: unknown;
  headers?: Record<string, string>;
  signal?: AbortSignal;
};

/** Error thrown for non-2xx API responses. `message` is the Nest error message. */
export class ApiError<TBody = unknown> extends Error {
  readonly status: number;
  readonly body: TBody | undefined;

  constructor(message: string, status: number, body?: TBody) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

/** Orval picks this up so generated hooks expose `ApiError` as the query/mutation error type. */
export type ErrorType<TBody> = ApiError<TBody>;

const buildQueryString = (params: Record<string, unknown> | undefined): string => {
  if (!params) {
    return "";
  }
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) {
      continue;
    }
    search.append(key, String(value));
  }
  const query = search.toString();
  return query ? `?${query}` : "";
};

type NestErrorPayload = { message?: string | string[] };

const messageFromPayload = (payload: unknown, fallback: string): string => {
  if (typeof payload !== "object" || payload === null) {
    return fallback;
  }
  const { message } = payload as NestErrorPayload;
  if (typeof message === "string" && message.length > 0) {
    return message;
  }
  if (Array.isArray(message) && message.length > 0) {
    return message.join(", ");
  }
  return fallback;
};

const readErrorPayload = async (response: Response): Promise<unknown> => {
  try {
    return await response.json();
  } catch {
    return undefined;
  }
};

const isJsonResponse = (response: Response): boolean =>
  (response.headers.get("content-type") ?? "").includes("application/json");

const buildRequestBody = (
  data: unknown,
  headers: Headers,
): { body: BodyInit | undefined; headers: Headers } => {
  if (data === undefined || data === null) {
    headers.delete("Content-Type");
    return { body: undefined, headers };
  }
  if (data instanceof FormData) {
    // The browser must set the multipart boundary itself.
    headers.delete("Content-Type");
    return { body: data, headers };
  }
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  return { body: JSON.stringify(data), headers };
};

/**
 * Orval mutator. Attaches the stored bearer token when a session exists, so public
 * auth endpoints work without one. Returns parsed JSON, text for non-JSON bodies,
 * or `undefined` for 204 responses.
 */
export const customFetch = async <TResponse>({
  url,
  method,
  params,
  data,
  headers: extraHeaders,
  signal,
}: CustomFetchConfig): Promise<TResponse> => {
  const baseHeaders = new Headers(extraHeaders);
  const accessToken = readAuthSession()?.accessToken;
  if (accessToken && !baseHeaders.has("Authorization")) {
    baseHeaders.set("Authorization", `Bearer ${accessToken}`);
  }

  const { body, headers } =
    method === "GET"
      ? { body: undefined, headers: baseHeaders }
      : buildRequestBody(data, baseHeaders);
  if (body === undefined) {
    headers.delete("Content-Type");
  }

  const response = await fetch(`${API_BASE_URL}${url}${buildQueryString(params)}`, {
    method,
    headers,
    body,
    signal,
  });

  if (!response.ok) {
    const payload = await readErrorPayload(response);
    throw new ApiError(
      messageFromPayload(payload, `Request failed (${response.status})`),
      response.status,
      payload,
    );
  }

  if (response.status === 204) {
    return undefined as TResponse;
  }

  if (isJsonResponse(response)) {
    return (await response.json()) as TResponse;
  }

  return (await response.text()) as TResponse;
};

import type { AuthTokenResponse, AuthUser } from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api/v1";

const postJson = async <T>(path: string, body: unknown): Promise<T> => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
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

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
};

export const signInField = (staffId: string, pin: string): Promise<AuthTokenResponse> =>
  postJson<AuthTokenResponse>("/auth/field/sign-in", { staffId, pin });

export const signInOps = (email: string, password: string): Promise<AuthTokenResponse> =>
  postJson<AuthTokenResponse>("/auth/ops/sign-in", { email, password });

export const refreshSession = (refreshToken: string): Promise<AuthTokenResponse> =>
  postJson<AuthTokenResponse>("/auth/refresh", { refreshToken });

export const signOut = (refreshToken: string): Promise<void> =>
  postJson<void>("/auth/sign-out", { refreshToken });

export const fetchMe = async (accessToken: string): Promise<AuthUser> => {
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    throw new Error("Unable to load current user");
  }
  return (await response.json()) as AuthUser;
};

import type { AuthSession } from "./types";

const STORAGE_KEY = "gbfoods.auth.session";

export const readAuthSession = (): AuthSession | null => {
  if (typeof window === "undefined") {
    return null;
  }
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as AuthSession;
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return null;
  }
};

export const writeAuthSession = (session: AuthSession): void => {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
};

export const clearAuthSession = (): void => {
  window.localStorage.removeItem(STORAGE_KEY);
};

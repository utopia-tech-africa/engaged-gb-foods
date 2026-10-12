"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import * as authApi from "@/lib/auth/api";
import { clearAuthSession, readAuthSession, writeAuthSession } from "@/lib/auth/storage";
import type { AuthSession, AuthUser } from "@/lib/auth/types";

type AuthContextValue = {
  user: AuthUser | null;
  accessToken: string | null;
  isLoading: boolean;
  signInField: (staffId: string, pin: string) => Promise<AuthUser>;
  signInOps: (email: string, password: string) => Promise<AuthUser>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const toSession = (payload: {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}): AuthSession => ({
  user: payload.user,
  accessToken: payload.accessToken,
  refreshToken: payload.refreshToken,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const existing = readAuthSession();
    if (!existing) {
      setIsLoading(false);
      return;
    }

    void (async () => {
      try {
        const user = await authApi.fetchMe(existing.accessToken);
        const next = { ...existing, user };
        writeAuthSession(next);
        setSession(next);
      } catch {
        try {
          const refreshed = await authApi.refreshSession(existing.refreshToken);
          const next = toSession(refreshed);
          writeAuthSession(next);
          setSession(next);
        } catch {
          clearAuthSession();
          setSession(null);
        }
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const signInField = useCallback(async (staffId: string, pin: string) => {
    const payload = await authApi.signInField(staffId, pin);
    const next = toSession(payload);
    writeAuthSession(next);
    setSession(next);
    return next.user;
  }, []);

  const signInOps = useCallback(async (email: string, password: string) => {
    const payload = await authApi.signInOps(email, password);
    const next = toSession(payload);
    writeAuthSession(next);
    setSession(next);
    return next.user;
  }, []);

  const signOut = useCallback(async () => {
    const current = readAuthSession();
    if (current?.refreshToken) {
      try {
        await authApi.signOut(current.refreshToken);
      } catch {
        // Local sign-out still clears the session.
      }
    }
    clearAuthSession();
    setSession(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      accessToken: session?.accessToken ?? null,
      isLoading,
      signInField,
      signInOps,
      signOut,
    }),
    [session, isLoading, signInField, signInOps, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

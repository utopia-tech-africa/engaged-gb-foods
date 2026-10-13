"use client";

import { useQueryClient } from "@tanstack/react-query";
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
import type { AuthSession, AuthTokenResponse, AuthUser } from "@/lib/auth/types";

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
  const queryClient = useQueryClient();
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
        const user = await authApi.fetchMe();
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
          queryClient.clear();
          setSession(null);
        }
      } finally {
        setIsLoading(false);
      }
    })();
  }, [queryClient]);

  const startSession = useCallback(
    (payload: AuthTokenResponse): AuthUser => {
      const next = toSession(payload);
      // Drop cached data from any previous user before the new token is used.
      queryClient.clear();
      writeAuthSession(next);
      setSession(next);
      return next.user;
    },
    [queryClient],
  );

  const signInField = useCallback(
    async (staffId: string, pin: string) => startSession(await authApi.signInField(staffId, pin)),
    [startSession],
  );

  const signInOps = useCallback(
    async (email: string, password: string) =>
      startSession(await authApi.signInOps(email, password)),
    [startSession],
  );

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
    queryClient.clear();
    setSession(null);
  }, [queryClient]);

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

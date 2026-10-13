import {
  getAuthMe,
  postAuthFieldSignIn,
  postAuthOpsSignIn,
  postAuthRefresh,
  postAuthSignOut,
} from "@/lib/api/generated/auth/auth";

import type { AuthTokenResponse, AuthUser } from "./types";

/**
 * Thin wrappers over the generated Orval auth functions. AuthProvider calls these
 * imperatively (outside React Query) because it owns the session in localStorage.
 * `customFetch` attaches the stored bearer token when one exists.
 */

export const signInField = (staffId: string, pin: string): Promise<AuthTokenResponse> =>
  postAuthFieldSignIn({ staffId, pin });

export const signInOps = (email: string, password: string): Promise<AuthTokenResponse> =>
  postAuthOpsSignIn({ email, password });

export const refreshSession = (refreshToken: string): Promise<AuthTokenResponse> =>
  postAuthRefresh({ refreshToken });

export const signOut = async (refreshToken: string): Promise<void> => {
  await postAuthSignOut({ refreshToken });
};

export const fetchMe = (): Promise<AuthUser> => getAuthMe();

import { ApiError } from "@/lib/api/custom-fetch";

/**
 * True when a request never reached the server (fetch rejects with a TypeError offline or on a
 * dropped connection). These submissions are safe to queue and retry.
 */
export const isNetworkError = (error: unknown): boolean => error instanceof TypeError;

/** True for 4xx responses that will never succeed on retry (other than auth/rate-limit/timeout). */
export const isPermanentClientError = (error: unknown): error is ApiError =>
  error instanceof ApiError &&
  error.status >= 400 &&
  error.status < 500 &&
  error.status !== 401 &&
  error.status !== 408 &&
  error.status !== 429;

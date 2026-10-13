import type { UserRole } from "@/lib/auth/types";
import { requestJson } from "@/lib/network/api";

export type AssessmentResult = "pass" | "fail" | "pending";

/** Field roles that appear on the assessment roster. */
export const ASSESSABLE_ROLES: UserRole[] = ["qc", "handler", "cluster_supervisor"];

export type Assessment = {
  id: string;
  userId: string;
  safetyPass: boolean;
  qualityPass: boolean;
  recordsPass: boolean;
  result: AssessmentResult;
  dispatchable: boolean;
  notes: string | null;
  assessedByUserId: string;
  assessedAt: string;
  createdAt: string;
  updatedAt: string;
  user: { id: string; fullName: string; staffId: string | null; role: UserRole };
  assessedBy: { id: string; fullName: string; role: UserRole };
};

export type CreateAssessmentInput = {
  userId: string;
  safetyPass: boolean;
  qualityPass: boolean;
  recordsPass: boolean;
  notes?: string;
};

export const fetchAssessments = (
  accessToken: string,
  filters?: { userId?: string; result?: AssessmentResult; history?: boolean },
): Promise<Assessment[]> => {
  const params = new URLSearchParams();
  if (filters?.userId) {
    params.set("userId", filters.userId);
  }
  if (filters?.result) {
    params.set("result", filters.result);
  }
  if (filters?.history) {
    params.set("history", "true");
  }
  const query = params.toString();
  return requestJson(accessToken, `/assessments${query ? `?${query}` : ""}`);
};

export const fetchAssessment = (accessToken: string, id: string): Promise<Assessment> =>
  requestJson(accessToken, `/assessments/${encodeURIComponent(id)}`);

export const createAssessment = (
  accessToken: string,
  body: CreateAssessmentInput,
): Promise<Assessment> => requestJson(accessToken, "/assessments", { method: "POST", body });

/** Mirrors the API rule: every mandatory step must pass. */
export const deriveAssessmentResult = (
  input: Pick<CreateAssessmentInput, "safetyPass" | "qualityPass" | "recordsPass">,
): Exclude<AssessmentResult, "pending"> =>
  input.safetyPass && input.qualityPass && input.recordsPass ? "pass" : "fail";

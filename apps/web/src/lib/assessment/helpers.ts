import type { AssessmentResult, CreateAssessmentDto } from "@/lib/api/generated/model";
import type { UserRole } from "@/lib/auth/types";

/** Field roles that appear on the assessment roster. */
export const ASSESSABLE_ROLES: UserRole[] = ["qc", "handler", "cluster_supervisor"];

/** Mirrors the API rule: every mandatory step must pass. */
export const deriveAssessmentResult = (
  input: Pick<CreateAssessmentDto, "safetyPass" | "qualityPass" | "recordsPass">,
): Exclude<AssessmentResult, "pending"> =>
  input.safetyPass && input.qualityPass && input.recordsPass ? "pass" : "fail";

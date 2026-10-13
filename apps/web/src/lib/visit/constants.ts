import type { DispositionDecision, SignatureRole } from "@/lib/api/generated/model";

export const SIGNATURE_ROLE_LABELS: Record<SignatureRole, string> = {
  qc: "QC sign-off",
  cluster_supervisor: "Cluster supervisor",
  depot_representative: "Depot representative",
};

export const DISPOSITION_LABELS: Record<DispositionDecision, string> = {
  release: "Release",
  hold: "Hold",
  reject: "Reject",
  approve_repack: "Approve repack",
};

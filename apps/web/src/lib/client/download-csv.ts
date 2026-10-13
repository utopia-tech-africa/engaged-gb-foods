import {
  getClientExportHoldsCsv,
  getClientExportReconciliationCsv,
} from "@/lib/api/generated/client/client";

export type ClientCsvKind = "reconciliation" | "holds";

/** Fetches a client CSV export through Orval and triggers a browser download. */
export const downloadClientCsv = async (
  kind: ClientCsvKind,
  filters: { date?: string; regionId?: string },
): Promise<void> => {
  const csv =
    kind === "reconciliation"
      ? await getClientExportReconciliationCsv(filters)
      : await getClientExportHoldsCsv(filters);

  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = kind === "reconciliation" ? "reconciliation.csv" : "holds.csv";
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
};

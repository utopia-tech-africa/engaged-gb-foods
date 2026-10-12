"use client";

import { useEffect, useState } from "react";

import { useAuth } from "@/components/auth-provider";
import { OpsNetworkNav } from "@/components/ops-network-nav";
import { RequireAuth } from "@/components/require-auth";
import { ShellFrame } from "@/components/shell-frame";
import type { Region } from "@/lib/network/api";
import * as networkApi from "@/lib/network/api";
import { OPS_NETWORK_ROLES } from "@/lib/network/roles";

export default function OpsRegionsPage() {
  const { accessToken } = useAuth();
  const [regions, setRegions] = useState<Region[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    void (async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await networkApi.fetchRegions(accessToken);
        setRegions(data);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load regions");
      } finally {
        setIsLoading(false);
      }
    })();
  }, [accessToken]);

  return (
    <RequireAuth roles={OPS_NETWORK_ROLES}>
      <ShellFrame title="Regions" eyebrow="Network">
        <div className="space-y-6">
          <OpsNetworkNav />
          {isLoading ? (
            <p className="text-sm text-brand-ink">Loading regions…</p>
          ) : error ? (
            <p className="text-sm text-danger">{error}</p>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border bg-brand-muted/40 text-xs uppercase tracking-wide text-brand-ink">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Code</th>
                    <th className="px-4 py-3 font-semibold">Name</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {regions.map((region) => (
                    <tr key={region.id} className="border-b border-border last:border-0">
                      <td className="px-4 py-3 font-mono text-brand">{region.code}</td>
                      <td className="px-4 py-3 text-foreground">{region.name}</td>
                      <td className="px-4 py-3">
                        <span
                          className={
                            region.isActive
                              ? "rounded-full bg-brand-muted px-2 py-0.5 text-xs font-medium text-brand"
                              : "rounded-full bg-border px-2 py-0.5 text-xs text-brand-ink"
                          }
                        >
                          {region.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </ShellFrame>
    </RequireAuth>
  );
}

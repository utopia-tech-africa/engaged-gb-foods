"use client";

import { type FormEvent, useCallback, useEffect, useState } from "react";

import { useAuth } from "@/components/auth-provider";
import { OpsNetworkNav } from "@/components/ops-network-nav";
import { RequireAuth } from "@/components/require-auth";
import { ShellFrame } from "@/components/shell-frame";
import type { Distributor, Region } from "@/lib/network/api";
import * as networkApi from "@/lib/network/api";
import { canWriteNetwork, OPS_NETWORK_ROLES } from "@/lib/network/roles";

export default function OpsDistributorsPage() {
  const { accessToken, user } = useAuth();
  const [regions, setRegions] = useState<Region[]>([]);
  const [distributors, setDistributors] = useState<Distributor[]>([]);
  const [filterRegionId, setFilterRegionId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [regionId, setRegionId] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");

  const writeEnabled = user ? canWriteNetwork(user.role) : false;

  const loadData = useCallback(async (token: string, regionFilter?: string): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      const [regionList, distributorList] = await Promise.all([
        networkApi.fetchRegions(token),
        networkApi.fetchDistributors(token, regionFilter || undefined),
      ]);
      setRegions(regionList);
      setDistributors(distributorList);
      setRegionId((current) => current || regionList[0]?.id || "");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load distributors");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!accessToken) {
      return;
    }
    void loadData(accessToken, filterRegionId);
  }, [accessToken, filterRegionId, loadData]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (!accessToken || !writeEnabled) {
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await networkApi.createDistributor(accessToken, {
        name,
        code,
        regionId,
        contactName: contactName || undefined,
        contactPhone: contactPhone || undefined,
      });
      setName("");
      setCode("");
      setContactName("");
      setContactPhone("");
      await loadData(accessToken, filterRegionId);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to create distributor");
    } finally {
      setIsSubmitting(false);
    }
  };

  const regionNameById = (id: string): string =>
    regions.find((region) => region.id === id)?.name ?? "—";

  return (
    <RequireAuth roles={OPS_NETWORK_ROLES}>
      <ShellFrame title="Distributors" eyebrow="Network">
        <div className="space-y-6">
          <OpsNetworkNav />

          <div className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1 text-sm text-brand-ink">
              Filter by region
              <select
                className="rounded-xl border border-border bg-surface px-3 py-2 text-foreground"
                value={filterRegionId}
                onChange={(event) => setFilterRegionId(event.target.value)}
              >
                <option value="">All regions</option>
                {regions.map((region) => (
                  <option key={region.id} value={region.id}>
                    {region.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {writeEnabled ? (
            <form
              onSubmit={(event) => void onSubmit(event)}
              className="grid gap-4 rounded-2xl border border-border bg-surface p-5 shadow-sm md:grid-cols-2"
            >
              <h2 className="md:col-span-2 font-display text-lg font-semibold text-foreground">
                Add distributor
              </h2>
              <label className="flex flex-col gap-1 text-sm text-brand-ink">
                Name
                <input
                  required
                  className="rounded-xl border border-border px-3 py-2"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              </label>
              <label className="flex flex-col gap-1 text-sm text-brand-ink">
                Code
                <input
                  required
                  className="rounded-xl border border-border px-3 py-2 font-mono uppercase"
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                />
              </label>
              <label className="flex flex-col gap-1 text-sm text-brand-ink">
                Region
                <select
                  required
                  className="rounded-xl border border-border bg-surface px-3 py-2"
                  value={regionId}
                  onChange={(event) => setRegionId(event.target.value)}
                >
                  {regions.map((region) => (
                    <option key={region.id} value={region.id}>
                      {region.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-sm text-brand-ink">
                Contact name
                <input
                  className="rounded-xl border border-border px-3 py-2"
                  value={contactName}
                  onChange={(event) => setContactName(event.target.value)}
                />
              </label>
              <label className="flex flex-col gap-1 text-sm text-brand-ink md:col-span-2">
                Contact phone
                <input
                  className="rounded-xl border border-border px-3 py-2"
                  value={contactPhone}
                  onChange={(event) => setContactPhone(event.target.value)}
                />
              </label>
              <button
                type="submit"
                disabled={isSubmitting}
                className="md:col-span-2 w-fit rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-hover disabled:opacity-60"
              >
                {isSubmitting ? "Saving…" : "Create distributor"}
              </button>
            </form>
          ) : null}

          {error ? <p className="text-sm text-danger">{error}</p> : null}

          {isLoading ? (
            <p className="text-sm text-brand-ink">Loading distributors…</p>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border bg-brand-muted/40 text-xs uppercase tracking-wide text-brand-ink">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Code</th>
                    <th className="px-4 py-3 font-semibold">Name</th>
                    <th className="px-4 py-3 font-semibold">Region</th>
                    <th className="px-4 py-3 font-semibold">Contact</th>
                  </tr>
                </thead>
                <tbody>
                  {distributors.map((distributor) => (
                    <tr key={distributor.id} className="border-b border-border last:border-0">
                      <td className="px-4 py-3 font-mono text-brand">{distributor.code}</td>
                      <td className="px-4 py-3">{distributor.name}</td>
                      <td className="px-4 py-3">{regionNameById(distributor.regionId)}</td>
                      <td className="px-4 py-3 text-brand-ink">
                        {distributor.contactName ?? "—"}
                        {distributor.contactPhone ? (
                          <span className="block text-xs">{distributor.contactPhone}</span>
                        ) : null}
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

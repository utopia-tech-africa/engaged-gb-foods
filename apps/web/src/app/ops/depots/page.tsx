"use client";

import { type FormEvent, useCallback, useEffect, useState } from "react";

import { useAuth } from "@/components/auth-provider";
import { OpsNetworkNav } from "@/components/ops-network-nav";
import { RequireAuth } from "@/components/require-auth";
import { ShellFrame } from "@/components/shell-frame";
import type { Depot, Distributor } from "@/lib/network/api";
import * as networkApi from "@/lib/network/api";
import { canWriteNetwork, OPS_NETWORK_ROLES } from "@/lib/network/roles";

export default function OpsDepotsPage() {
  const { accessToken, user } = useAuth();
  const [distributors, setDistributors] = useState<Distributor[]>([]);
  const [depots, setDepots] = useState<Depot[]>([]);
  const [filterDistributorId, setFilterDistributorId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [distributorId, setDistributorId] = useState("");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");

  const writeEnabled = user ? canWriteNetwork(user.role) : false;

  const loadData = useCallback(async (token: string, distributorFilter?: string): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      const [distributorList, depotList] = await Promise.all([
        networkApi.fetchDistributors(token),
        networkApi.fetchDepots(token, {
          distributorId: distributorFilter || undefined,
        }),
      ]);
      setDistributors(distributorList);
      setDepots(depotList);
      setDistributorId((current) => current || distributorList[0]?.id || "");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load depots");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!accessToken) {
      return;
    }
    void loadData(accessToken, filterDistributorId);
  }, [accessToken, filterDistributorId, loadData]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (!accessToken || !writeEnabled) {
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const lat = latitude.trim() ? Number.parseFloat(latitude) : undefined;
      const lng = longitude.trim() ? Number.parseFloat(longitude) : undefined;

      await networkApi.createDepot(accessToken, {
        distributorId,
        code,
        name,
        address,
        latitude: Number.isFinite(lat) ? lat : undefined,
        longitude: Number.isFinite(lng) ? lng : undefined,
      });
      setCode("");
      setName("");
      setAddress("");
      setLatitude("");
      setLongitude("");
      await loadData(accessToken, filterDistributorId);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to create depot");
    } finally {
      setIsSubmitting(false);
    }
  };

  const distributorNameById = (id: string): string =>
    distributors.find((distributor) => distributor.id === id)?.name ?? "—";

  return (
    <RequireAuth roles={OPS_NETWORK_ROLES}>
      <ShellFrame title="Depots" eyebrow="Network">
        <div className="space-y-6">
          <OpsNetworkNav />

          <div className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1 text-sm text-brand-ink">
              Filter by distributor
              <select
                className="rounded-xl border border-border bg-surface px-3 py-2 text-foreground"
                value={filterDistributorId}
                onChange={(event) => setFilterDistributorId(event.target.value)}
              >
                <option value="">All distributors</option>
                {distributors.map((distributor) => (
                  <option key={distributor.id} value={distributor.id}>
                    {distributor.code} — {distributor.name}
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
                Add depot
              </h2>
              <label className="flex flex-col gap-1 text-sm text-brand-ink md:col-span-2">
                Distributor
                <select
                  required
                  className="rounded-xl border border-border bg-surface px-3 py-2"
                  value={distributorId}
                  onChange={(event) => setDistributorId(event.target.value)}
                >
                  {distributors.map((distributor) => (
                    <option key={distributor.id} value={distributor.id}>
                      {distributor.code} — {distributor.name}
                    </option>
                  ))}
                </select>
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
                Name
                <input
                  required
                  className="rounded-xl border border-border px-3 py-2"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              </label>
              <label className="flex flex-col gap-1 text-sm text-brand-ink md:col-span-2">
                Address
                <textarea
                  required
                  rows={2}
                  className="rounded-xl border border-border px-3 py-2"
                  value={address}
                  onChange={(event) => setAddress(event.target.value)}
                />
              </label>
              <label className="flex flex-col gap-1 text-sm text-brand-ink">
                Latitude (optional recce pin)
                <input
                  inputMode="decimal"
                  className="rounded-xl border border-border px-3 py-2"
                  value={latitude}
                  onChange={(event) => setLatitude(event.target.value)}
                  placeholder="5.6148"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm text-brand-ink">
                Longitude (optional recce pin)
                <input
                  inputMode="decimal"
                  className="rounded-xl border border-border px-3 py-2"
                  value={longitude}
                  onChange={(event) => setLongitude(event.target.value)}
                  placeholder="-0.2057"
                />
              </label>
              <button
                type="submit"
                disabled={isSubmitting}
                className="md:col-span-2 w-fit rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-hover disabled:opacity-60"
              >
                {isSubmitting ? "Saving…" : "Create depot"}
              </button>
            </form>
          ) : null}

          {error ? <p className="text-sm text-danger">{error}</p> : null}

          {isLoading ? (
            <p className="text-sm text-brand-ink">Loading depots…</p>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border bg-brand-muted/40 text-xs uppercase tracking-wide text-brand-ink">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Code</th>
                    <th className="px-4 py-3 font-semibold">Name</th>
                    <th className="px-4 py-3 font-semibold">Distributor</th>
                    <th className="px-4 py-3 font-semibold">Recce pin</th>
                    <th className="px-4 py-3 font-semibold">Readiness</th>
                  </tr>
                </thead>
                <tbody>
                  {depots.map((depot) => (
                    <tr key={depot.id} className="border-b border-border last:border-0">
                      <td className="px-4 py-3 font-mono text-brand">{depot.code}</td>
                      <td className="px-4 py-3">
                        <span className="block font-medium">{depot.name}</span>
                        <span className="text-xs text-brand-ink">{depot.address}</span>
                      </td>
                      <td className="px-4 py-3">{distributorNameById(depot.distributorId)}</td>
                      <td className="px-4 py-3 font-mono text-xs text-brand-ink">
                        {depot.latitude !== null && depot.longitude !== null
                          ? `${depot.latitude.toFixed(4)}, ${depot.longitude.toFixed(4)}`
                          : "—"}
                      </td>
                      <td className="px-4 py-3 capitalize">{depot.readiness}</td>
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

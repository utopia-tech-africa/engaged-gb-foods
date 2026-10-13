"use client";

import { type FormEvent, useCallback, useEffect, useState } from "react";

import { useAuth } from "@/components/auth-provider";
import { OpsNetworkNav } from "@/components/ops-network-nav";
import { RequireAuth } from "@/components/require-auth";
import { ShellFrame } from "@/components/shell-frame";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import type { Depot, Distributor } from "@/lib/network/api";
import * as networkApi from "@/lib/network/api";
import { canWriteNetwork, OPS_NETWORK_ROLES } from "@/lib/network/roles";

const ALL_FILTER = "__all__";

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

          <div className="max-w-md space-y-2">
            <Label>Filter by distributor</Label>
            <Select
              value={filterDistributorId || ALL_FILTER}
              onValueChange={(value) => {
                if (!value) {
                  return;
                }
                setFilterDistributorId(value === ALL_FILTER ? "" : value);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All distributors" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_FILTER}>All distributors</SelectItem>
                {distributors.map((distributor) => (
                  <SelectItem key={distributor.id} value={distributor.id}>
                    {distributor.code} — {distributor.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {writeEnabled ? (
            <Card>
              <CardHeader>
                <CardTitle className="font-display text-lg">Add depot</CardTitle>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={(event) => void onSubmit(event)}
                  className="grid gap-4 md:grid-cols-2"
                >
                  <div className="space-y-2 md:col-span-2">
                    <Label>Distributor</Label>
                    <Select
                      value={distributorId}
                      onValueChange={(value) => {
                        if (value) {
                          setDistributorId(value);
                        }
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select distributor" />
                      </SelectTrigger>
                      <SelectContent>
                        {distributors.map((distributor) => (
                          <SelectItem key={distributor.id} value={distributor.id}>
                            {distributor.code} — {distributor.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="depot-code">Code</Label>
                    <Input
                      id="depot-code"
                      required
                      className="font-mono uppercase"
                      value={code}
                      onChange={(event) => setCode(event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="depot-name">Name</Label>
                    <Input
                      id="depot-name"
                      required
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="depot-address">Address</Label>
                    <Textarea
                      id="depot-address"
                      required
                      rows={2}
                      value={address}
                      onChange={(event) => setAddress(event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="depot-lat">Latitude (optional recce pin)</Label>
                    <Input
                      id="depot-lat"
                      inputMode="decimal"
                      value={latitude}
                      onChange={(event) => setLatitude(event.target.value)}
                      placeholder="5.6148"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="depot-lng">Longitude (optional recce pin)</Label>
                    <Input
                      id="depot-lng"
                      inputMode="decimal"
                      value={longitude}
                      onChange={(event) => setLongitude(event.target.value)}
                      placeholder="-0.2057"
                    />
                  </div>
                  <Button type="submit" disabled={isSubmitting} className="md:col-span-2 w-fit">
                    {isSubmitting ? "Saving…" : "Create depot"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          ) : null}

          {error ? <p className="text-sm text-danger">{error}</p> : null}

          {isLoading ? (
            <p className="text-sm text-brand-ink">Loading depots…</p>
          ) : (
            <Card className="overflow-hidden p-0">
              <Table>
                <TableHeader className="bg-brand-muted/40">
                  <TableRow>
                    <TableHead className="text-xs uppercase tracking-wide text-brand-ink">
                      Code
                    </TableHead>
                    <TableHead className="text-xs uppercase tracking-wide text-brand-ink">
                      Name
                    </TableHead>
                    <TableHead className="text-xs uppercase tracking-wide text-brand-ink">
                      Distributor
                    </TableHead>
                    <TableHead className="text-xs uppercase tracking-wide text-brand-ink">
                      Recce pin
                    </TableHead>
                    <TableHead className="text-xs uppercase tracking-wide text-brand-ink">
                      Readiness
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {depots.map((depot) => (
                    <TableRow key={depot.id}>
                      <TableCell className="font-mono text-brand">{depot.code}</TableCell>
                      <TableCell>
                        <span className="block font-medium">{depot.name}</span>
                        <span className="text-xs text-brand-ink">{depot.address}</span>
                      </TableCell>
                      <TableCell>{distributorNameById(depot.distributorId)}</TableCell>
                      <TableCell className="font-mono text-xs text-brand-ink">
                        {depot.latitude !== null && depot.longitude !== null
                          ? `${depot.latitude.toFixed(4)}, ${depot.longitude.toFixed(4)}`
                          : "—"}
                      </TableCell>
                      <TableCell className="capitalize">{depot.readiness}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </div>
      </ShellFrame>
    </RequireAuth>
  );
}

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
import type { Distributor, Region } from "@/lib/network/api";
import * as networkApi from "@/lib/network/api";
import { canWriteNetwork, OPS_NETWORK_ROLES } from "@/lib/network/roles";

const ALL_FILTER = "__all__";

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

          <div className="max-w-md space-y-2">
            <Label>Filter by region</Label>
            <Select
              value={filterRegionId || ALL_FILTER}
              onValueChange={(value) => {
                if (!value) {
                  return;
                }
                setFilterRegionId(value === ALL_FILTER ? "" : value);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All regions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_FILTER}>All regions</SelectItem>
                {regions.map((region) => (
                  <SelectItem key={region.id} value={region.id}>
                    {region.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {writeEnabled ? (
            <Card>
              <CardHeader>
                <CardTitle className="font-display text-lg">Add distributor</CardTitle>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={(event) => void onSubmit(event)}
                  className="grid gap-4 md:grid-cols-2"
                >
                  <div className="space-y-2">
                    <Label htmlFor="distributor-name">Name</Label>
                    <Input
                      id="distributor-name"
                      required
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="distributor-code">Code</Label>
                    <Input
                      id="distributor-code"
                      required
                      className="font-mono uppercase"
                      value={code}
                      onChange={(event) => setCode(event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Region</Label>
                    <Select
                      value={regionId}
                      onValueChange={(value) => {
                        if (value) {
                          setRegionId(value);
                        }
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select region" />
                      </SelectTrigger>
                      <SelectContent>
                        {regions.map((region) => (
                          <SelectItem key={region.id} value={region.id}>
                            {region.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact-name">Contact name</Label>
                    <Input
                      id="contact-name"
                      value={contactName}
                      onChange={(event) => setContactName(event.target.value)}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="contact-phone">Contact phone</Label>
                    <Input
                      id="contact-phone"
                      value={contactPhone}
                      onChange={(event) => setContactPhone(event.target.value)}
                    />
                  </div>
                  <Button type="submit" disabled={isSubmitting} className="md:col-span-2 w-fit">
                    {isSubmitting ? "Saving…" : "Create distributor"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          ) : null}

          {error ? <p className="text-sm text-danger">{error}</p> : null}

          {isLoading ? (
            <p className="text-sm text-brand-ink">Loading distributors…</p>
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
                      Region
                    </TableHead>
                    <TableHead className="text-xs uppercase tracking-wide text-brand-ink">
                      Contact
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {distributors.map((distributor) => (
                    <TableRow key={distributor.id}>
                      <TableCell className="font-mono text-brand">{distributor.code}</TableCell>
                      <TableCell>{distributor.name}</TableCell>
                      <TableCell>{regionNameById(distributor.regionId)}</TableCell>
                      <TableCell className="text-brand-ink">
                        {distributor.contactName ?? "—"}
                        {distributor.contactPhone ? (
                          <span className="block text-xs">{distributor.contactPhone}</span>
                        ) : null}
                      </TableCell>
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

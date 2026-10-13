"use client";

import { useQueryClient } from "@tanstack/react-query";
import { type FormEvent, useState } from "react";

import { useAuth } from "@/components/auth-provider";
import { RequireAuth } from "@/components/require-auth";
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
import {
  getGetDistributorsQueryKey,
  useGetDistributors,
  usePostDistributors,
} from "@/lib/api/generated/distributors/distributors";
import { useGetRegions } from "@/lib/api/generated/regions/regions";
import { canWriteNetwork, OPS_NETWORK_ROLES } from "@/lib/network/roles";

const ALL_FILTER = "__all__";

export default function OpsDistributorsPage() {
  const { accessToken, user } = useAuth();
  const queryClient = useQueryClient();
  const [filterRegionId, setFilterRegionId] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [selectedRegionId, setSelectedRegionId] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");

  const writeEnabled = user ? canWriteNetwork(user.role) : false;
  const enabled = Boolean(accessToken);

  const regionsQuery = useGetRegions({ query: { enabled } });
  const distributorsQuery = useGetDistributors(
    { regionId: filterRegionId || undefined },
    { query: { enabled } },
  );
  const createDistributor = usePostDistributors();

  const regions = regionsQuery.data ?? [];
  const distributors = distributorsQuery.data ?? [];
  const regionId = selectedRegionId || regions[0]?.id || "";
  const isLoading = regionsQuery.isLoading || distributorsQuery.isLoading;
  const error = submitError ?? regionsQuery.error?.message ?? distributorsQuery.error?.message;

  const onSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (!writeEnabled) {
      return;
    }

    setSubmitError(null);
    try {
      await createDistributor.mutateAsync({
        data: {
          name,
          code,
          regionId,
          contactName: contactName || undefined,
          contactPhone: contactPhone || undefined,
        },
      });
      setName("");
      setCode("");
      setContactName("");
      setContactPhone("");
      await queryClient.invalidateQueries({ queryKey: getGetDistributorsQueryKey() });
    } catch (mutationError) {
      setSubmitError(
        mutationError instanceof Error ? mutationError.message : "Unable to create distributor",
      );
    }
  };

  const regionNameById = (id: string): string =>
    regions.find((region) => region.id === id)?.name ?? "—";

  return (
    <RequireAuth roles={OPS_NETWORK_ROLES}>
      <div className="space-y-6">
        <h1 className="font-display text-3xl font-semibold text-foreground md:text-4xl">
          Distributors
        </h1>
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
                        setSelectedRegionId(value);
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
                <Button
                  type="submit"
                  disabled={createDistributor.isPending}
                  className="md:col-span-2 w-fit"
                >
                  {createDistributor.isPending ? "Saving…" : "Create distributor"}
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
    </RequireAuth>
  );
}

"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Warehouse } from "lucide-react";
import { type FormEvent, useState } from "react";

import { useAuth } from "@/components/auth-provider";
import { EmptyState } from "@/components/empty-state";
import { TableSkeleton } from "@/components/list-skeleton";
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
import { Textarea } from "@/components/ui/textarea";
import {
  getGetDepotsQueryKey,
  useGetDepots,
  usePostDepots,
} from "@/lib/api/generated/depots/depots";
import { useGetDistributors } from "@/lib/api/generated/distributors/distributors";
import { canWriteNetwork, OPS_NETWORK_ROLES } from "@/lib/network/roles";

const ALL_FILTER = "__all__";

export default function OpsDepotsPage() {
  const { accessToken, user } = useAuth();
  const queryClient = useQueryClient();
  const [filterDistributorId, setFilterDistributorId] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [selectedDistributorId, setSelectedDistributorId] = useState("");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");

  const writeEnabled = user ? canWriteNetwork(user.role) : false;
  const enabled = Boolean(accessToken);

  const distributorsQuery = useGetDistributors(undefined, { query: { enabled } });
  const depotsQuery = useGetDepots(
    { distributorId: filterDistributorId || undefined },
    { query: { enabled } },
  );
  const createDepot = usePostDepots();

  const distributors = distributorsQuery.data ?? [];
  const depots = depotsQuery.data ?? [];
  const distributorOptions = distributors.map((distributor) => ({
    value: distributor.id,
    label: `${distributor.code} — ${distributor.name}`,
  }));
  const distributorFilterOptions = [
    { value: ALL_FILTER, label: "All distributors" },
    ...distributorOptions,
  ];
  const distributorId = selectedDistributorId || distributors[0]?.id || "";
  const isLoading = distributorsQuery.isLoading || depotsQuery.isLoading;
  const error = submitError ?? distributorsQuery.error?.message ?? depotsQuery.error?.message;

  const onSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (!writeEnabled) {
      return;
    }

    setSubmitError(null);
    try {
      const lat = latitude.trim() ? Number.parseFloat(latitude) : undefined;
      const lng = longitude.trim() ? Number.parseFloat(longitude) : undefined;

      await createDepot.mutateAsync({
        data: {
          distributorId,
          code,
          name,
          address,
          latitude: Number.isFinite(lat) ? lat : undefined,
          longitude: Number.isFinite(lng) ? lng : undefined,
        },
      });
      setCode("");
      setName("");
      setAddress("");
      setLatitude("");
      setLongitude("");
      await queryClient.invalidateQueries({ queryKey: getGetDepotsQueryKey() });
    } catch (mutationError) {
      setSubmitError(
        mutationError instanceof Error ? mutationError.message : "Unable to create depot",
      );
    }
  };

  const distributorNameById = (id: string): string =>
    distributors.find((distributor) => distributor.id === id)?.name ?? "—";

  return (
    <RequireAuth roles={OPS_NETWORK_ROLES}>
      <div className="space-y-6">
        <h1 className="font-display text-3xl font-semibold text-foreground md:text-4xl">Depots</h1>
        <div className="max-w-md space-y-2">
          <Label>Filter by distributor</Label>
          <Select
            items={distributorFilterOptions}
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
              {distributorFilterOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
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
                    items={distributorOptions}
                    value={distributorId}
                    onValueChange={(value) => {
                      if (value) {
                        setSelectedDistributorId(value);
                      }
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select distributor" />
                    </SelectTrigger>
                    <SelectContent>
                      {distributorOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
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
                <Button
                  type="submit"
                  disabled={createDepot.isPending}
                  className="md:col-span-2 w-fit"
                >
                  {createDepot.isPending ? "Saving…" : "Create depot"}
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : null}

        {error ? <p className="text-sm text-danger">{error}</p> : null}

        {isLoading ? (
          <TableSkeleton columns={5} rows={5} />
        ) : depots.length === 0 ? (
          <EmptyState
            icon={Warehouse}
            title="No depots in this view"
            description="Clear the distributor filter, or add the first depot."
          />
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
    </RequireAuth>
  );
}

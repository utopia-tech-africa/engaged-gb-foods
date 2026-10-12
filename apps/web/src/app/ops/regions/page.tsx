"use client";

import { useEffect, useState } from "react";

import { useAuth } from "@/components/auth-provider";
import { OpsNetworkNav } from "@/components/ops-network-nav";
import { RequireAuth } from "@/components/require-auth";
import { ShellFrame } from "@/components/shell-frame";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
                      Status
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {regions.map((region) => (
                    <TableRow key={region.id}>
                      <TableCell className="font-mono text-brand">{region.code}</TableCell>
                      <TableCell className="text-foreground">{region.name}</TableCell>
                      <TableCell>
                        <Badge variant={region.isActive ? "default" : "outline"}>
                          {region.isActive ? "Active" : "Inactive"}
                        </Badge>
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

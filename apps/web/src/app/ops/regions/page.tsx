"use client";

import { useAuth } from "@/components/auth-provider";
import { RequireAuth } from "@/components/require-auth";
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
import { useGetRegions } from "@/lib/api/generated/regions/regions";
import { OPS_NETWORK_ROLES } from "@/lib/network/roles";

export default function OpsRegionsPage() {
  const { accessToken } = useAuth();
  const {
    data: regions = [],
    error,
    isLoading,
  } = useGetRegions({ query: { enabled: Boolean(accessToken) } });

  return (
    <RequireAuth roles={OPS_NETWORK_ROLES}>
      <div className="space-y-6">
        <h1 className="font-display text-3xl font-semibold text-foreground md:text-4xl">Regions</h1>
        {isLoading ? (
          <p className="text-sm text-brand-ink">Loading regions…</p>
        ) : error ? (
          <p className="text-sm text-danger">{error.message}</p>
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
    </RequireAuth>
  );
}

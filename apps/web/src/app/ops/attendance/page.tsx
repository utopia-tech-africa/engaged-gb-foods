"use client";

import { useEffect, useMemo, useState } from "react";

import { AttendancePhoto } from "@/components/attendance-photo";
import { useAuth } from "@/components/auth-provider";
import { DatePicker } from "@/components/date-picker";
import { OpsNetworkNav } from "@/components/ops-network-nav";
import { RequireAuth } from "@/components/require-auth";
import { ShellFrame } from "@/components/shell-frame";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { type AttendanceRecord, fetchAttendanceForDate } from "@/lib/attendance/api";
import { OPS_NETWORK_ROLES } from "@/lib/network/roles";

const todayIso = (): string => new Date().toISOString().slice(0, 10);

const formatLocation = (row: AttendanceRecord): string => {
  if (row.latitude === null || row.longitude === null) {
    return "Unavailable";
  }
  const accuracy = row.accuracyMeters !== null ? ` ±${Math.round(row.accuracyMeters)} m` : "";
  return `${row.latitude.toFixed(5)}, ${row.longitude.toFixed(5)}${accuracy}`;
};

export default function OpsAttendancePage() {
  const { accessToken } = useAuth();
  const [date, setDate] = useState(todayIso());
  const [rows, setRows] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) {
      return;
    }
    setLoading(true);
    void fetchAttendanceForDate(accessToken, { date })
      .then(setRows)
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Could not load attendance");
      })
      .finally(() => setLoading(false));
  }, [accessToken, date]);

  const sorted = useMemo(
    () => [...rows].sort((a, b) => b.capturedAt.localeCompare(a.capturedAt)),
    [rows],
  );

  return (
    <RequireAuth roles={[...OPS_NETWORK_ROLES, "cluster_supervisor", "regional_supervisor"]}>
      <ShellFrame title="Attendance" eyebrow="Operations">
        <div className="space-y-6">
          <OpsNetworkNav />
          <div className="max-w-xs space-y-2">
            <Label htmlFor="attendance-date">Date</Label>
            <DatePicker id="attendance-date" value={date} onChange={setDate} />
          </div>

          {loading ? <p className="text-sm text-brand-ink/70">Loading attendance…</p> : null}
          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          {!loading && !error && sorted.length === 0 ? (
            <p className="text-sm text-brand-ink/70">No attendance records for this date.</p>
          ) : null}

          <ul className="space-y-4">
            {sorted.map((row) => (
              <li key={row.id}>
                <Card>
                  <CardContent className="grid gap-4 md:grid-cols-[120px_1fr]">
                    {accessToken ? (
                      <AttendancePhoto
                        accessToken={accessToken}
                        objectKey={row.photoObjectKey}
                        alt={`${row.user.fullName} attendance`}
                        className="h-28 w-full rounded-lg object-cover"
                      />
                    ) : null}
                    <div className="space-y-1 text-sm text-brand-ink">
                      <p className="font-semibold">
                        {row.user.fullName}
                        {row.user.staffId ? ` · ${row.user.staffId}` : ""}
                      </p>
                      <p>
                        <span className="text-brand-ink/60">Depot:</span> {row.depot.name} (
                        {row.depot.code})
                      </p>
                      <p>
                        <span className="text-brand-ink/60">Kind:</span>{" "}
                        <Badge variant="secondary">
                          {row.kind === "check_in" ? "Check in" : "Check out"}
                        </Badge>
                      </p>
                      <p>
                        <span className="text-brand-ink/60">Location:</span> {formatLocation(row)}
                      </p>
                      <p>
                        <span className="text-brand-ink/60">Photo key:</span>{" "}
                        <code className="text-xs">{row.photoObjectKey}</code>
                      </p>
                      <p className="text-xs text-brand-ink/60">
                        {new Date(row.capturedAt).toLocaleString()}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        </div>
      </ShellFrame>
    </RequireAuth>
  );
}

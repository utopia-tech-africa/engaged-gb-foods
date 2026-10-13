"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";

import { useAuth } from "@/components/auth-provider";
import { RequireAuth } from "@/components/require-auth";
import { ShellFrame } from "@/components/shell-frame";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  type AttendanceKind,
  type AttendanceRecord,
  fetchMyDepots,
  type MyDepot,
  postAttendance,
  uploadPhotoForAttendance,
} from "@/lib/attendance/api";
import type { UserRole } from "@/lib/auth/types";
import { cn } from "@/lib/utils";

const FIELD_ROLES: UserRole[] = ["qc", "handler", "cluster_supervisor", "regional_supervisor"];

type GeoSnapshot = {
  latitude: number;
  longitude: number;
  accuracyMeters: number;
};

const formatLocation = (record: AttendanceRecord): string => {
  if (record.latitude === null || record.longitude === null) {
    return "Location unavailable";
  }
  const accuracy =
    record.accuracyMeters !== null ? ` (±${Math.round(record.accuracyMeters)} m)` : "";
  return `${record.latitude.toFixed(5)}, ${record.longitude.toFixed(5)}${accuracy}`;
};

function CheckInContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const depotId = searchParams.get("depotId");
  const { accessToken } = useAuth();

  const [depot, setDepot] = useState<MyDepot | null>(null);
  const [kind, setKind] = useState<AttendanceKind>("check_in");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [geo, setGeo] = useState<GeoSnapshot | null>(null);
  const [geoDenied, setGeoDenied] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<AttendanceRecord | null>(null);

  useEffect(() => {
    if (!accessToken || !depotId) {
      return;
    }
    void fetchMyDepots(accessToken)
      .then((depots) => {
        const match = depots.find((item) => item.id === depotId) ?? null;
        setDepot(match);
        if (!match) {
          setError("Depot not found in your assignments.");
        }
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Could not load depot");
      });
  }, [accessToken, depotId]);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setGeoDenied(true);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGeo({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracyMeters: position.coords.accuracy,
        });
        setGeoDenied(false);
      },
      () => {
        setGeo(null);
        setGeoDenied(true);
      },
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 0 },
    );
  }, []);

  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  const onFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0];
    if (!selected) {
      return;
    }
    setFile(selected);
    setPreviewUrl(URL.createObjectURL(selected));
    setSuccess(null);
    setError(null);
  };

  const canSubmit = useMemo(
    () => Boolean(depot && file && accessToken && !submitting),
    [depot, file, accessToken, submitting],
  );

  const onSubmit = async () => {
    if (!depot || !file || !accessToken) {
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const photoObjectKey = await uploadPhotoForAttendance(accessToken, file);
      const record = await postAttendance(accessToken, {
        depotId: depot.id,
        kind,
        photoObjectKey,
        ...(geo
          ? {
              latitude: geo.latitude,
              longitude: geo.longitude,
              accuracyMeters: geo.accuracyMeters,
            }
          : {}),
      });
      setSuccess(record);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Check-in failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (!depotId) {
    return (
      <p className="text-sm text-red-600">
        Missing depotId. Open check-in from the field depot list.
      </p>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      {depot ? (
        <Card>
          <CardContent>
            <p className="text-xs font-semibold uppercase tracking-wide text-brand">{depot.code}</p>
            <h2 className="mt-1 text-xl font-semibold text-brand-ink">{depot.name}</h2>
            <p className="mt-2 text-sm text-brand-ink/70">{depot.address}</p>
          </CardContent>
        </Card>
      ) : null}

      <div className="flex gap-2">
        {(["check_in", "check_out"] as const).map((value) => (
          <Button
            key={value}
            type="button"
            variant={kind === value ? "default" : "outline"}
            className={cn("rounded-full", kind === value && "bg-brand hover:bg-brand/90")}
            onClick={() => setKind(value)}
          >
            {value === "check_in" ? "Check in" : "Check out"}
          </Button>
        ))}
      </div>

      <div className="space-y-2">
        <Label htmlFor="selfie">Selfie photo</Label>
        <input
          id="selfie"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          capture="user"
          className="block w-full text-sm text-brand-ink file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-foreground"
          onChange={onFileChange}
        />
        {previewUrl ? (
          // biome-ignore lint/performance/noImgElement: local file preview blob
          <img
            src={previewUrl}
            alt="Selfie preview"
            className="mt-3 max-h-64 w-full rounded-xl object-cover"
          />
        ) : null}
      </div>

      <Card className="border-dashed bg-surface/80">
        <CardContent className="text-sm text-brand-ink">
          <p className="font-medium">Location</p>
          {geo ? (
            <p className="mt-1 text-brand-ink/80">
              {geo.latitude.toFixed(5)}, {geo.longitude.toFixed(5)} (±
              {Math.round(geo.accuracyMeters)} m)
            </p>
          ) : geoDenied ? (
            <p className="mt-1 text-brand-ink/70">
              GPS unavailable or denied — attendance will be saved without coordinates.
            </p>
          ) : (
            <p className="mt-1 text-brand-ink/70">Requesting location…</p>
          )}
          <Button
            type="button"
            variant="link"
            className="mt-3 h-auto p-0"
            onClick={requestLocation}
          >
            Refresh location
          </Button>
        </CardContent>
      </Card>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {success ? (
        <Card className="border-green-200 bg-green-50/80">
          <CardContent className="text-sm text-green-900">
            <p className="font-semibold">
              {success.kind === "check_in" ? "Checked in" : "Checked out"} successfully
            </p>
            <p className="mt-2">{formatLocation(success)}</p>
            <Button type="button" className="mt-4" onClick={() => router.push("/field")}>
              Back to depots
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Button
          type="button"
          disabled={!canSubmit}
          className="w-full"
          onClick={() => void onSubmit()}
        >
          {submitting
            ? "Submitting…"
            : kind === "check_in"
              ? "Submit check-in"
              : "Submit check-out"}
        </Button>
      )}
    </div>
  );
}

export default function FieldCheckInPage() {
  return (
    <RequireAuth roles={FIELD_ROLES}>
      <ShellFrame title="Depot check-in" eyebrow="Field">
        <Suspense fallback={<p className="text-sm text-brand-ink/70">Loading…</p>}>
          <CheckInContent />
        </Suspense>
      </ShellFrame>
    </RequireAuth>
  );
}

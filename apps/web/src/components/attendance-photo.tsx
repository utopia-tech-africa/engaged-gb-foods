"use client";

import { useEffect, useState } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { fetchPhotoObjectUrl } from "@/lib/uploads";
import { cn } from "@/lib/utils";

type AttendancePhotoProps = {
  objectKey: string;
  alt: string;
  className?: string;
};

export const AttendancePhoto = ({ objectKey, alt, className }: AttendancePhotoProps) => {
  const [src, setSrc] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;

    void fetchPhotoObjectUrl(objectKey)
      .then((url) => {
        if (cancelled) {
          URL.revokeObjectURL(url);
          return;
        }
        objectUrl = url;
        setSrc(url);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load photo");
        }
      });

    return () => {
      cancelled = true;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [objectKey]);

  if (error || !src) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-muted text-center text-xs text-muted-foreground",
          className,
        )}
        role="img"
        aria-label={error ? "Photo unavailable" : "Loading photo"}
      >
        {error ? (
          "Photo unavailable"
        ) : (
          <Skeleton className="size-full min-h-20 rounded-[inherit]" />
        )}
      </div>
    );
  }

  return (
    // biome-ignore lint/performance/noImgElement: authenticated blob URL preview
    <img src={src} alt={alt} className={className} />
  );
};

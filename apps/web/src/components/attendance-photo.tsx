"use client";

import { useEffect, useState } from "react";

import { fetchPhotoObjectUrl } from "@/lib/uploads";

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

  if (error) {
    return <p className="text-xs text-red-600">{error}</p>;
  }

  if (!src) {
    return <p className="text-xs text-brand-ink/60">Loading photo…</p>;
  }

  return (
    // biome-ignore lint/performance/noImgElement: authenticated blob URL preview
    <img src={src} alt={alt} className={className} />
  );
};

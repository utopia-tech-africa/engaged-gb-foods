import { cn } from "@/lib/utils";

type PageLoaderProps = {
  label?: string;
  /** Fill the viewport (auth gates, Suspense boundaries). */
  fullScreen?: boolean;
  className?: string;
};

export const PageLoader = ({
  label = "Loading…",
  fullScreen = false,
  className,
}: PageLoaderProps) => (
  <div
    role="status"
    aria-live="polite"
    aria-busy="true"
    className={cn(
      "flex flex-col items-center justify-center gap-4 text-center",
      fullScreen
        ? "min-h-screen px-6"
        : "min-h-56 w-full rounded-xl border border-border bg-card/60 px-6 py-12",
      className,
    )}
  >
    <span className="relative flex size-12 items-center justify-center" aria-hidden>
      <span className="absolute inset-0 rounded-full border-2 border-brand/20" />
      <span className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-brand" />
      <span className="size-2 rounded-full bg-brand" />
    </span>
    <p className="text-sm font-medium text-muted-foreground">{label}</p>
  </div>
);

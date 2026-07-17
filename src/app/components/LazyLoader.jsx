/**
 * NewtonBotics branded lazy loader.
 * Variants: "page" (full viewport), "section" (block), "inline" (compact).
 */
export default function LazyLoader({
  variant = "section",
  label = "Loading",
  className = "",
}) {
  if (variant === "inline") {
    return (
      <div
        className={`inline-flex items-center gap-2 text-white/70 ${className}`}
        role="status"
        aria-live="polite"
        aria-label={label}
      >
        <span className="nb-loader-ring nb-loader-ring--sm" aria-hidden />
        <span className="text-sm font-medium tracking-wide">{label}…</span>
      </div>
    );
  }

  if (variant === "page") {
    return (
      <div
        className={`fixed inset-0 z-[80] flex items-center justify-center bg-black/80 backdrop-blur-sm ${className}`}
        role="status"
        aria-live="polite"
        aria-label={label}
      >
        <div className="flex flex-col items-center gap-5">
          <div className="relative flex h-16 w-16 items-center justify-center">
            <span className="nb-loader-ring" aria-hidden />
            <span className="nb-loader-core" aria-hidden />
          </div>
          <p className="text-sm font-semibold tracking-[0.2em] uppercase text-white/80">
            {label}
          </p>
          <div className="nb-loader-bar" aria-hidden />
        </div>
      </div>
    );
  }

  // section (default)
  return (
    <div
      className={`flex min-h-[220px] w-full items-center justify-center py-12 ${className}`}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <div className="flex flex-col items-center gap-4">
        <div className="relative flex h-12 w-12 items-center justify-center">
          <span className="nb-loader-ring" aria-hidden />
          <span className="nb-loader-core" aria-hidden />
        </div>
        <p className="text-xs font-semibold tracking-[0.18em] uppercase text-white/60">
          {label}
        </p>
      </div>
    </div>
  );
}

/** Skeleton placeholders for card grids while lazy chunks load */
export function LazySkeleton({ cards = 3, className = "" }) {
  return (
    <div
      className={`container mx-auto px-4 sm:px-6 py-12 ${className}`}
      role="status"
      aria-label="Loading content"
    >
      <div className="mb-8 mx-auto h-8 w-48 max-w-full rounded-lg bg-white/10 animate-pulse" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {Array.from({ length: cards }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <div className="h-10 w-10 rounded-xl bg-white/10 animate-pulse" />
            <div className="h-5 w-3/4 rounded bg-white/10 animate-pulse" />
            <div className="h-3 w-full rounded bg-white/10 animate-pulse" />
            <div className="h-3 w-2/3 rounded bg-white/10 animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Next.js App Router loading UI for route transitions. Deliberately page-neutral (the logo and a
 * thin progress bar) so it fits the full-screen home hero as well as card-grid pages.
 */
export default function Loading() {
  return (
    <div
      role="status"
      aria-label="Loading"
      className="nb-dark flex min-h-[calc(100svh-var(--nb-nav-height,72px))] flex-col items-center justify-center gap-5 bg-paper text-ink"
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- small static logo, sized explicitly */}
      <img
        src="/brand/newtonbotics-logo-red.webp"
        alt=""
        width={420}
        height={111}
        className="nb-route-loader-mark block h-10 w-auto sm:h-12"
      />
      <span aria-hidden="true" className="nb-route-loader-bar" />
      <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-muted">Booting up</span>
    </div>
  );
}

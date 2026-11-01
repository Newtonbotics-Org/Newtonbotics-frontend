export default function Loading() {
  return (
    <main className="nb-dark bg-paper text-ink" role="status" aria-label="Loading team">
      <header className="nb-blueprint border-b border-line">
        <div className="nb-container flex flex-col gap-5 pb-14 pt-16 sm:pt-20">
          <span className="nb-eyebrow">
            <span className="nb-eyebrow-num">[06]</span> Team
          </span>
          <span className="block h-14 w-full max-w-[640px] animate-pulse rounded-md bg-[#E6E7E1]" />
        </div>
      </header>
      <div className="nb-container grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4 pb-28 pt-10">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="nb-card flex flex-col gap-4 p-6">
            <div className="flex items-center gap-4">
              <span className="h-16 w-16 flex-none animate-pulse rounded-full bg-[#E6E7E1]" />
              <span className="flex flex-1 flex-col gap-2">
                <span className="h-5 w-3/4 animate-pulse rounded bg-[#E6E7E1]" />
                <span className="h-3 w-1/2 animate-pulse rounded bg-[#E6E7E1]" />
              </span>
            </div>
            <span className="h-3 w-full animate-pulse rounded bg-[#E6E7E1]" />
          </div>
        ))}
      </div>
    </main>
  );
}

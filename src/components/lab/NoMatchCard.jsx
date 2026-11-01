import BlueprintPlaceholder from "@/components/lab/BlueprintPlaceholder";

/** "Nothing matches these filters" card: message and a clear-filters button beside the robot game. */
export default function NoMatchCard({ title, hint = "Try a different filter or search term.", onClear, className = "" }) {
  return (
    <div className={`nb-card flex flex-wrap items-center gap-8 p-8 sm:p-10 ${className}`}>
      <div className="flex min-w-0 flex-[1_1_260px] flex-col items-start gap-4">
        <h2 className="m-0 font-display text-2xl font-semibold">{title}</h2>
        <p className="m-0 max-w-md text-ink-muted">{hint}</p>
        {onClear && (
          <button type="button" onClick={onClear} className="nb-btn nb-btn-secondary">
            Clear filters
          </button>
        )}
      </div>
      <BlueprintPlaceholder label="No matches" className="h-[220px] min-w-0 flex-[1.4_1_320px] rounded-md border border-line" />
    </div>
  );
}

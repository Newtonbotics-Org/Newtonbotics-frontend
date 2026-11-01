/** Mono section marker: "[01] Research areas ———". */
export default function SectionLabel({ index, children, tone = "light", rule = true, className = "" }) {
  const dark = tone === "dark";
  return (
    <div
      className={`flex items-center gap-3 font-mono text-xs uppercase tracking-[0.08em] ${
        dark ? "text-night-muted" : "text-ink-muted"
      } ${className}`}
    >
      {index && <span className={dark ? "text-signal-light" : "text-signal-text"}>[{index}]</span>}
      <span>{children}</span>
      {rule && <span className={`h-px flex-1 ${dark ? "bg-night-line" : "bg-line"}`} />}
    </div>
  );
}

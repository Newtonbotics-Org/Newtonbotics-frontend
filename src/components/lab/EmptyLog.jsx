import EmptyStateGame from "@/components/lab/EmptyStateGame";

/** "Nothing published yet" panel shared by the listing pages — copy on the left, robot mini game on the right. */
export default function EmptyLog({ id, eyebrow = "Log empty · First entry pending", title, scannerLabel, children, actions }) {
  return (
    <section
      aria-labelledby={id}
      className="flex flex-wrap items-center gap-10 rounded-lg border border-dashed border-line-strong bg-surface p-8 sm:p-12"
    >
      <div className="flex min-w-0 flex-[1_1_420px] flex-col gap-4">
        <span className="font-mono text-xs uppercase tracking-[0.06em] text-signal-text">{eyebrow}</span>
        <h2 id={id} className="m-0 font-display text-[28px] font-semibold leading-tight tracking-[-0.02em] sm:text-[34px]">
          {title}
        </h2>
        <p className="m-0 max-w-[560px] text-[17px] leading-relaxed text-ink-muted">{children}</p>
        {actions && <div className="mt-2 flex flex-wrap gap-3">{actions}</div>}
      </div>
      <EmptyStateGame label={scannerLabel} className="hidden flex-[1_1_300px] sm:flex" />
    </section>
  );
}

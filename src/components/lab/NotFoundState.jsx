import BlueprintPlaceholder from "@/components/lab/BlueprintPlaceholder";

/**
 * Full-page "not found" layout: copy and actions on the left, the playable robot game on the right.
 * Pass `as="main"` when it is the page's main landmark.
 */
export default function NotFoundState({ as: Tag = "main", eyebrow = "Error 404", title, message, actions, gameLabel = "Not found", children, className = "" }) {
  return (
    <Tag className={`nb-dark bg-paper text-ink ${className}`}>
      <div className="nb-container grid min-h-[70vh] grid-cols-1 items-center gap-10 py-20 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
        <div className="flex min-w-0 flex-col items-start gap-5">
          <span className="nb-eyebrow">
            <span className="nb-eyebrow-num">[404]</span> {eyebrow}
          </span>
          {children}
          <h1 className="nb-h1 m-0">{title}</h1>
          {message && <p className="m-0 max-w-[520px] text-lg leading-relaxed text-ink-muted">{message}</p>}
          {actions && <div className="flex flex-wrap gap-2.5">{actions}</div>}
        </div>
        <BlueprintPlaceholder label={gameLabel} className="h-[300px] w-full rounded-lg border border-line sm:h-[420px]" />
      </div>
    </Tag>
  );
}

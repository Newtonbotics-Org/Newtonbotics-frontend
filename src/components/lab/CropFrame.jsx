/**
 * White figure frame with orange crop marks and a mono caption row.
 * Use once per page, around the hero media.
 */
export default function CropFrame({ children, caption, captionRight, corners = "all", className = "" }) {
  const mark = "pointer-events-none absolute h-3.5 w-3.5 border-signal";
  const all = corners === "all";
  return (
    <figure className={`relative m-0 rounded-lg border border-line bg-surface p-3 ${className}`}>
      {children}
      {(caption || captionRight) && (
        <figcaption className="flex flex-wrap justify-between gap-3 px-1 pb-0.5 pt-3 font-mono text-[11px] uppercase tracking-[0.06em] text-ink-muted">
          <span>{caption}</span>
          {captionRight && <span>{captionRight}</span>}
        </figcaption>
      )}
      <span aria-hidden="true" className={`${mark} -left-[7px] -top-[7px] border-l-2 border-t-2`} />
      {all && <span aria-hidden="true" className={`${mark} -right-[7px] -top-[7px] border-r-2 border-t-2`} />}
      {all && <span aria-hidden="true" className={`${mark} -bottom-[7px] -left-[7px] border-b-2 border-l-2`} />}
      <span aria-hidden="true" className={`${mark} -bottom-[7px] -right-[7px] border-b-2 border-r-2`} />
    </figure>
  );
}

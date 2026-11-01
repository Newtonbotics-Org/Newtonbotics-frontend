/** Small presentational helpers shared by the inventory pages (Lab Spec). */

export const STOCK_CHIP = {
  Available: "nb-chip-green",
  "Low stock": "nb-chip-amber",
  "Out of stock": "nb-chip-blue",
  Maintenance: "nb-chip-red",
  Retired: "nb-chip-outline",
};

export function stockChip(label) {
  return STOCK_CHIP[label] || "nb-chip-outline";
}

/** Checkout record / equipment status → chip class. */
export function checkoutChip(status) {
  if (status === "returned") return "nb-chip-green";
  if (status === "overdue") return "nb-chip-red";
  if (status === "project_use") return "nb-chip-signal";
  return "nb-chip-blue";
}

export function equipmentStatusChip(status) {
  if (status === "available") return "nb-chip-green";
  if (status === "low_stock") return "nb-chip-amber";
  if (status === "out_of_stock") return "nb-chip-blue";
  if (status === "maintenance") return "nb-chip-red";
  return "nb-chip-outline";
}

/** Three-letter code for the item tile, derived from its category name. */
export function categoryCode(name) {
  const letters = String(name || "").replace(/[^a-z]/gi, "").toUpperCase();
  return letters ? letters.slice(0, 3) : "—";
}

export const MONO_META = "font-mono text-xs uppercase tracking-[0.06em] text-ink-muted";

export function Field({ id, label, hint, required = false, className = "", children }) {
  return (
    <div className={`flex min-w-0 flex-col gap-1.5 ${className}`}>
      <label htmlFor={id} className="nb-label">
        {label}
        {required && <span aria-hidden="true" className="text-signal-text"> *</span>}
      </label>
      {children}
      {hint && <span className="text-[13px] text-ink-muted">{hint}</span>}
    </div>
  );
}

export function Alert({ kind = "error", children, className = "" }) {
  const tone =
    kind === "success"
      ? "border-[#BBDFC6] bg-[#E3F1E7] text-[#166534]"
      : kind === "warning"
        ? "border-[#EBD9A8] bg-[#FDF1D8] text-[#854D0E]"
        : "border-[#F3C4C4] bg-[#FBE4E4] text-[#991B1B]";
  return (
    <div role={kind === "error" ? "alert" : "status"} className={`rounded-md border px-3.5 py-3 text-sm ${tone} ${className}`}>
      {children}
    </div>
  );
}

export function Toast({ toast }) {
  if (!toast?.visible) return null;
  const tone = toast.kind === "success" ? "border-[#BBDFC6] bg-[#E3F1E7] text-[#166534]" : "border-[#F3C4C4] bg-[#FBE4E4] text-[#991B1B]";
  return (
    <div role="status" aria-live="polite" className={`fixed bottom-6 left-1/2 z-[160] -translate-x-1/2 rounded-md border px-4 py-3 text-sm font-medium ${tone}`}>
      {toast.message}
    </div>
  );
}

export function DemoBanner({ label = "Demo mode", children }) {
  return (
    <div role="status" className="flex flex-wrap items-center gap-3 rounded-lg border border-line bg-surface px-4 py-3 text-sm text-ink-muted">
      <span className="nb-chip nb-chip-signal">{label}</span>
      <span className="min-w-0 flex-[1_1_240px]">{children}</span>
    </div>
  );
}

export function EmptyState({ icon: Icon, title, children, action, role, headingLevel = 3 }) {
  const Heading = `h${headingLevel}`;
  return (
    <div role={role} className="nb-card flex flex-col items-start gap-4 p-8 sm:p-10">
      {Icon && <Icon size={28} strokeWidth={1.5} aria-hidden="true" className="text-ink-muted" />}
      <Heading className="m-0 font-display text-2xl font-semibold tracking-[-0.02em]">{title}</Heading>
      {children && <p className="m-0 max-w-[60ch] text-ink-muted">{children}</p>}
      {action}
    </div>
  );
}

/**
 * NewtonBotics mark: a two-link arm with an orange joint.
 * `tone="light"` is for light grounds, `tone="dark"` for dark ones.
 */
export function LabMark({ size = 32, tone = "light", className = "" }) {
  const tile = tone === "dark" ? "#F4F4F0" : "#0E1013";
  const arm = tone === "dark" ? "#0E1013" : "#F4F4F0";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      aria-hidden="true"
      className={className}
    >
      <rect width="32" height="32" rx="6" fill={tile} />
      <path
        d="M8 24 L15 11 L24 17"
        stroke={arm}
        strokeWidth="2.4"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="15" cy="11" r="3.4" fill="#FF5A1F" />
      <circle cx="8" cy="24" r="2" fill={arm} />
    </svg>
  );
}

export default function LabLogo({ tone = "light", size = 32, showTag = false }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <LabMark size={size} tone={tone} />
      <span
        className={`font-display text-[19px] font-semibold tracking-[-0.02em] ${
          tone === "dark" ? "text-night-text" : "text-ink"
        }`}
      >
        NewtonBotics
      </span>
      {showTag && (
        <span
          className={`rounded-[3px] border px-1.5 py-0.5 font-mono text-[10px] tracking-[0.08em] ${
            tone === "dark" ? "border-night-line-strong text-night-muted" : "border-line-strong text-ink-muted"
          }`}
        >
          LAB
        </span>
      )}
    </span>
  );
}

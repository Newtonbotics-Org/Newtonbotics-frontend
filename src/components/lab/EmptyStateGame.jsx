"use client";
import { useState } from "react";
import BlueprintPlaceholder from "@/components/lab/BlueprintPlaceholder";

/** Empty-state art for the listing pages: the robot mini game, with its status and a "waiting" line underneath. */
export default function EmptyStateGame({ label = "No news found · Jarvis is also waiting for the team to update", className = "" }) {
  const [status, setStatus] = useState("");
  return (
    <div className={`min-w-0 flex-col gap-2 ${className}`}>
      <BlueprintPlaceholder label={label} onStatus={setStatus} className="h-[240px] w-full rounded-md" />
      <span aria-live="polite" className="min-h-[1.5em] px-1 text-center font-mono text-[11px] uppercase tracking-[0.06em] text-signal-text">
        {status}
      </span>
      <span aria-hidden="true" className="px-1 text-center font-mono text-[11px] uppercase tracking-[0.06em] text-ink-muted">
        {label}
        <span className="nb-loading-dots">
          <span>.</span>
          <span>.</span>
          <span>.</span>
        </span>
      </span>
    </div>
  );
}

/** Presentation helpers shared by the Lab Spec redesign. */

const PROJECT_STATUS = {
  ongoing: { label: "Ongoing", chip: "nb-chip-signal" },
  completed: { label: "Completed", chip: "nb-chip-green" },
  upcoming: { label: "Upcoming", chip: "nb-chip-blue" },
  on_hold: { label: "On hold", chip: "nb-chip-amber" },
};

export function projectStatus(status) {
  return (
    PROJECT_STATUS[status] || {
      label: status ? status.replace(/_/g, " ") : "Project",
      chip: "nb-chip-outline",
    }
  );
}

const EVENT_TYPE_CHIP = {
  workshop: "nb-chip-blue",
  training: "nb-chip-blue",
  educational: "nb-chip-blue",
  competition: "nb-chip-signal",
  showcase: "nb-chip-signal",
  exhibition: "nb-chip-signal",
  seminar: "nb-chip-green",
  networking: "nb-chip-green",
  technical: "nb-chip-amber",
};

export function eventTypeChip(type) {
  return EVENT_TYPE_CHIP[type] || "nb-chip-outline";
}

export function titleCase(value) {
  if (!value) return "";
  return value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Combine an ISO date with an optional "HH:MM" time string. */
export function combineDateTime(date, time) {
  if (!date) return null;
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return null;
  if (typeof time === "string" && /^\d{1,2}:\d{2}/.test(time)) {
    const [h, m] = time.split(":").map(Number);
    d.setHours(h, m, 0, 0);
  }
  return d;
}

/** 24h "16:00" → "4:00 PM". Returns "" for missing values. */
export function formatClock(time) {
  if (typeof time !== "string" || !/^\d{1,2}:\d{2}/.test(time)) return "";
  const [h, m] = time.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${suffix}`;
}

/** Calendar-tile parts for a date: { month: "NOV", day: "13", weekday: "FRI" }. */
export function dateParts(date) {
  const d = date instanceof Date ? date : new Date(date);
  if (!date || Number.isNaN(d.getTime())) return { month: "TBA", day: "--", weekday: "" };
  return {
    month: d.toLocaleString("en-US", { month: "short" }).toUpperCase(),
    day: String(d.getDate()).padStart(2, "0"),
    weekday: d.toLocaleString("en-US", { weekday: "short" }).toUpperCase(),
  };
}

export function formatDate(date, opts = { day: "numeric", month: "short", year: "numeric" }) {
  const d = new Date(date);
  if (!date || Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-IN", opts);
}

/** Upcoming events first (soonest first), then everything else. */
export function sortUpcoming(events, now = new Date()) {
  const withStart = events.map((e) => ({ e, start: combineDateTime(e.startDate, e.startTime) }));
  return withStart
    .filter(({ e, start }) => start && start >= now && e.status !== "cancelled")
    .sort((a, b) => a.start - b.start)
    .map(({ e }) => e);
}

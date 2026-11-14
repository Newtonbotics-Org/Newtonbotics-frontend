/** B.Tech is 4 years. The academic year starts in August. */
export const ACADEMIC_YEAR_START_MONTH = 8;
export const BTECH_DURATION_YEARS = 4;
export const PASSING_YEAR_START = 2027;
export const PASSING_YEAR_END = 2037;
export const OTHER_ACADEMIC_YEAR = "other";

export const PASSING_YEARS = Array.from(
  { length: PASSING_YEAR_END - PASSING_YEAR_START + 1 },
  (_, i) => PASSING_YEAR_START + i
);

export function getCurrentAcademicStartYear(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(now);
  const date = Object.fromEntries(parts.map(({ type, value }) => [type, Number(value)]));
  return date.month > ACADEMIC_YEAR_START_MONTH ||
    (date.month === ACADEMIC_YEAR_START_MONTH && date.day >= 10)
    ? date.year
    : date.year - 1;
}

export function passingYearToAcademicStartYear(passingYear) {
  const year = Number(passingYear);
  return Number.isInteger(year) ? year - BTECH_DURATION_YEARS : null;
}

/** Passing 2027 in Aug 2026 → 4th year (admitted Aug 2023). */
export function passingYearToYearOfStudy(passingYear, now = new Date()) {
  const y = Number(passingYear);
  if (!Number.isInteger(y)) return null;
  const yearOfStudy =
    getCurrentAcademicStartYear(now) - y + BTECH_DURATION_YEARS + 1;
  if (yearOfStudy < 1 || yearOfStudy > 8) return null;
  return yearOfStudy;
}

export function yearOfStudyToPassingYear(yearOfStudy, now = new Date()) {
  const y = Number(yearOfStudy);
  if (!Number.isInteger(y) || y < 1 || y > 8) return "";
  return String(getCurrentAcademicStartYear(now) - y + BTECH_DURATION_YEARS + 1);
}

function yearOrdinal(n) {
  const v = n % 100;
  const suffix =
    v >= 11 && v <= 13 ? "th" : ["th", "st", "nd", "rd"][n % 10] || "th";
  return `${n}${suffix}`;
}

export function passingYearOptionLabel(passingYear, now = new Date()) {
  const yearOfStudy = passingYearToYearOfStudy(passingYear, now);
  if (!yearOfStudy) return String(passingYear);
  return `${passingYear} — ${yearOrdinal(yearOfStudy)} year`;
}

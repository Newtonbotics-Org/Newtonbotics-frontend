import { fetchApi } from "./api.js";

export function formatSubroles(subroles) {
  if (!Array.isArray(subroles) || !subroles.length) return null;
  const formatted = subroles
    .filter(Boolean)
    .map((subrole) => String(subrole).replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()));
  return formatted.length ? formatted.join(", ") : null;
}

export function getPersonDisplayName(person) {
  if (!person) return "Team Member";
  return (
    person.fullName ||
    `${person.firstName || ""} ${person.lastName || ""}`.trim() ||
    person.email ||
    "Team Member"
  );
}

export function getPersonDisplayRole(person) {
  if (!person) return "";
  const fromSubroles = formatSubroles(person.subroles);
  if (fromSubroles) return fromSubroles;
  if (person.specialization) return person.specialization;
  if (person.role) {
    return person.role.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  }
  return "";
}

/** President → Vice President → everyone else */
export function getLeadershipSortPriority(person) {
  if (!person) return 99;

  const subroles = (person.subroles || []).map((s) => String(s).toLowerCase());
  const roleText = getPersonDisplayRole(person).toLowerCase();
  const combined = `${roleText} ${subroles.join(" ")} ${(person.specialization || "").toLowerCase()}`;

  const isVicePresident =
    /\bvice[\s_-]*president\b/.test(combined) ||
    subroles.some((s) => s.includes("vice") && s.includes("president"));

  if (isVicePresident) return 1;

  const isPresident =
    /\bpresident\b/.test(combined) ||
    subroles.some((s) => s.includes("president") && !s.includes("vice"));

  if (isPresident) return 0;

  return 2;
}

export function sortLeadershipTeam(people = []) {
  const list = Array.isArray(people) ? [...people] : [];
  return list.sort((a, b) => {
    const priorityDiff = getLeadershipSortPriority(a) - getLeadershipSortPriority(b);
    if (priorityDiff !== 0) return priorityDiff;
    return getPersonDisplayName(a).localeCompare(getPersonDisplayName(b), undefined, {
      sensitivity: "base",
    });
  });
}

export function mapPersonToContactMember(person) {
  return {
    id: person._id || person.id || getPersonDisplayName(person),
    name: getPersonDisplayName(person),
    role: getPersonDisplayRole(person),
    email: (person.email || "").trim(),
  };
}

export async function fetchPublicTeamItems(path) {
  const res = await fetchApi(path, { next: { revalidate: 60 } });
  if (!res?.ok) return [];
  try {
    const data = await res.json();
    return data?.success ? data.data?.items || [] : [];
  } catch {
    return [];
  }
}

/** Leadership / core team — same source as the Team page leadership section */
export async function fetchLeadershipTeamForContact() {
  const items = await fetchPublicTeamItems("/public/leadership-team");
  return sortLeadershipTeam(items)
    .map(mapPersonToContactMember)
    .filter((member) => member.name);
}

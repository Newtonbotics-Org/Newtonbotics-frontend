import { API_BASE_URL } from "@/lib/api";
import TeamPageClient from "./TeamPageClient";

async function fetchTeamJson(path) {
  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data?.success ? data.data?.items || [] : [];
  } catch (err) {
    console.error(`Failed to fetch ${path}:`, err);
    return [];
  }
}

export default async function TeamPage() {
  const [leadershipTeam, teamMembers, mentors, researchers] = await Promise.all([
    fetchTeamJson("/public/leadership-team"),
    fetchTeamJson("/public/team-members?limit=100"),
    fetchTeamJson("/public/mentors"),
    fetchTeamJson("/public/researchers"),
  ]);

  return (
    <TeamPageClient
      leadershipTeam={leadershipTeam}
      teamMembers={teamMembers}
      mentors={mentors}
      researchers={researchers}
    />
  );
}

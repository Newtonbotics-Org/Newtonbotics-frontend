import { fetchApi } from "@/lib/api";
import TeamPageClient from "./TeamPageClient";

async function fetchTeamJson(path) {
  const res = await fetchApi(path, { next: { revalidate: 60 } });
  if (!res?.ok) return [];
  try {
    const data = await res.json();
    return data?.success ? data.data?.items || [] : [];
  } catch {
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

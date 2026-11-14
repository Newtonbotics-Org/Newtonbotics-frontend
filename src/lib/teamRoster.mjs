export function isAlumniMember(member) {
  return member.isAlumni ?? Number(member.yearOfStudy) >= 5;
}

export function splitTeamMembers(members) {
  const sorted = [...members].sort((a, b) => {
    const yearA = Number(a.yearOfStudy) >= 1 && Number(a.yearOfStudy) <= 4 ? Number(a.yearOfStudy) : 99;
    const yearB = Number(b.yearOfStudy) >= 1 && Number(b.yearOfStudy) <= 4 ? Number(b.yearOfStudy) : 99;
    return yearA - yearB;
  });
  return {
    active: sorted.filter((member) => !isAlumniMember(member)),
    alumni: sorted.filter(isAlumniMember),
  };
}

export function partitionTeamRoster(leadershipTeam, teamMembers) {
  const { active, alumni } = splitTeamMembers(teamMembers);
  const alumniById = new Map();
  [...alumni, ...leadershipTeam.filter(isAlumniMember)].forEach((member) => {
    alumniById.set(member.id || member._id || member.fullName, member);
  });
  return {
    leadership: leadershipTeam.filter((member) => !isAlumniMember(member)),
    activeMembers: active,
    alumni: [...alumniById.values()],
  };
}
function idOf(value) {
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (!value || typeof value !== "object") return "";
  return String(value._id || value.id || "");
}

export function isProjectTeamLeader(project, user) {
  const userId = idOf(user);
  if (!userId || !project || typeof project !== "object") return false;

  return idOf(project.teamLeaderId) === userId;
}

export function getProjectsLedByUser(projects, user) {
  if (!Array.isArray(projects) || !idOf(user)) return [];
  return projects.filter((project) => isProjectTeamLeader(project, user));
}
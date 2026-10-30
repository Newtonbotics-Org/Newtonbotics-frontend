import { API_BASE_URL } from "./api";

// Read-only contracts already consumed by /Projects and /Inventory/[id].
// No project or project-inventory mutation contract is available in this repo.
async function readProjects(path, signal) {
  if (!API_BASE_URL) {
    throw new Error(
      'Projects are unavailable. Set NEXT_PUBLIC_API_URL in .env.local and restart the dev server.'
    );
  }
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { cache: "no-store", signal });
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    throw new Error(
      `Cannot reach the backend at ${API_BASE_URL}. Check that your backend server is running.`
    );
  }
  if (!response.ok) throw new Error(response.status === 404 ? "Project not found." : "Unable to load projects. Please try again.");
  const body = await response.json();
  if (body?.success === false || !body?.data) throw new Error("Unable to load project data. Please try again.");
  return body.data;
}

export async function listInventoryProjects({ q = "", signal } = {}) {
  const query = new URLSearchParams({ limit: "100" });
  if (q.trim()) query.set("q", q.trim());
  const data = await readProjects(`/projects?${query}`, signal);
  if (!Array.isArray(data.projects)) throw new Error("The project list response is incomplete.");
  return data;
}

export async function getInventoryProject(id, { signal } = {}) {
  const data = await readProjects(`/projects/${encodeURIComponent(id)}`, signal);
  if (!data.project) throw new Error("Project not found.");
  return data.project;
}

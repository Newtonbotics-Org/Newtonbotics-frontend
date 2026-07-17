import { API_BASE_URL } from "./api";
import authService from "./auth";

async function safeParseJson(response) {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) return response.json();
  const text = await response.text();
  throw new Error(`Unexpected response (${response.status}): ${text.slice(0, 200)}`);
}

function toQuery(params = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    search.set(key, String(value));
  });
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export const RESOURCE_CATEGORIES = [
  { id: "drones", label: "Drones" },
  { id: "motors", label: "Motors" },
  { id: "robotics", label: "Robotics" },
  { id: "electronics", label: "Electronics" },
  { id: "programming", label: "Programming" },
  { id: "tools", label: "Tools" },
  { id: "other", label: "Other" },
];

export const RESOURCE_TYPES = [
  { id: "link", label: "Link" },
  { id: "image", label: "Image" },
  { id: "video", label: "Video" },
  { id: "document", label: "Document" },
];

const resourcesService = {
  async list({ resourceType, category, q, limit = 50, skip = 0 } = {}) {
    await authService.ensureValidToken();
    const query = toQuery({ resourceType, category, q, limit, skip });
    const response = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/resources${query}`);
    const data = await safeParseJson(response);
    if (!response.ok || data?.success === false) {
      throw new Error(data?.message || data?.error?.message || "Failed to load resources");
    }
    return data.data;
  },

  async create(payload) {
    await authService.ensureValidToken();
    const response = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/resources`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    const data = await safeParseJson(response);
    if (!response.ok || data?.success === false) {
      throw new Error(data?.message || data?.error?.message || "Failed to create resource");
    }
    return data.data.item;
  },

  async update(id, payload) {
    await authService.ensureValidToken();
    const response = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/resources/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    const data = await safeParseJson(response);
    if (!response.ok || data?.success === false) {
      throw new Error(data?.message || data?.error?.message || "Failed to update resource");
    }
    return data.data.item;
  },

  async remove(id) {
    await authService.ensureValidToken();
    const response = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/resources/${id}`, {
      method: "DELETE",
    });
    const data = await safeParseJson(response);
    if (!response.ok || data?.success === false) {
      throw new Error(data?.message || data?.error?.message || "Failed to delete resource");
    }
    return true;
  },
};

export default resourcesService;

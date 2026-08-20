import { SITE_URL } from "../lib/site";
import { getApiBaseUrl } from "../lib/api";

export const dynamic = "force-dynamic";

const STATIC_ROUTES = [
  { path: "/", changeFrequency: "weekly", priority: 1.0 },
  { path: "/DashBoard", changeFrequency: "weekly", priority: 1.0 },
  { path: "/aboutus", changeFrequency: "monthly", priority: 0.9 },
  { path: "/Projects", changeFrequency: "weekly", priority: 0.9 },
  { path: "/Events", changeFrequency: "weekly", priority: 0.8 },
  { path: "/News", changeFrequency: "daily", priority: 0.8 },
  { path: "/Gallery", changeFrequency: "weekly", priority: 0.7 },
  { path: "/contact", changeFrequency: "monthly", priority: 0.7 },
  { path: "/ourTeam", changeFrequency: "monthly", priority: 0.8 },
  { path: "/research-areas", changeFrequency: "monthly", priority: 0.8 },
  { path: "/Inventory", changeFrequency: "weekly", priority: 0.6 },
  { path: "/Resources", changeFrequency: "weekly", priority: 0.6 },
];

function entry(path, extras = {}) {
  return {
    url: `${SITE_URL}${path}`,
    lastModified: extras.lastModified || new Date(),
    changeFrequency: extras.changeFrequency || "weekly",
    priority: extras.priority ?? 0.7,
  };
}

async function fetchJson(url) {
  try {
    new URL(url);
    const res = await fetch(url, {
      cache: "no-store",
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data && data.success === false) return null;
    return data;
  } catch {
    return null;
  }
}

function collectIds(payload, listKeys = ["items", "projects", "data"]) {
  if (!payload) return [];
  const root = payload.data ?? payload;
  let list = [];
  if (Array.isArray(root)) list = root;
  else {
    for (const key of listKeys) {
      if (Array.isArray(root?.[key])) {
        list = root[key];
        break;
      }
    }
  }
  return list
    .map((item) => item?._id || item?.id || item?.slug)
    .filter(Boolean)
    .map(String);
}

async function dynamicRoutes() {
  const api = getApiBaseUrl();
  if (!api) return [];

  const routes = [];

  const [projects, events, news, researchAreas, equipment] = await Promise.all([
    fetchJson(`${api}/projects?limit=100`),
    fetchJson(`${api}/events?limit=100`),
    fetchJson(`${api}/news?limit=100`),
    fetchJson(`${api}/research-areas?limit=100`),
    fetchJson(`${api}/inventory/equipment?limit=100`),
  ]);

  for (const id of collectIds(projects, ["projects", "items"])) {
    routes.push(
      entry(`/Projects/${id}`, { changeFrequency: "weekly", priority: 0.7 })
    );
  }
  for (const id of collectIds(events)) {
    routes.push(
      entry(`/Events/${id}`, { changeFrequency: "weekly", priority: 0.6 })
    );
  }
  for (const id of collectIds(news)) {
    routes.push(
      entry(`/News/${id}`, { changeFrequency: "weekly", priority: 0.6 })
    );
  }
  for (const id of collectIds(researchAreas)) {
    routes.push(
      entry(`/research-areas/${id}`, {
        changeFrequency: "monthly",
        priority: 0.6,
      })
    );
  }
  for (const id of collectIds(equipment)) {
    routes.push(
      entry(`/Inventory/${id}`, { changeFrequency: "monthly", priority: 0.5 })
    );
  }

  return routes;
}

export default async function sitemap() {
  const staticEntries = STATIC_ROUTES.map((route) =>
    entry(route.path, {
      changeFrequency: route.changeFrequency,
      priority: route.priority,
    })
  );

  const dynamicEntries = await dynamicRoutes();
  return [...staticEntries, ...dynamicEntries];
}

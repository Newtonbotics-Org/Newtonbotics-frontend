/**
 * demoStore.js — mutable in-memory + sessionStorage demo inventory.
 * Only used when NEXT_PUBLIC_DEMO_MODE=true. Never touches real APIs.
 */

import {
  DEMO_CATEGORIES,
  DEMO_COMPONENT_REQUESTS,
  DEMO_EQUIPMENT,
  DEMO_PROJECTS,
  DEMO_PROJECT_INVENTORY,
} from "./demoData";
import { isDemoMode } from "./demoMode";

const KEYS = {
  equipment: "nb-demo-equipment",
  categories: "nb-demo-categories",
  projectInventory: "nb-demo-project-inventory",
  componentRequests: "nb-demo-component-requests",
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function read(key, fallback) {
  if (typeof window === "undefined") return clone(fallback);
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return clone(fallback);
    return JSON.parse(raw);
  } catch {
    return clone(fallback);
  }
}

function write(key, value) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore quota / private mode */
  }
}

export function getDemoEquipment() {
  if (!isDemoMode()) return [];
  return read(KEYS.equipment, DEMO_EQUIPMENT);
}

export function setDemoEquipment(items) {
  write(KEYS.equipment, items);
  return items;
}

export function getDemoEquipmentById(id) {
  return getDemoEquipment().find((item) => item._id === id || item.id === id) || null;
}

export function getDemoCategories() {
  if (!isDemoMode()) return [];
  return read(KEYS.categories, DEMO_CATEGORIES);
}

export function setDemoCategories(items) {
  write(KEYS.categories, items);
  return items;
}

export function getDemoProjects({ q = "", status, category } = {}) {
  if (!isDemoMode()) return [];
  let list = [...DEMO_PROJECTS];
  const query = q.trim().toLowerCase();
  if (query) {
    list = list.filter(
      (p) =>
        (p.title || "").toLowerCase().includes(query) ||
        (p.description || "").toLowerCase().includes(query) ||
        (p.category || "").toLowerCase().includes(query)
    );
  }
  if (status && status !== "all") list = list.filter((p) => p.status === status);
  if (category && category !== "all") list = list.filter((p) => p.category === category);
  return list;
}

export function getDemoProject(id) {
  if (!isDemoMode()) return null;
  return DEMO_PROJECTS.find((p) => p._id === id || p.id === id) || null;
}

export function getDemoProjectInventory(projectId) {
  if (!isDemoMode()) return [];
  const all = read(KEYS.projectInventory, DEMO_PROJECT_INVENTORY);
  return [...(all[projectId] || [])];
}

export function setDemoProjectInventory(projectId, items) {
  const all = read(KEYS.projectInventory, DEMO_PROJECT_INVENTORY);
  all[projectId] = items;
  write(KEYS.projectInventory, all);
  return items;
}

export function getDemoComponentRequests() {
  if (!isDemoMode()) return [];
  return read(KEYS.componentRequests, DEMO_COMPONENT_REQUESTS);
}

export function addDemoComponentRequest(request) {
  const created = {
    ...request,
    _id: `demo-request-${Date.now()}`,
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  const requests = [created, ...getDemoComponentRequests()];
  write(KEYS.componentRequests, requests);
  return requests;
}

export function setDemoComponentRequestStatus(requestId, status) {
  if (!isDemoMode() || !["pending", "approved", "rejected"].includes(status)) {
    return getDemoComponentRequests();
  }
  const requests = getDemoComponentRequests().map((request) =>
    request._id === requestId ? { ...request, status } : request
  );
  write(KEYS.componentRequests, requests);
  return requests;
}

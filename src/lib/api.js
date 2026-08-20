/**
 * Backend API base URL from environment (.env).
 * Set NEXT_PUBLIC_API_URL to match your server, including /api
 * e.g. http://localhost:3006/api or https://your-backend.example.com/api
 */
const BUILD_FETCH_TIMEOUT_MS = 8000;

function normalizeApiBaseUrl(raw) {
  let value = String(raw).trim().replace(/^["']|["']$/g, "").trim();
  if (!value) return "";

  if (!/^https?:\/\//i.test(value)) {
    value = `https://${value}`;
  }

  value = value.replace(/\/+$/, "");
  if (!/\/api$/i.test(value)) {
    value += "/api";
  }

  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return "";
    return value;
  } catch {
    return "";
  }
}

export function getApiBaseUrl() {
  const raw = process.env.NEXT_PUBLIC_API_URL?.trim();

  if (!raw) {
    console.error(
      "NEXT_PUBLIC_API_URL is not set. " +
        "Add it to match your backend server, e.g. NEXT_PUBLIC_API_URL=http://localhost:YOUR_PORT/api"
    );
    return "";
  }

  const normalized = normalizeApiBaseUrl(raw);
  if (!normalized) {
    console.error("NEXT_PUBLIC_API_URL is not a valid URL.");
    return "";
  }

  return normalized;
}

export const API_BASE_URL = getApiBaseUrl();

export function isApiBaseUrlConfigured() {
  return Boolean(API_BASE_URL);
}

/** Server fetch that must not hang a Vercel/Next production build. */
export async function fetchApi(path, options = {}) {
  if (!API_BASE_URL) return null;

  const suffix = path.startsWith("/") ? path : `/${path}`;
  const url = `${API_BASE_URL}${suffix}`;

  try {
    new URL(url);
  } catch {
    console.error("Skipping fetch; invalid API URL for path:", path);
    return null;
  }

  const { timeoutMs = BUILD_FETCH_TIMEOUT_MS, ...fetchOptions } = options;

  try {
    const res = await fetch(url, {
      ...fetchOptions,
      signal: fetchOptions.signal ?? AbortSignal.timeout(timeoutMs),
    });
    return res;
  } catch (err) {
    console.error(`Failed to fetch ${path}:`, err);
    return null;
  }
}

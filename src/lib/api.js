"use strict";

/**
 * Shared API transport for the NewtonBotics frontend.
 *
 * Backend requests use NEXT_PUBLIC_API_URL. Same-origin Next.js route handlers
 * should use sameOriginRequest so browser cookies are sent only to this app.
 */
const BUILD_FETCH_TIMEOUT_MS = 8000;
const DEFAULT_REQUEST_TIMEOUT_MS = 15000;

function normalizeApiBaseUrl(raw) {
  let value = String(raw || "").trim().replace(/^[\"']|[\"']$/g, "").trim();
  if (!value) return "";

  if (!/^https?:\\/\\//i.test(value)) value = "https://" + value;
  value = value.replace(/\\/+$/, "");
  if (!/\\/api$/i.test(value)) value += "/api";

  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return "";
    return value;
  } catch {
    return "";
  }
}

export function getApiBaseUrl() {
  const raw = process.env.NEXT_PUBLIC_API_URL;
  if (!raw) {
    if (typeof window !== "undefined") {
      console.error("NEXT_PUBLIC_API_URL is not configured.");
    }
    return "";
  }

  const normalized = normalizeApiBaseUrl(raw);
  if (!normalized && typeof window !== "undefined") {
    console.error("NEXT_PUBLIC_API_URL is not a valid HTTP(S) URL.");
  }
  return normalized;
}

export const API_BASE_URL = getApiBaseUrl();

export function isApiBaseUrlConfigured() {
  return Boolean(API_BASE_URL);
}

function resolveRequestUrl(input) {
  const value = String(input || "").trim();
  if (/^https?:\\/\\//i.test(value)) return value;
  if (!API_BASE_URL) {
    throw new Error(
      "Backend API is not configured. Set NEXT_PUBLIC_API_URL and restart the application."
    );
  }
  return API_BASE_URL + (value.startsWith("/") ? value : "/" + value);
}

/**
 * Perform a backend request with consistent URL resolution, JSON headers,
 * timeout handling, and AbortSignal support. Returns the raw Response so
 * feature services can preserve their existing response contracts.
 */
export async function apiRequest(input, options = {}) {
  const {
    timeoutMs = DEFAULT_REQUEST_TIMEOUT_MS,
    signal,
    ...fetchOptions
  } = options;
  const headers = new Headers(fetchOptions.headers || {});

  if (
    fetchOptions.body !== undefined &&
    fetchOptions.body !== null &&
    typeof fetchOptions.body === "string" &&
    !headers.has("Content-Type")
  ) {
    headers.set("Content-Type", "application/json");
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort(new Error("Request timed out"));
  }, timeoutMs);
  const forwardAbort = () => controller.abort(signal.reason);

  if (signal) {
    if (signal.aborted) controller.abort(signal.reason);
    else signal.addEventListener("abort", forwardAbort, { once: true });
  }

  try {
    return await fetch(resolveRequestUrl(input), {
      ...fetchOptions,
      headers,
      signal: controller.signal,
    });
  } catch (error) {
    if (controller.signal.aborted && !(signal && signal.aborted)) {
      const timeoutError = new Error("Request timed out after " + timeoutMs + "ms");
      timeoutError.name = "TimeoutError";
      throw timeoutError;
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
    if (signal) signal.removeEventListener("abort", forwardAbort);
  }
}

/** Request a same-origin Next.js route handler (for example, the auth BFF). */
export function sameOriginRequest(path, options = {}) {
  if (typeof window === "undefined") {
    throw new Error("sameOriginRequest can only be used in the browser.");
  }

  const url = new URL(path, window.location.origin);
  if (url.origin !== window.location.origin) {
    throw new Error("Same-origin requests cannot target another origin.");
  }

  return apiRequest(url.toString(), {
    credentials: "same-origin",
    ...options,
  });
}

/** Server-side fetch used by metadata/data helpers; build failures degrade safely. */
export async function fetchApi(path, options = {}) {
  if (!API_BASE_URL) return null;
  const { timeoutMs = BUILD_FETCH_TIMEOUT_MS, ...fetchOptions } = options;

  try {
    return await apiRequest(path, { ...fetchOptions, timeoutMs });
  } catch (error) {
    console.error("Failed to fetch API path " + path + ":", error);
    return null;
  }
}

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { API_BASE_URL } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const REFRESH_COOKIE = "nb_refresh_token";
const REFRESH_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

function cookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/auth/session",
    maxAge: REFRESH_COOKIE_MAX_AGE,
  };
}

function clearRefreshCookie(response) {
  response.cookies.set(REFRESH_COOKIE, "", {
    ...cookieOptions(),
    maxAge: 0,
    expires: new Date(0),
  });
  return response;
}

function isSameOriginRequest(request) {
  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite === "cross-site") return false;

  const origin = request.headers.get("origin");
  if (!origin) return true;

  const requestHost = request.headers.get("x-forwarded-host") || request.headers.get("host");
  try {
    return Boolean(requestHost) && new URL(origin).host === requestHost;
  } catch {
    return false;
  }
}

async function readBackendJson(response) {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) return response.json();
  const text = await response.text();
  return {
    success: false,
    message: text.slice(0, 300) || "Authentication service returned an invalid response.",
  };
}

function sanitizeTokens(payload) {
  const safePayload = { ...payload };
  if (payload?.data && typeof payload.data === "object") {
    safePayload.data = { ...payload.data };
    if (payload.data.tokens) {
      safePayload.data.tokens = {
        accessToken: payload.data.tokens.accessToken,
      };
    }
  }
  if (payload?.tokens) {
    safePayload.tokens = { accessToken: payload.tokens.accessToken };
  }
  return safePayload;
}

function tokenPair(payload) {
  return payload?.data?.tokens || payload?.tokens || null;
}

async function callBackend(endpoint, body) {
  if (!API_BASE_URL) {
    return {
      response: new Response(null, { status: 503 }),
      payload: { success: false, message: "Backend API is not configured." },
    };
  }

  const response = await fetch(API_BASE_URL + "/auth/" + endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body || {}),
    cache: "no-store",
  });
  return { response, payload: await readBackendJson(response) };
}

export async function POST(request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json(
      { success: false, message: "Cross-origin session requests are not allowed." },
      { status: 403 }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, message: "A valid JSON request body is required." },
      { status: 400 }
    );
  }

  const action = body?.action;
  if (!["login", "register", "refresh", "migrate", "logout"].includes(action)) {
    return NextResponse.json(
      { success: false, message: "Unsupported session action." },
      { status: 400 }
    );
  }

  const cookieStore = await cookies();
  const cookieRefreshToken = cookieStore.get(REFRESH_COOKIE)?.value;
  const refreshToken =
    action === "migrate" ? body?.refreshToken : cookieRefreshToken;

  if (action === "logout") {
    try {
      if (cookieRefreshToken && API_BASE_URL) {
        await callBackend("logout", { refreshToken: cookieRefreshToken });
      }
    } catch (error) {
      console.error("Backend logout failed; clearing the browser session:", error);
    }

    return clearRefreshCookie(NextResponse.json({ success: true }));
  }

  if ((action === "refresh" || action === "migrate") && !refreshToken) {
    return clearRefreshCookie(
      NextResponse.json(
        { success: false, message: "No active refresh session." },
        { status: 401 }
      )
    );
  }

  const endpoint = action === "refresh" || action === "migrate" ? "refresh" : action;
  const credentials =
    action === "login" ? body.credentials :
    action === "register" ? body.userData :
    { refreshToken };

  if (!credentials || typeof credentials !== "object" || Array.isArray(credentials)) {
    return NextResponse.json(
      { success: false, message: "Authentication credentials are required." },
      { status: 400 }
    );
  }

  try {
    const { response, payload } = await callBackend(endpoint, credentials);

    if (!response.ok || payload?.success === false) {
      const errorResponse = NextResponse.json(payload, {
        status: response.status || 502,
        headers: { "Cache-Control": "no-store" },
      });
      if (
        (action === "refresh" || action === "migrate") &&
        [401, 403].includes(response.status)
      ) {
        return clearRefreshCookie(errorResponse);
      }
      return errorResponse;
    }

    const tokens = tokenPair(payload);
    if (!tokens?.accessToken) {
      return NextResponse.json(
        { success: false, message: "Authentication service did not return an access token." },
        { status: 502 }
      );
    }

    const nextRefreshToken = tokens.refreshToken || refreshToken;
    if (!nextRefreshToken) {
      return NextResponse.json(
        { success: false, message: "Authentication service did not return a refresh token." },
        { status: 502 }
      );
    }

    const sessionResponse = NextResponse.json(sanitizeTokens(payload), {
      status: response.status,
      headers: { "Cache-Control": "no-store" },
    });
    sessionResponse.cookies.set(REFRESH_COOKIE, nextRefreshToken, cookieOptions());
    return sessionResponse;
  } catch (error) {
    console.error("Authentication session request failed:", error);
    return NextResponse.json(
      { success: false, message: "Unable to reach the authentication service." },
      { status: 502 }
    );
  }
}

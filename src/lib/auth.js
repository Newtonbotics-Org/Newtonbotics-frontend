// Authentication service for NewtonBotics Frontend.
//
// Access tokens are deliberately kept in memory only. Refresh tokens are stored
// by the same-origin /api/auth/session route in an HttpOnly cookie.
import { API_BASE_URL, apiRequest, sameOriginRequest } from "./api";

class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

class AuthService {
  constructor() {
    this.baseURL = API_BASE_URL ? `${API_BASE_URL}/auth` : "";
    this.accessToken = null;
    this.user = null;
    this.refreshPromise = null;
    this.restorePromise = null;
  }

  async parseJsonResponse(response) {
    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) return response.json();

    const body = (await response.text()).slice(0, 300);
    throw new Error(
      `Unexpected response (${response.status} ${response.statusText}). Body: ${body}`
    );
  }

  async requestAuth(endpoint, body) {
    let response;
    try {
      response = await apiRequest(`${this.baseURL}/${endpoint}`, {
        method: "POST",
        body: JSON.stringify(body || {}),
      });
    } catch (error) {
      if (error?.name === "TypeError" || error?.name === "TimeoutError") {
        throw new Error("Unable to reach authentication server. Check API URL and network connectivity.");
      }
      throw error;
    }

    const data = await this.parseJsonResponse(response);
    if (!response.ok || data?.success === false) {
      throw new ApiError(
        data?.message || data?.error?.message || data?.error || "Authentication request failed",
        response.status,
        data
      );
    }
    return data;
  }

  async requestSession(action, payload = {}) {
    let response;
    try {
      response = await sameOriginRequest("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...payload }),
        cache: "no-store",
      });
    } catch (error) {
      if (error?.name === "TypeError" || error?.name === "TimeoutError") {
        throw new Error("Unable to reach the session service. Check your connection and try again.");
      }
      throw error;
    }

    const data = await this.parseJsonResponse(response);
    if (!response.ok || data?.success === false) {
      throw new ApiError(
        data?.message || data?.error?.message || "Session request failed",
        response.status,
        data
      );
    }
    return data;
  }

  setAuthData(tokens, user) {
    if (!tokens?.accessToken) {
      throw new Error("Authentication service did not return an access token.");
    }
    this.accessToken = tokens.accessToken;
    if (user !== undefined) this.user = user;
  }

  clearAuthData() {
    this.accessToken = null;
    this.user = null;
  }

  getCurrentUser() {
    return this.user;
  }

  isAuthenticated() {
    return Boolean(this.accessToken);
  }

  getAccessToken() {
    return this.accessToken;
  }

  async requestResetOtp(email) {
    return this.requestAuth("forgot-password-otp", { email });
  }

  async verifyResetOtp(payload) {
    return this.requestAuth("verify-reset-otp", payload);
  }

  async resetPasswordWithOtp(token, newPassword) {
    return this.requestAuth("reset-password-otp", { token, newPassword });
  }

  async register(userData) {
    const data = await this.requestSession("register", { userData });
    this.setAuthData(data.data?.tokens, data.data?.user);
    return data;
  }

  async login(credentials) {
    const data = await this.requestSession("login", { credentials });
    this.setAuthData(data.data?.tokens, data.data?.user);
    return data;
  }

  /**
   * Refresh is serialized. Concurrent 401 responses share one refresh request,
   * avoiding refresh-token rotation races. The browser never receives the
   * refresh token itself.
   */
  async refreshTokens() {
    if (this.refreshPromise) return this.refreshPromise;

    this.refreshPromise = (async () => {
      try {
        const data = await this.requestSession("refresh");
        const tokens = data.data?.tokens || data.tokens;
        this.setAuthData(tokens, data.data?.user || this.user);
        return data;
      } catch (error) {
        this.clearAuthData();
        throw error;
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  /**
   * Upgrade users from the previous localStorage-token implementation.
   * The legacy refresh token is exchanged once for an HttpOnly cookie and
   * removed from localStorage immediately after a successful exchange.
   */
  async restoreSession() {
    if (this.restorePromise) return this.restorePromise;

    this.restorePromise = this.restoreSessionOnce();
    try {
      return await this.restorePromise;
    } finally {
      this.restorePromise = null;
    }
  }

  async restoreSessionOnce() {
    if (typeof window === "undefined") return false;

    const legacyRefreshToken = window.localStorage.getItem("nb_refresh_token");
    const legacyAccessToken = window.localStorage.getItem("nb_access_token");

    try {
      if (legacyRefreshToken) {
        const migrated = await this.requestSession("migrate", { refreshToken: legacyRefreshToken });
        this.setAuthData(migrated.data?.tokens, migrated.data?.user);
        window.localStorage.removeItem("nb_refresh_token");
        window.localStorage.removeItem("nb_access_token");
        window.localStorage.removeItem("nb_user");
      } else if (legacyAccessToken) {
        // Access tokens alone cannot restore a session securely.
        window.localStorage.removeItem("nb_access_token");
        window.localStorage.removeItem("nb_user");
      }

      if (!this.accessToken) await this.refreshTokens();
      const profile = await this.getCurrentUserProfile();
      return Boolean(profile?.success && profile.data?.user);
    } catch (error) {
      this.clearAuthData();
      if (legacyRefreshToken) {
        window.localStorage.removeItem("nb_refresh_token");
        window.localStorage.removeItem("nb_access_token");
        window.localStorage.removeItem("nb_user");
      }
      if (error?.status !== 401 && error?.status !== 403) {
        console.error("Session restoration failed:", error);
      }
      return false;
    }
  }

  async makeAuthenticatedRequest(url, options = {}, requestOptions = {}) {
    const { skipRefreshOn401 = false } = requestOptions;

    if (!this.accessToken || this.isTokenExpired()) {
      await this.refreshTokens();
    }

    const send = () => {
      const headers = new Headers(options.headers || {});
      headers.set("Authorization", `Bearer ${this.accessToken}`);
      if (
        options.body !== undefined &&
        options.body !== null &&
        typeof options.body === "string" &&
        !headers.has("Content-Type")
      ) {
        headers.set("Content-Type", "application/json");
      }
      return apiRequest(url, { ...options, headers });
    };

    let response = await send();
    if (response.status !== 401 || skipRefreshOn401) return response;

    await this.refreshTokens();
    response = await send();
    if (response.status === 401) this.clearAuthData();
    return response;
  }

  async logout() {
    try {
      await this.requestSession("logout");
    } finally {
      this.clearAuthData();
    }
  }

  async forgotPassword(email) {
    return this.requestAuth("forgot-password", { email });
  }

  async resetPassword(token, newPassword) {
    return this.requestAuth("reset-password", { token, newPassword });
  }

  async verifyEmail(token) {
    const response = await apiRequest(
      `${this.baseURL}/verify-email/${encodeURIComponent(token)}`,
      { method: "GET" }
    );
    const data = await this.parseJsonResponse(response);
    if (!response.ok || data?.success === false) {
      throw new ApiError(
        data?.message || "Email verification failed",
        response.status,
        data
      );
    }
    return data;
  }

  async getCurrentUserProfile() {
    const response = await this.makeAuthenticatedRequest(`${this.baseURL}/me`);
    const data = await this.parseJsonResponse(response);
    if (!response.ok || data?.success === false) {
      throw new ApiError(data?.message || "Failed to fetch user profile", response.status, data);
    }
    if (data.success) this.user = data.data?.user || null;
    return data;
  }

  async updateProfile(profileData) {
    const response = await this.makeAuthenticatedRequest(`${API_BASE_URL}/users/profile`, {
      method: "PUT",
      body: JSON.stringify(profileData),
    });
    const data = await this.parseJsonResponse(response);
    if (!response.ok || data?.success === false) {
      throw new ApiError(
        data?.message || data?.error?.message || "Profile update failed",
        response.status,
        data
      );
    }
    if (data.success) this.user = data.data?.user || this.user;
    return data;
  }

  async getMyDashboard() {
    const response = await this.makeAuthenticatedRequest(`${API_BASE_URL}/users/dashboard`, {
      method: "GET",
    });
    const data = await this.parseJsonResponse(response);
    if (!response.ok || data?.success === false) {
      throw new ApiError(
        data?.message || data?.error?.message || "Failed to fetch dashboard",
        response.status,
        data
      );
    }
    return data;
  }

  async changePassword(currentPassword, newPassword) {
    const response = await this.makeAuthenticatedRequest(
      `${this.baseURL}/change-password`,
      {
        method: "POST",
        body: JSON.stringify({ currentPassword, newPassword }),
      },
      { skipRefreshOn401: true }
    );
    const data = await this.parseJsonResponse(response);
    if (!response.ok || data?.success === false) {
      throw new ApiError(
        data?.message || data?.error?.message || "Password change failed",
        response.status,
        data
      );
    }
    return data;
  }

  isTokenExpired() {
    if (!this.accessToken) return true;
    try {
      const encoded = this.accessToken.split(".")[1];
      if (!encoded) return true;
      const normalized = encoded.replace(/-/g, "+").replace(/_/g, "/");
      const payload = JSON.parse(atob(normalized));
      return !payload.exp || payload.exp <= Date.now() / 1000;
    } catch {
      return true;
    }
  }

  async ensureValidToken() {
    if (this.isTokenExpired()) await this.refreshTokens();
  }
}

const authService = new AuthService();
export default authService;

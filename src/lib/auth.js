// Authentication service for NewtonBotics Frontend
import { API_BASE_URL } from './api';

class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

class AuthService {
  constructor() {
    this.baseURL = `${API_BASE_URL}/auth`;
    this.accessToken = null;
    this.refreshToken = null;
    this.user = null;
    
    // Initialize tokens from localStorage
    if (typeof window !== 'undefined') {
      this.accessToken = localStorage.getItem('nb_access_token');
      this.refreshToken = localStorage.getItem('nb_refresh_token');
      this.user = JSON.parse(localStorage.getItem('nb_user') || 'null');
    }
  }

  // ---------------------- OTP-BASED RESET FLOW ----------------------
  // Step 1: Request OTP
  async requestResetOtp(email) {
    try {
      const response = await fetch(`${this.baseURL}/forgot-password-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await this.parseJsonResponse(response);

      if (!response.ok || data?.success === false) {
        const message = data?.message || 'Failed to send OTP';
        throw new ApiError(message, response.status, data);
      }

      // When Redis is disabled, backend can return { data: { otpToken } }
      return data;
    } catch (error) {
      if (error?.message && error.message.includes('Failed to fetch')) {
        throw new Error('Unable to reach authentication server. Check API URL and CORS.');
      }
      throw error;
    }
  }

  // Step 2: Verify OTP → returns short-lived reset token
  async verifyResetOtp(payload) {
    // payload: { email, otp, otpToken? }
    try {
      const response = await fetch(`${this.baseURL}/verify-reset-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await this.parseJsonResponse(response);

      if (!response.ok || data?.success === false) {
        const message = data?.message || 'OTP verification failed';
        throw new ApiError(message, response.status, data);
      }

      return data; // expect data.data.token
    } catch (error) {
      if (error?.message && error.message.includes('Failed to fetch')) {
        throw new Error('Unable to reach authentication server. Check API URL and CORS.');
      }
      throw error;
    }
  }

  // Step 3: Reset password using short-lived reset token
  async resetPasswordWithOtp(token, newPassword) {
    try {
      const response = await fetch(`${this.baseURL}/reset-password-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await this.parseJsonResponse(response);

      if (!response.ok || data?.success === false) {
        const message = data?.message || 'Password reset failed';
        throw new ApiError(message, response.status, data);
      }

      return data;
    } catch (error) {
      if (error?.message && error.message.includes('Failed to fetch')) {
        throw new Error('Unable to reach authentication server. Check API URL and CORS.');
      }
      throw error;
    }
  }

  // Parse JSON safely; if server returns HTML or non-JSON, show a helpful error
  async parseJsonResponse(response) {
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      return response.json();
    }
    const text = await response.text();
    const snippet = (text || '').toString().slice(0, 300);
    const statusText = `${response.status} ${response.statusText}`.trim();
    throw new Error(`Unexpected response (${statusText}). Body: ${snippet}`);
  }

  // Set tokens and user data
  setAuthData(tokens, user) {
    this.accessToken = tokens.accessToken;
    this.refreshToken = tokens.refreshToken;
    this.user = user;
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('nb_access_token', tokens.accessToken);
      localStorage.setItem('nb_refresh_token', tokens.refreshToken);
      localStorage.setItem('nb_user', JSON.stringify(user));
    }
  }

  // Clear authentication data
  clearAuthData() {
    this.accessToken = null;
    this.refreshToken = null;
    this.user = null;
    
    if (typeof window !== 'undefined') {
      localStorage.removeItem('nb_access_token');
      localStorage.removeItem('nb_refresh_token');
      localStorage.removeItem('nb_user');
    }
  }

  // Get current user
  getCurrentUser() {
    return this.user;
  }

  // Check if user is authenticated
  isAuthenticated() {
    return !!this.accessToken;
  }

  // Get access token
  getAccessToken() {
    return this.accessToken;
  }

  // Make authenticated request
  // requestOptions: { skipRefreshOn401?: boolean }
  async makeAuthenticatedRequest(url, options = {}, requestOptions = {}) {
    const { skipRefreshOn401 = false } = requestOptions;
    if (!this.accessToken) {
      throw new Error('No access token available');
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 401) {
      // Some endpoints (e.g., change-password wrong current password) intentionally return 401.
      // In such cases we must not auto-refresh and retry; surface the 401 to caller.
      if (skipRefreshOn401) {
        return response;
      }
      // Token expired, try to refresh
      try {
        await this.refreshTokens();
        // Retry the request with new token
        return this.makeAuthenticatedRequest(url, options, requestOptions);
      } catch (error) {
        this.clearAuthData();
        throw new Error('Authentication failed');
      }
    }

    return response;
  }

  // User Registration
  async register(userData) {
    try {
      const response = await fetch(`${this.baseURL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await this.parseJsonResponse(response);

      if (!response.ok) {
        const serverMessage = data?.message || data?.error?.message || data?.error || 'Registration failed';
        throw new ApiError(serverMessage, response.status, data);
      }

      if (data.success) {
        this.setAuthData(data.data.tokens, data.data.user);
      }

      return data;
    } catch (error) {
      // Provide clearer message for common network/CORS issues
      if (error?.message && error.message.includes('Failed to fetch')) {
        throw new Error('Unable to reach authentication server. Check API URL and CORS.');
      }
      throw error;
    }
  }

  // User Login
  async login(credentials) {
    try {
      const response = await fetch(`${this.baseURL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await this.parseJsonResponse(response);

      if (!response.ok) {
        const serverMessage = data?.message || data?.error?.message || data?.error || 'Login failed';
        throw new ApiError(serverMessage, response.status, data);
      }

      if (data.success) {
        this.setAuthData(data.data.tokens, data.data.user);
      }

      return data;
    } catch (error) {
      if (error?.message && error.message.includes('Failed to fetch')) {
        throw new Error('Unable to reach authentication server. Check API URL and CORS.');
      }
      throw error;
    }
  }

  // Token Refresh
  async refreshTokens() {
    try {
      if (!this.refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await fetch(`${this.baseURL}/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refreshToken: this.refreshToken,
        }),
      });

      const data = await this.parseJsonResponse(response);

      if (!response.ok) {
        throw new Error(data.message || 'Token refresh failed');
      }

      if (data.success) {
        this.setAuthData(data.data.tokens, this.user);
      }

      return data;
    } catch (error) {
      this.clearAuthData();
      throw error;
    }
  }

  // User Logout
  async logout() {
    try {
      if (this.refreshToken) {
        await fetch(`${this.baseURL}/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            refreshToken: this.refreshToken,
          }),
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.clearAuthData();
    }
  }

  // Forgot Password
  async forgotPassword(email) {
    try {
      const response = await fetch(`${this.baseURL}/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await this.parseJsonResponse(response);

      if (!response.ok) {
        throw new Error(data.message || 'Password reset request failed');
      }

      return data;
    } catch (error) {
      throw error;
    }
  }

  // Reset Password
  async resetPassword(token, newPassword) {
    try {
      const response = await fetch(`${this.baseURL}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          newPassword,
        }),
      });

      const data = await this.parseJsonResponse(response);

      if (!response.ok) {
        throw new Error(data.message || 'Password reset failed');
      }

      return data;
    } catch (error) {
      throw error;
    }
  }

  // Email Verification
  async verifyEmail(token) {
    try {
      const response = await fetch(`${this.baseURL}/verify-email/${token}`, {
        method: 'GET',
      });

      const data = await this.parseJsonResponse(response);

      if (!response.ok) {
        throw new Error(data.message || 'Email verification failed');
      }

      return data;
    } catch (error) {
      throw error;
    }
  }

  // Get Current User Profile
  async getCurrentUserProfile() {
    try {
      console.log('[AuthService] Calling /me endpoint...');
      const response = await this.makeAuthenticatedRequest(`${this.baseURL}/me`);
      const data = await this.parseJsonResponse(response);

      console.log('[AuthService] /me response status:', response.status);
      console.log('[AuthService] /me response data:', data);

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch user profile');
      }

      if (data.success) {
        console.log('[AuthService] User data from API:', data.data.user);
        console.log('[AuthService] User subroles from API:', data.data.user?.subroles);
        this.user = data.data.user;
        localStorage.setItem('nb_user', JSON.stringify(data.data.user));
        
        // Verify what was stored
        const stored = JSON.parse(localStorage.getItem('nb_user') || 'null');
        console.log('[AuthService] Stored user in localStorage:', stored);
        console.log('[AuthService] Stored subroles:', stored?.subroles);
      }

      return data;
    } catch (error) {
      console.error('[AuthService] Error in getCurrentUserProfile:', error);
      throw error;
    }
  }

  // Update User Profile
  async updateProfile(profileData) {
    try {
      // New endpoint: PUT /api/users/profile
      const response = await this.makeAuthenticatedRequest(`${API_BASE_URL}/users/profile`, {
        method: 'PUT',
        body: JSON.stringify(profileData),
      });

      const data = await this.parseJsonResponse(response);

      if (!response.ok) {
        const serverMessage = data?.message || data?.error?.message || data?.error || 'Profile update failed';
        throw new ApiError(serverMessage, response.status, data);
      }

      if (data.success) {
        this.user = data.data.user;
        if (typeof window !== 'undefined') {
          localStorage.setItem('nb_user', JSON.stringify(data.data.user));
        }
      }

      return data;
    } catch (error) {
      if (error?.message && error.message.includes('Failed to fetch')) {
        throw new Error('Unable to reach authentication server. Check API URL and CORS.');
      }
      throw error;
    }
  }

  // Get current user's dashboard activity summary
  async getMyDashboard() {
    try {
      // Primary: current user endpoint
      const primaryUrl = `${API_BASE_URL}/users/dashboard`;
      console.debug('[AuthService] Fetching dashboard (primary):', primaryUrl);
      const response = await this.makeAuthenticatedRequest(primaryUrl, { method: 'GET' });
      console.debug('[AuthService] Primary dashboard response status:', response.status);
      const data = await this.parseJsonResponse(response);
      if (!response.ok) {
        // Log a small snippet to aid debugging
        const message = data?.message || data?.error?.message || data?.error;
        console.error('[AuthService] Dashboard fetch failed:', {
          status: response.status,
          message,
        });
      } else {
        console.debug('[AuthService] Dashboard fetch success');
      }
      if (!response.ok) {
        const serverMessage = data?.message || data?.error?.message || data?.error || 'Failed to fetch dashboard';
        throw new ApiError(serverMessage, response.status, data);
      }
      return data;
    } catch (error) {
      if (error?.message && error.message.includes('Failed to fetch')) {
        throw new Error('Unable to reach server. Check API URL and CORS.');
      }
      console.error('[AuthService] getMyDashboard error:', error);
      throw error;
    }
  }

  // Change Password
  async changePassword(currentPassword, newPassword) {
    try {
      const response = await this.makeAuthenticatedRequest(`${this.baseURL}/change-password`, {
        method: 'POST',
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      }, { skipRefreshOn401: true });

      const data = await this.parseJsonResponse(response);

      if (!response.ok) {
        const serverMessage = data?.message || data?.error?.message || data?.error || 'Password change failed';
        throw new ApiError(serverMessage, response.status, data);
      }

      return data;
    } catch (error) {
      if (error?.message && error.message.includes('Failed to fetch')) {
        throw new Error('Unable to reach authentication server. Check API URL and CORS.');
      }
      throw error;
    }
  }

  // Check if token is expired
  isTokenExpired() {
    if (!this.accessToken) return true;
    
    try {
      const payload = JSON.parse(atob(this.accessToken.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp < currentTime;
    } catch (error) {
      return true;
    }
  }

  // Auto-refresh token if needed
  async ensureValidToken() {
    if (this.isTokenExpired() && this.refreshToken) {
      try {
        await this.refreshTokens();
      } catch (error) {
        this.clearAuthData();
        throw error;
      }
    }
  }
}

// Create singleton instance
const authService = new AuthService();

export default authService;

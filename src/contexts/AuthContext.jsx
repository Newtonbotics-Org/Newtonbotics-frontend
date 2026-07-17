"use client";

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import authService from '../lib/auth';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  // Initialize authentication state
  useEffect(() => {
    const initAuth = async () => {
      try {
        setIsLoading(true);
        const currentUser = authService.getCurrentUser();
        const authenticated = authService.isAuthenticated();

        if (authenticated && currentUser) {
          setUser(currentUser);
          setIsAuthenticated(true);
          
          // Check if token is expired and refresh if needed
          if (authService.isTokenExpired()) {
            await authService.refreshTokens();
            const refreshedUser = authService.getCurrentUser();
            setUser(refreshedUser);
          } else {
            // Refresh user profile to get latest data including subroles
            try {
              const profileResponse = await authService.getCurrentUserProfile();
              if (profileResponse.success && profileResponse.data?.user) {
                setUser(profileResponse.data.user);
              }
            } catch (profileError) {
              console.error('Failed to refresh user profile on init:', profileError);
              // Continue with existing user data if refresh fails
            }
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        authService.clearAuthData();
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  // Login function
  const login = useCallback(async (credentials) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await authService.login(credentials);
      
      if (response.success) {
        setUser(response.data.user);
        setIsAuthenticated(true);
        router.push('/DashBoard');
        return { success: true };
      }
    } catch (error) {
      // Map status-specific auth errors
      if (error?.status === 401) {
        setError('Invalid email or password');
        return { success: false, error: 'Invalid email or password', code: 401 };
      }
      if (error?.status === 403) {
        setError('Your account is deactivated. Contact admin.');
        return { success: false, error: 'Your account is deactivated. Contact admin.', code: 403 };
      }
      if (error?.status === 429) {
        setError('Too many attempts. Please try again later.');
        return { success: false, error: 'Too many attempts. Please try again later.', code: 429 };
      }
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  // Register function
  const register = useCallback(async (userData) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await authService.register(userData);
      
      if (response.success) {
        setUser(response.data.user);
        setIsAuthenticated(true);
        const roleNotice = response?.data?.roleNotice || null;
        if (typeof window !== 'undefined' && roleNotice) {
          try {
            localStorage.setItem('nb_role_notice', JSON.stringify(roleNotice));
          } catch (_) {}
        }
        router.push('/DashBoard');
        return { success: true, roleNotice };
      }
    } catch (error) {
      // Handle pre-existing user (HTTP 409) gracefully
      if (error?.status === 409) {
        const message = error?.message || 'An account with this email already exists.';
        setError(message);
        return { success: false, error: message, code: 409 };
      }
      if (error?.status === 429) {
        const message = 'Too many attempts. Please try again later.';
        setError(message);
        return { success: false, error: message, code: 429 };
      }
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  // Logout function
  const logout = useCallback(async () => {
    try {
      setIsLoading(true);
      await authService.logout();
      setUser(null);
      setIsAuthenticated(false);
      router.push('/auth');
    } catch (error) {
      console.error('Logout error:', error);
      // Force logout even if API call fails
      authService.clearAuthData();
      setUser(null);
      setIsAuthenticated(false);
      router.push('/auth');
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  // Forgot password function
  const forgotPassword = useCallback(async (email) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await authService.forgotPassword(email);
      return { success: true, message: response.message };
    } catch (error) {
      if (error?.status === 429) {
        const msg = 'Too many attempts. Please try again later.';
        setError(msg);
        return { success: false, error: msg, code: 429 };
      }
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Reset password function
  const resetPassword = useCallback(async (token, newPassword) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await authService.resetPassword(token, newPassword);
      return { success: true, message: response.message };
    } catch (error) {
      if (error?.status === 429) {
        const msg = 'Too many attempts. Please try again later.';
        setError(msg);
        return { success: false, error: msg, code: 429 };
      }
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ---------------------- OTP-BASED RESET FLOW ----------------------
  // Request OTP to email
  const requestResetOtp = useCallback(async (email) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await authService.requestResetOtp(email);
      // returns possibly data.data.otpToken in no-Redis mode
      return { success: true, data: response?.data };
    } catch (error) {
      if (error?.status === 429) {
        const msg = 'Too many OTP requests. Please try again later.';
        setError(msg);
        return { success: false, error: msg, code: 429 };
      }
      const msg = error?.message || 'Failed to send OTP';
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Verify OTP → returns short-lived reset token
  const verifyResetOtp = useCallback(async ({ email, otp, otpToken }) => {
    try {
      setIsLoading(true);
      setError(null);
      const payload = otpToken ? { email, otp, otpToken } : { email, otp };
      const response = await authService.verifyResetOtp(payload);
      return { success: true, data: response?.data };
    } catch (error) {
      const status = error?.status;
      if (status === 400 || status === 401) {
        const msg = error?.message || 'Invalid OTP';
        setError(msg);
        return { success: false, error: msg, code: status };
      }
      if (status === 429) {
        const msg = 'Too many attempts. Please try again later.';
        setError(msg);
        return { success: false, error: msg, code: 429 };
      }
      const msg = error?.message || 'OTP verification failed';
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Reset password with short-lived reset token
  const resetPasswordWithOtp = useCallback(async (token, newPassword) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await authService.resetPasswordWithOtp(token, newPassword);
      return { success: true, message: response?.message };
    } catch (error) {
      const status = error?.status;
      if (status === 400 || status === 401) {
        const msg = error?.message || 'Password reset failed';
        setError(msg);
        return { success: false, error: msg, code: status };
      }
      if (status === 429) {
        const msg = 'Too many attempts. Please try again later.';
        setError(msg);
        return { success: false, error: msg, code: 429 };
      }
      const msg = error?.message || 'Password reset failed';
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Update profile function
  const updateProfile = useCallback(async (profileData) => {
    try {
      setError(null);
      
      const response = await authService.updateProfile(profileData);
      
      if (response.success) {
        setUser(response.data.user);
        return { success: true, user: response.data.user };
      }
    } catch (error) {
      if (error?.status === 409) {
        const msg = error?.message || 'Student ID already exists.';
        setError(msg);
        return { success: false, error: msg, code: 409 };
      }
      if (error?.status === 400) {
        const msg = error?.message || 'Please check your inputs.';
        setError(msg);
        return { success: false, error: msg, code: 400 };
      }
      setError(error.message);
      return { success: false, error: error.message };
    }
  }, []);

  // Change password function
  const changePassword = useCallback(async (currentPassword, newPassword) => {
    try {
      setError(null);
      
      const response = await authService.changePassword(currentPassword, newPassword);
      // Keep user on the same page and show success message
      return { success: true, message: response.message || 'Password changed successfully.' };
    } catch (error) {
      if (error?.status === 400) {
        const msg = error?.message || 'Invalid password. Ensure it meets requirements and differs from the old password.';
        setError(msg);
        return { success: false, error: msg, code: 400 };
      }
      if (error?.status === 401) {
        const msg = error?.message || error?.data?.error?.message || 'Unauthorized';
        const currentIncorrect = (msg || '').toLowerCase().includes('current password is incorrect');
        if (!currentIncorrect) setError(msg);
        return { success: false, error: msg, code: 401, currentPasswordIncorrect: currentIncorrect };
      }
      setError(error.message);
      return { success: false, error: error.message };
    }
  }, []);

  // Silently refresh current user profile (no global loading flash)
  const refreshUser = useCallback(async () => {
    try {
      const response = await authService.getCurrentUserProfile();
      if (response.success && response.data?.user) {
        setUser(response.data.user);
        return { success: true, user: response.data.user };
      }
      return { success: false };
    } catch (error) {
      console.error('Failed to refresh user profile:', error);
      return { success: false, error: error.message };
    }
  }, []);

  // Fetch current user's dashboard activity
  const getMyDashboard = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await authService.getMyDashboard();
      return { success: true, dashboard: response?.data?.dashboard || null };
    } catch (error) {
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Check if user has specific permission
  const hasPermission = useCallback((permission) => {
    if (!user || !user.permissions) return false;
    return user.permissions.includes(permission);
  }, [user]);

  // Check if user has specific role
  const hasRole = useCallback((role) => {
    if (!user) return false;
    return user.role === role;
  }, [user]);

  // Check if user has specific subrole
  const hasSubrole = useCallback((subrole) => {
    if (!user || !user.subroles || !Array.isArray(user.subroles)) return false;
    return user.subroles.includes(subrole);
  }, [user]);

  const value = {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    forgotPassword,
    resetPassword,
    requestResetOtp,
    verifyResetOtp,
    resetPasswordWithOtp,
    updateProfile,
    changePassword,
    refreshUser,
    getMyDashboard,
    clearError,
    hasPermission,
    hasRole,
    hasSubrole,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

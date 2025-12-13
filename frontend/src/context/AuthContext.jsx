import { createContext, useContext, useEffect, useState } from "react";
import { api, API_BASE_URL, loginWithTwoFactor } from "../utils/apiClient.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(
    () => window.localStorage.getItem("ogc_token") || null
  );
  const [loading, setLoading] = useState(true);
  const [isInitializing, setIsInitializing] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function checkSessionHealth() {
      try {
        // First, check session health (lightweight, no database calls)
        const sessionCheck = await api.get('/auth/session', token ? {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        } : {});

        if (!cancelled) {
          if (sessionCheck && sessionCheck.authenticated === true) {
            // Session is valid, proceed to fetch full user data
            try {
              const data = await api.get('/auth/me', token ? {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              } : {});

              if (!cancelled && data && data.user) {
                setUser(data.user);
                setAuthError(null);
                console.log('[Auth] Loaded user:', data.user);
              } else if (!cancelled) {
                setUser(null);
                setToken(null);
                setAuthError(null);
                window.localStorage.removeItem("ogc_token");
              }
            } catch (err) {
              if (!cancelled) {
                if (err?.httpStatus === 401 || err?.status === 401 || err?.statusCode === 401) {
                  setUser(null);
                  setToken(null);
                  window.localStorage.removeItem("ogc_token");
                  setAuthError(null);
                }
                console.error("[Auth] Failed to load current user", err);
              }
            }
          } else {
            // Session invalid, reset state
            setUser(null);
            setToken(null);
            setAuthError(null);
            window.localStorage.removeItem("ogc_token");
          }
        }
      } catch (err) {
        // Session check failed, reset state
        if (!cancelled) {
          setUser(null);
          setToken(null);
          window.localStorage.removeItem("ogc_token");
          setAuthError(null);
          console.error("[Auth] Session health check failed", err);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          setIsInitializing(false);
        }
      }
    }

    checkSessionHealth();
    return () => {
      cancelled = true;
    };
  }, []); // Run only once on mount

  async function login(email, password) {
    try {
      // apiClient unwraps { status: 'OK', data: {...} } to just the data object
      const data = await api.post('/auth/login', { email, password });

      // Phase S6: Check if 2FA is required (new format)
      // Note: 2FA required response might come through differently - check raw response structure
      // For now, if data has status property, it might not be unwrapped
      if (data?.status === "2FA_REQUIRED" || (data?.data && data.data.status === "2FA_REQUIRED")) {
        const ticket = data?.ticket || data?.data?.ticket;
        const methods = data?.methods || data?.data?.methods || { totp: true, recovery: false };
        return {
          status: '2FA_REQUIRED',
          ticket,
          methods
        };
      }

      // Legacy Phase 3: Check if 2FA is required (old format)
      if (data?.twoFactorRequired || data?.data?.twoFactorRequired) {
        return {
          twoFactorRequired: true,
          challengeToken: data?.challengeToken || data?.data?.challengeToken
        };
      }

      // Trust the backend login response and set user directly if available
      // Backend returns { access, refresh, user } in the data wrapper
      if (data?.user) {
        setUser(data.user);
        console.log('[Auth] Login successful, user loaded:', data.user);
      } else {
        // If no user in response, fetch from /auth/me (cookies are already set by backend)
        try {
          const meData = await api.get('/auth/me');
          if (meData && meData.user) {
            setUser(meData.user);
            console.log('[Auth] Login successful, user loaded from /auth/me:', meData.user);
          }
        } catch (err) {
          // Only log error, don't fail login if /auth/me fails (shouldn't happen)
          console.error("Failed to fetch user after login:", err);
        }
      }

      // Store token if present in response (for token-based auth)
      if (data?.access) {
        setToken(data.access);
        window.localStorage.setItem("ogc_token", data.access);
      }

      return { ok: true };
    } catch (error) {
      // Re-throw with backend message if available
      if (error.backendMessage || error.backendCode) {
        throw error;
      }
      // If error from apiClient doesn't have backendMessage, preserve what we have
      throw error;
    }
  }

  async function verifyTwoFactor(challengeToken, token) {
    try {
      const data = await api.post('/auth/2fa/verify', { challengeToken, token });

      // Check for success
      if (data.status !== "OK" && data.success !== true) {
        const error = new Error(data.message || data.error || "2FA verification failed");
        error.code = data.code;
        error.backendCode = data.code;
        error.backendMessage = data.message || data.error;
        throw error;
      }

      // Store tokens from response
      if (data.access) {
        setToken(data.access);
        window.localStorage.setItem("ogc_token", data.access);
      }

      // Set user from response
      if (data.user) {
        setUser(data.user);
        // Temporary debug log to verify role is being loaded
        console.log('[Auth] Loaded user:', data.user);
      } else if (data.access) {
        // If no user in response, fetch it from /auth/me (which now includes role/permissions)
        try {
          const meData = await api.get('/auth/me', {
            headers: {
              Authorization: `Bearer ${data.access}`,
            },
          });
          if (meData && meData.user) {
            setUser(meData.user);
          }
        } catch (err) {
          console.error("Failed to fetch user after 2FA login:", err);
        }
      }

      return data.user || user;
    } catch (error) {
      // Re-throw with backend message if available
      if (error.backendMessage || error.backendCode) {
        throw error;
      }
      throw error;
    }
  }

  // Phase S6: New 2FA login with ticket system
  async function loginWithTwoFactorStep(ticket, mode, code) {
    try {
      const data = await loginWithTwoFactor({ ticket, mode, code });

      // Check for success
      if (data.status !== "OK" && data.success !== true) {
        const error = new Error(data.message || data.error || "2FA verification failed");
        error.code = data.code;
        error.backendCode = data.code;
        error.backendMessage = data.message || data.error;
        throw error;
      }

      // Store tokens from response
      if (data.access) {
        setToken(data.access);
        window.localStorage.setItem("ogc_token", data.access);
      }

      // Set user from response
      if (data.user) {
        setUser(data.user);
        // Temporary debug log to verify role is being loaded
        console.log('[Auth] Loaded user:', data.user);
      } else if (data.access) {
        // If no user in response, fetch it from /auth/me (which now includes role/permissions)
        try {
          const meData = await api.get('/auth/me', {
            headers: {
              Authorization: `Bearer ${data.access}`,
            },
          });
          if (meData && meData.user) {
            setUser(meData.user);
          }
        } catch (err) {
          console.error("Failed to fetch user after 2FA login:", err);
        }
      }

      return data.user || user;
    } catch (error) {
      // Re-throw with backend message if available
      if (error.backendMessage || error.backendCode) {
        throw error;
      }
      throw error;
    }
  }

  async function register(email, password, fullName, termsAccepted) {
    try {
      const data = await api.post('/auth/register', { email, password, fullName, termsAccepted });

      // Check for success (backend sends status: 'OK' or success: true)
      if (data.status !== "OK" && data.success !== true) {
        const error = new Error(data.message || data.error || "Registration failed");
        error.code = data.code;
        error.backendCode = data.code;
        error.backendMessage = data.message || data.error;
        throw error;
      }

      // Registration successful but user is NOT logged in (requires activation)
      // Do not set user or token
      return { success: true, requiresActivation: true, message: data.message };
    } catch (error) {
      // Re-throw with backend message if available
      if (error.backendMessage || error.backendCode) {
        throw error;
      }
      // If error from apiClient doesn't have backendMessage, preserve what we have
      throw error;
    }
  }

  async function resendActivation(email) {
    try {
      const data = await api.post('/auth/resend-activation', { email });

      // Check for success (backend sends status: 'OK' or success: true)
      if (data.status !== "OK" && data.success !== true) {
        const error = new Error(data.message || data.error || "Failed to resend activation email");
        error.code = data.code;
        error.backendCode = data.code;
        error.backendMessage = data.message || data.error;
        throw error;
      }

      return data;
    } catch (error) {
      // Re-throw with backend message if available
      if (error.backendMessage || error.backendCode) {
        throw error;
      }
      // If error from apiClient doesn't have backendMessage, preserve what we have
      throw error;
    }
  }

  function logout() {
    setUser(null);
    setToken(null);
    window.localStorage.removeItem("ogc_token");
  }

  // OAuth redirect flow: manually refresh auth state after OAuth success
  // This is called from AuthPage when oauth=success to verify cookies are set
  // Works with both token-based and cookie-based auth (OAuth uses cookies)
  async function checkAuth() {
    try {
      // For OAuth, cookies are set by backend, so we can call /auth/me directly
      // If token exists, include it; otherwise rely on cookies
      const options = token ? {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      } : {};

      // Fetch user data (cookies will be sent automatically)
      const data = await api.get('/auth/me', options);

      if (data && data.user) {
        setUser(data.user);
        setAuthError(null);
        // Update token if provided in response
        if (data.access) {
          setToken(data.access);
          window.localStorage.setItem("ogc_token", data.access);
        }
        console.log('[Auth] OAuth checkAuth: Loaded user:', data.user);
        return data.user;
      }

      // No user data returned
      setUser(null);
      setToken(null);
      window.localStorage.removeItem("ogc_token");
      setAuthError(null);
      return null;
    } catch (err) {
      // If 401, clear auth state
      if (err?.httpStatus === 401 || err?.status === 401 || err?.statusCode === 401) {
        setUser(null);
        setToken(null);
        window.localStorage.removeItem("ogc_token");
        setAuthError(null);
      }
      console.error("[Auth] checkAuth failed", err);
      throw err;
    }
  }

  // Helper functions for role and permission checks
  const hasRole = (requiredRole) => {
    if (!user) return false;
    // Check both user.role (singular) and user.roles (array) for compatibility
    if (user.role === requiredRole) return true;
    if (Array.isArray(user.roles) && user.roles.includes(requiredRole)) return true;
    return false;
  };

  const hasAnyRole = (roles) => {
    if (!user || !Array.isArray(roles) || roles.length === 0) {
      return false;
    }
    // Check both user.role (singular) and user.roles (array) for compatibility
    // Backend returns roles as array, but some code may still use role (singular)
    if (user.role && roles.includes(user.role)) return true;
    if (Array.isArray(user.roles)) {
      return user.roles.some(role => roles.includes(role));
    }
    return false;
  };

  const hasPermission = (permission) => {
    if (!user) return false;
    // FOUNDER has all permissions (effectivePermissions is null)
    // Check both user.role (singular) and user.roles (array)
    const isFounder = user.role === 'FOUNDER' || 
                      (Array.isArray(user.roles) && user.roles.includes('FOUNDER'));
    if (isFounder || user.effectivePermissions === null) {
      return true;
    }
    // Check if user has the permission in their effectivePermissions array
    return Array.isArray(user.effectivePermissions) && user.effectivePermissions.includes(permission);
  };

  const hasAnyPermission = (requiredPermissions = []) => {
    if (!user || !Array.isArray(requiredPermissions) || requiredPermissions.length === 0) {
      return false;
    }
    // FOUNDER has all permissions (effectivePermissions is null)
    // Check both user.role (singular) and user.roles (array)
    const isFounder = user.role === 'FOUNDER' || 
                      (Array.isArray(user.roles) && user.roles.includes('FOUNDER'));
    if (isFounder || user.effectivePermissions === null) {
      return true;
    }
    // Check if user has at least one of the required permissions
    return requiredPermissions.some((perm) => 
      Array.isArray(user.effectivePermissions) && user.effectivePermissions.includes(perm)
    );
  };

  const value = {
    user,
    token,
    loading,
    isInitializing,
    authError,
    isAuthenticated: !!user,
    // Phase 5: Role, permissions, and feature flags (from user object)
    userRole: user?.role || null,
    userPermissions: user?.permissions || null,
    effectivePermissions: user?.effectivePermissions || null,
    userFeatureFlags: user?.featureFlags || null,
    // Helper functions
    hasRole,
    hasAnyRole,
    hasPermission,
    hasAnyPermission,
    // Auth functions
    login,
    verifyTwoFactor,
    loginWithTwoFactorStep,
    register,
    logout,
    resendActivation,
    // OAuth redirect flow: manually refresh auth state after OAuth success
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}

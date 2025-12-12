import { createContext, useContext, useEffect, useState } from "react";
import { api, API_BASE_URL, loginWithTwoFactor } from "../utils/apiClient.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(
    () => window.localStorage.getItem("ogc_token") || null
  );
  const [loading, setLoading] = useState(!!token);
  const [authError, setAuthError] = useState(null);
  // Phase 5: Role, permissions, and feature flags
  const [userRole, setUserRole] = useState(null);
  const [userPermissions, setUserPermissions] = useState(null);
  const [userFeatureFlags, setUserFeatureFlags] = useState(null);

  // Phase 5: Fetch user role, permissions, and feature flags
  const fetchUserAccessData = async () => {
    try {
      // API client now returns data directly (from { status: "OK", data: { role, permissions, featureFlags } })
      const roleData = await api.get('/user/role', token ? {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      } : {});
      
      if (roleData) {
        setUserRole(roleData.role);
        setUserPermissions(roleData.permissions);
        setUserFeatureFlags(roleData.featureFlags);
      }
    } catch (err) {
      // Silently fail - user might not be authenticated yet
      console.debug("Failed to fetch user access data:", err);
    }
  };

  useEffect(() => {
    async function fetchMe() {
      try {
        // Always try to fetch /auth/me to check if we're authenticated
        // This works for both token-based auth (Authorization header) and cookie-based auth (social login)
        // The apiClient uses credentials: 'include', so cookies will be sent automatically
        // API client now returns data directly (from { status: "OK", data: { user } })
        const data = await api.get('/auth/me', token ? {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        } : {});

        if (data && data.user) {
          setUser(data.user);
          setAuthError(null);
          // Temporary debug log to verify role is being loaded
          console.log('[Auth] Loaded user:', data.user);
          // Phase 5: Fetch role, permissions, and feature flags
          await fetchUserAccessData();
          // If we got user data but no token in localStorage, cookies are likely being used
          // This is fine - we don't need to store token for cookie-based auth
        } else {
          // Not authenticated
          setUser(null);
          setUserRole(null);
          setUserPermissions(null);
          setUserFeatureFlags(null);
          setToken(null);
          setAuthError(null);
          window.localStorage.removeItem("ogc_token");
        }
      } catch (err) {
        console.error("[Auth] Failed to load current user", err);
        setUser(null);
        setUserRole(null);
        setUserPermissions(null);
        setUserFeatureFlags(null);
        // Only set auth error if we had a token (to avoid showing error on initial load)
        if (token) {
          setAuthError(err?.message || "Unable to verify your session.");
          setToken(null);
          window.localStorage.removeItem("ogc_token");
        } else {
          // Not logged in - this is expected, don't show error
          setAuthError(null);
        }
      } finally {
        setLoading(false);
      }
    }

    fetchMe();
  }, [token]);

  async function login(email, password) {
    try {
      const data = await api.post('/auth/login', { email, password });

      // Phase S6: Check if 2FA is required (new format)
      if (data.status === "2FA_REQUIRED" || (data.status === "OK" && data.data?.status === "2FA_REQUIRED")) {
        // Return ticket and methods for 2FA verification
        const ticket = data.data?.ticket || data.ticket;
        const methods = data.data?.methods || data.methods || { totp: true, recovery: false };
        return {
          status: '2FA_REQUIRED',
          ticket,
          methods
        };
      }

      // Legacy Phase 3: Check if 2FA is required (old format)
      if (data.status === "OK" && data.data?.twoFactorRequired) {
        // Return challenge token for 2FA verification
        return {
          twoFactorRequired: true,
          challengeToken: data.data.challengeToken
        };
      }

      // Check for success (backend sends status: 'OK' or success: true)
      if (data.status !== "OK" && data.success !== true) {
        const error = new Error(data.message || data.error || "Login failed");
        error.code = data.code;
        error.backendCode = data.code;
        error.backendMessage = data.message || data.error;
        throw error;
      }

      // Store tokens from response or cookies
      if (data.access) {
        setToken(data.access);
        window.localStorage.setItem("ogc_token", data.access);
      }

      // Fetch user info if available
      if (data.user) {
        setUser(data.user);
        // Temporary debug log to verify role is being loaded
        console.log('[Auth] Loaded user:', data.user);
        // Phase 5: Fetch role, permissions, and feature flags
        await fetchUserAccessData();
      } else if (data.access) {
        // If no user in response, fetch it
        try {
          const meData = await api.get('/auth/me', {
            headers: {
              Authorization: `Bearer ${data.access}`,
            },
          });
          if (meData.status === "OK") {
            setUser(meData.user);
            // Phase 5: Fetch role, permissions, and feature flags
            await fetchUserAccessData();
          }
        } catch (err) {
          console.error("Failed to fetch user after login:", err);
        }
      }

      return data.user || user;
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
        // Phase 5: Fetch role, permissions, and feature flags
        await fetchUserAccessData();
      } else if (data.access) {
        // If no user in response, fetch it
        try {
          const meData = await api.get('/auth/me', {
            headers: {
              Authorization: `Bearer ${data.access}`,
            },
          });
          if (meData.status === "OK") {
            setUser(meData.user);
            // Temporary debug log to verify role is being loaded
            console.log('[Auth] Loaded user:', meData.user);
            // Phase 5: Fetch role, permissions, and feature flags
            await fetchUserAccessData();
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
        // Phase 5: Fetch role, permissions, and feature flags
        await fetchUserAccessData();
      } else if (data.access) {
        // If no user in response, fetch it
        try {
          const meData = await api.get('/auth/me', {
            headers: {
              Authorization: `Bearer ${data.access}`,
            },
          });
          if (meData.status === "OK") {
            setUser(meData.user);
            // Temporary debug log to verify role is being loaded
            console.log('[Auth] Loaded user:', meData.user);
            // Phase 5: Fetch role, permissions, and feature flags
            await fetchUserAccessData();
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
    setUserRole(null);
    setUserPermissions(null);
    setUserFeatureFlags(null);
    setToken(null);
    window.localStorage.removeItem("ogc_token");
  }

  const value = {
    user,
    token,
    loading,
    authError,
    isAuthenticated: !!user,
    // Phase 5: Role, permissions, and feature flags
    userRole,
    userPermissions,
    userFeatureFlags,
    login,
    verifyTwoFactor,
    loginWithTwoFactorStep,
    register,
    logout,
    resendActivation,
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

import { createContext, useContext, useEffect, useState } from "react";
import { api, API_BASE_URL } from "../utils/apiClient.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(
    () => window.localStorage.getItem("ogc_token") || null
  );
  const [loading, setLoading] = useState(!!token);
  // Phase 5: Role, permissions, and feature flags
  const [userRole, setUserRole] = useState(null);
  const [userPermissions, setUserPermissions] = useState(null);
  const [userFeatureFlags, setUserFeatureFlags] = useState(null);

  // Phase 5: Fetch user role, permissions, and feature flags
  const fetchUserAccessData = async () => {
    try {
      const roleData = await api.get('/user/role', token ? {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      } : {});
      
      if (roleData.status === "OK" && roleData.data) {
        setUserRole(roleData.data.role);
        setUserPermissions(roleData.data.permissions);
        setUserFeatureFlags(roleData.data.featureFlags);
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
        const data = await api.get('/auth/me', token ? {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        } : {});

        if (data.status === "OK") {
          setUser(data.user);
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
          window.localStorage.removeItem("ogc_token");
        }
      } catch (err) {
        // If /auth/me fails, we're not authenticated
        // This is expected if user is not logged in
        if (token) {
          // Only clear token if we had one (to avoid clearing on initial load)
          setUser(null);
          setUserRole(null);
          setUserPermissions(null);
          setUserFeatureFlags(null);
          setToken(null);
          window.localStorage.removeItem("ogc_token");
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

      // Phase 3: Check if 2FA is required
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
    isAuthenticated: !!user,
    // Phase 5: Role, permissions, and feature flags
    userRole,
    userPermissions,
    userFeatureFlags,
    login,
    verifyTwoFactor,
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

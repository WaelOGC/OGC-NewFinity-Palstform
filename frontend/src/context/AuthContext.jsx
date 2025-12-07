import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(
    () => window.localStorage.getItem("ogc_token") || null
  );
  const [loading, setLoading] = useState(!!token);

  useEffect(() => {
    async function fetchMe() {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch("http://localhost:3000/api/auth/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          throw new Error("Failed to fetch current user");
        }

        const data = await res.json();
        if (data.status === "OK") {
          setUser(data.user);
        } else {
          // Token not valid anymore
          setUser(null);
          setToken(null);
          window.localStorage.removeItem("ogc_token");
        }
      } catch (err) {
        console.error("AuthContext fetchMe error:", err);
        setUser(null);
        setToken(null);
        window.localStorage.removeItem("ogc_token");
      } finally {
        setLoading(false);
      }
    }

    fetchMe();
  }, [token]);

  async function login(email, password) {
    const res = await fetch("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok || data.status !== "OK") {
      throw new Error(data.message || "Login failed");
    }

    setUser(data.user);
    setToken(data.token);
    window.localStorage.setItem("ogc_token", data.token);

    return data.user;
  }

  async function register(email, password, fullName) {
    const res = await fetch("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, fullName }),
    });

    const data = await res.json();

    if (!res.ok || data.status !== "OK") {
      throw new Error(data.message || "Registration failed");
    }

    setUser(data.user);
    setToken(data.token);
    window.localStorage.setItem("ogc_token", data.token);

    return data.user;
  }

  function logout() {
    setUser(null);
    setToken(null);
    window.localStorage.removeItem("ogc_token");
  }

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
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

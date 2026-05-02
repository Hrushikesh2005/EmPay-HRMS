import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api, { clearSessionTokens, setSessionTokens } from "../api/axios.js";

const AuthContext = createContext(null);

function readJSON(value) {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function normalizeSession(data = {}) {
  const accessToken = data.access_token || data.accessToken || null;
  const refreshToken = data.refresh_token || data.refreshToken || null;
  const role = data.role || data.user?.role || null;
  const user = data.user || (data.user_id ? { id: data.user_id, role } : null);
  const mustChangePassword = user?.must_change_password || false;

  return {
    accessToken,
    refreshToken,
    role,
    user,
    mustChangePassword,
  };
}

function buildSessionFromStorage() {
  const accessToken = localStorage.getItem("accessToken");
  const refreshToken = localStorage.getItem("refreshToken");
  const role = localStorage.getItem("role");
  const user = readJSON(localStorage.getItem("user"));

  return {
    accessToken,
    refreshToken,
    role,
    user,
  };
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(buildSessionFromStorage);
  const [permissions, setPermissions] = useState(() => readJSON(localStorage.getItem("permissions")) || []);
  const [permissionsLoading, setPermissionsLoading] = useState(true);

  useEffect(() => {
    const { accessToken, refreshToken, role, user } = session;

    if (accessToken) localStorage.setItem("accessToken", accessToken);
    else localStorage.removeItem("accessToken");

    if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
    else localStorage.removeItem("refreshToken");

    if (role) localStorage.setItem("role", role);
    else localStorage.removeItem("role");

    if (user) localStorage.setItem("user", JSON.stringify(user));
    else localStorage.removeItem("user");

    if (permissions && permissions.length > 0) {
      localStorage.setItem("permissions", JSON.stringify(permissions));
    } else {
      localStorage.removeItem("permissions");
    }
  }, [session, permissions]);

  const fetchPermissions = async () => {
    setPermissionsLoading(true);
    try {
      const response = await api.get("/permissions/me");
      setPermissions(response.data || []);
    } catch (err) {
      console.error("Failed to fetch permissions", err);
    } finally {
      setPermissionsLoading(false);
    }
  };

  useEffect(() => {
    if (session.accessToken) {
      fetchPermissions();
    } else {
      // Not logged in — no loading needed
      setPermissionsLoading(false);
    }
  }, [session.accessToken]);

  const login = async (credentials) => {
    // ... same login logic ...
    const form = new URLSearchParams();
    form.append("username", credentials.email || credentials.username || "");
    form.append("password", credentials.password || "");

    const response = await api.post("/auth/login", form, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
    const nextSession = normalizeSession(response.data);
    setSession(nextSession);
    setSessionTokens(nextSession);
    return nextSession;
  };

  const logout = () => {
    setSession({
      accessToken: null,
      refreshToken: null,
      role: null,
      user: null,
    });
    setPermissions([]);
    clearSessionTokens();
    localStorage.removeItem("role");
    localStorage.removeItem("user");
    localStorage.removeItem("permissions");
  };

  const value = useMemo(() => {
    const role = session.role || session.user?.role || null;

    return {
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      user: session.user,
      role,
      permissions,
      permissionsLoading,
      mustChangePassword: session.mustChangePassword,
      isAuthenticated: Boolean(session.accessToken),
      login,
      logout,
      setSession,
      refreshPermissions: fetchPermissions,
    };
  }, [session, permissions, permissionsLoading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export default AuthContext;

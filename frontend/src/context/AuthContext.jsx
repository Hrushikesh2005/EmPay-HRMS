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

  return {
    accessToken,
    refreshToken,
    role,
    user,
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
  }, [session]);

  const login = async (credentials) => {
    // FastAPI OAuth2PasswordRequestForm expects form-encoded fields 'username' and 'password'
    const form = new URLSearchParams();
    form.append("username", credentials.email || credentials.username || "");
    form.append("password", credentials.password || "");

    const response = await api.post("/auth/login", form, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
    console.log("[AuthContext] Login response:", response.data);
    const nextSession = normalizeSession(response.data);
    console.log("[AuthContext] Normalized session:", nextSession);
    setSession(nextSession);
    setSessionTokens(nextSession);
    return nextSession;
  };

  const register = async (payload) => {
    const response = await api.post("/auth/register", payload);
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
    clearSessionTokens();
    localStorage.removeItem("role");
    localStorage.removeItem("user");
  };

  const value = useMemo(() => {
    const role = session.role || session.user?.role || null;

    return {
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      user: session.user,
      role,
      isAuthenticated: Boolean(session.accessToken),
      login,
      register,
      logout,
      setSession,
    };
  }, [session]);

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

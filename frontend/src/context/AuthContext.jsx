import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { clearTokens, getTokens } from "../services/api";
import { fetchMe, login as loginRequest } from "../services/auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadUser = async () => {
    const { accessToken } = getTokens();
    if (!accessToken) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const me = await fetchMe();
      setUser(me);
    } catch (err) {
      clearTokens();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  const login = async (email, password) => {
    setError(null);
    const response = await loginRequest(email, password);
    const me = await fetchMe();
    setUser(me);
    return response;
  };

  const logout = () => {
    clearTokens();
    setUser(null);
  };

  const value = useMemo(
    () => ({
      user,
      isLoading,
      error,
      login,
      logout,
      reloadUser: loadUser,
    }),
    [user, isLoading, error]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

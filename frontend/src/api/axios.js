import axios from "axios";

const apiHost = import.meta.env.VITE_API_URL || "http://localhost:8000";
const apiPrefix = import.meta.env.VITE_API_PREFIX || "/api/v1";
const baseURL = `${apiHost.replace(/\/$/, "")}${apiPrefix}`;

const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

let refreshPromise = null;

function getAccessToken() {
  return localStorage.getItem("accessToken");
}

function getRefreshToken() {
  return localStorage.getItem("refreshToken");
}

function setSessionTokens({ accessToken, refreshToken, role, user }) {
  if (accessToken) localStorage.setItem("accessToken", accessToken);
  if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
  if (role) localStorage.setItem("role", role);
  if (user) localStorage.setItem("user", JSON.stringify(user));
}

function clearSessionTokens() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
}

function isAuthEndpoint(url = "") {
  return /\/auth\/(login|register|refresh)/.test(url);
}

async function refreshAccessToken() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new Error("Missing refresh token");
  }

  const response = await axios.post(
    `${baseURL}/auth/refresh`,
    { refresh_token: refreshToken },
    { headers: { "Content-Type": "application/json" }, withCredentials: true },
  );

  const payload = response.data ?? {};
  const nextAccessToken = payload.access_token || payload.accessToken;
  const nextRefreshToken =
    payload.refresh_token || payload.refreshToken || refreshToken;

  if (nextAccessToken) {
    setSessionTokens({
      accessToken: nextAccessToken,
      refreshToken: nextRefreshToken,
      role: payload.role,
      user: payload.user,
    });
  }

  return nextAccessToken;
}

api.interceptors.request.use((config) => {
  const token = getAccessToken();

  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      !error.response ||
      error.response.status !== 401 ||
      !originalRequest ||
      originalRequest._retry ||
      isAuthEndpoint(originalRequest.url)
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      refreshPromise ||= refreshAccessToken();
      const nextToken = await refreshPromise;
      refreshPromise = null;

      if (!nextToken) {
        clearSessionTokens();
        return Promise.reject(error);
      }

      originalRequest.headers = originalRequest.headers || {};
      originalRequest.headers.Authorization = `Bearer ${nextToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      refreshPromise = null;
      clearSessionTokens();
      return Promise.reject(refreshError);
    }
  },
);

export { clearSessionTokens, setSessionTokens };
export default api;

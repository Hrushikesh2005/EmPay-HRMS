import api, { setTokens } from "./api";

export async function login(email, password) {
  const payload = new URLSearchParams();
  payload.append("username", email);
  payload.append("password", password);

  const response = await api.post("/auth/login", payload, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });

  setTokens({
    accessToken: response.data.access_token,
    refreshToken: response.data.refresh_token,
  });

  return response.data;
}

export async function register(data) {
  const response = await api.post("/auth/register", data);
  return response.data;
}

export async function fetchMe() {
  const response = await api.get("/auth/me");
  return response.data;
}

import axios from "axios";
import type { AuthResponse } from "./types";

export const apiClient = axios.create();

function getStoredToken(): string | null {
  const raw = localStorage.getItem("user");
  if (!raw) return null;

  try {
    const user = JSON.parse(raw) as Partial<AuthResponse>;
    return typeof user.token === "string" ? user.token : null;
  } catch {
    return null;
  }
}

apiClient.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

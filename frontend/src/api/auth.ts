import { apiClient } from "./client";
import type { AuthResponse, CurrentUserResponse } from "./types";

export async function authenticate(oauthToken: string): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>("/api/auth", { oauthToken });
  return data;
}

export async function getCurrentUser(): Promise<CurrentUserResponse> {
  const { data } = await apiClient.get<CurrentUserResponse>("/api/auth/me");
  return data;
}

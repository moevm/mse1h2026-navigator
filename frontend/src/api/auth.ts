import axios from "axios";
import type { AuthResponse } from "./types";

export async function authenticate(oauthToken: string): Promise<AuthResponse> {
  const { data } = await axios.post<AuthResponse>("/api/auth", { oauthToken });
  return data;
}

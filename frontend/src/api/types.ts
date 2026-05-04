export interface AuthResponse {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  avatarUrl: string;
  skills: string[];
  token: string;
}

export type CurrentUserResponse = Omit<AuthResponse, "token">;

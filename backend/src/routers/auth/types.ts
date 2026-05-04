export interface YandexUserInfo {
  id: string;
  login: string;
  first_name: string;
  last_name: string;
  default_avatar_id: string;
  is_avatar_empty: boolean;
}

export interface YandexApiError {
  error?: string;
  error_description?: string;
}

export interface AuthResponse {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  avatarUrl: string;
  skills: string[];
  token: string;
}

export interface CurrentUserResponse {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  avatarUrl: string;
  skills: string[];
}

export interface OAuthTokenRequest {
  grant_type: "client_credentials";
  client_id: string;
  client_secret: string;
}

export interface OAuthTokenMeta {
  expiresAt: number;
}

export interface SearchCoursesRequest {
  search: string;
  page?: number;
}

export interface GetCoursesRequest {
  page?: number;
}

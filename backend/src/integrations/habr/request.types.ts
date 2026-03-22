export interface HabrSearchArticlesRequest {
  query: string;
  order: "relevance";
  fl: "ru";
  hl: "ru";
}

export interface HabrQueryParams {
  query?: string;
}
import { HabrPublication } from "./entity.types";

export interface HabrSearchArticlesResponse {
  pagesCount: number;
  publicationRefs: Record<string, HabrPublication>;
}
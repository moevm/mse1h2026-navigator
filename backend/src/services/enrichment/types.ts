import type { CourseGql } from "../../graphql/types/Course.type";
import type { BookGql } from "../../graphql/types/Book.type";
import type { ArticleGql } from "../../graphql/types/Article.type";

export interface SkillEnrichment {
  description: string;
  courses: CourseGql[];
  books: BookGql[];
  articles: ArticleGql[];
}

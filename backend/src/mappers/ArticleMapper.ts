import type { HabrParsedArticle } from "../integrations/habr/basic.types";
import { ArticleGql } from "../graphql/types/Article.type";

export class ArticleMapper {
  static toGql(article: HabrParsedArticle): ArticleGql {
    const gql = new ArticleGql();

    gql.title = ArticleMapper.stripHtml(article.titleHtml);
    gql.description = ArticleMapper.stripHtml(article.description);
    gql.link = article.link;
    gql.rating = article.rating;
    gql.tags = article.hubs.map((h) => h.title);

    return gql;
  }

  static toGqlList(articles: HabrParsedArticle[]): ArticleGql[] {
    return articles.map((a) => ArticleMapper.toGql(a));
  }

  private static stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, "").trim();
  }
}

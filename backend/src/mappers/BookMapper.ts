import type { OpenLibraryBook } from "../integrations/openlibrary/entity.types";
import { BookGql } from "../graphql/types/Book.type";

export class BookMapper {
  static toGql(book: OpenLibraryBook): BookGql {
    const gql = new BookGql();

    gql.id = book.key.replace("/works/", "");
    gql.title = book.title;
    gql.author = book.authors[0] ?? "Unknown";
    gql.description = book.description ?? "";
    gql.link = book.readUrl;
    gql.image = book.coverUrl ?? undefined;

    return gql;
  }

  static toGqlList(books: OpenLibraryBook[]): BookGql[] {
    return books.map((b) => BookMapper.toGql(b));
  }
}

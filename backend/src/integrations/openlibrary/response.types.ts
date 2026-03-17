import { EbookAccess } from './entity.types';

/** Один документ из результатов Search API */
export interface OpenLibrarySearchDoc {
  key: string;
  title: string;
  author_name?: string[];
  cover_i?: number;
  description?: string;
  ebook_access?: EbookAccess;
  /** Идентификаторы Internet Archive (первый используется для ссылки на чтение) */
  ia?: string[];
  has_fulltext?: boolean;
  public_scan_b?: boolean;
  first_publish_year?: number;
  subject?: string[];
  lending_identifier_s?: string;
  number_of_pages_median?: number;
}

/** Ответ Search API */
export interface OpenLibrarySearchResponse {
  numFound: number;
  start: number;
  docs: OpenLibrarySearchDoc[];
}

/** Ответ Works API (только используемые поля) */
export interface OpenLibraryWorkResponse {
  key: string;
  title: string;
  description?: string | { type: string; value: string };
  covers?: number[];
  subjects?: string[];
  links?: Array<{ title: string; url: string }>;
}

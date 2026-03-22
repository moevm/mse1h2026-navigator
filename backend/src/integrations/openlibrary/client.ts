import axios from 'axios';

import type { SearchBooksRequest } from './request.types';
import type {
  OpenLibrarySearchDoc,
  OpenLibrarySearchResponse,
  OpenLibraryWorkResponse,
} from './response.types';
import type { EbookAccess, OpenLibraryBook } from './entity.types';

/** Поля, запрашиваемые у Search API — только то, что реально нужно */
const SEARCH_FIELDS = [
  'key',
  'title',
  'author_name',
  'cover_i',
  'description',
  'ebook_access',
  'ia',
  'has_fulltext',
  'public_scan_b',
  'first_publish_year',
  'subject',
  'lending_identifier_s',
  'number_of_pages_median',
].join(',');

export class OpenLibraryClient {
  private readonly baseUrl = 'https://openlibrary.org';
  private readonly coversUrl = 'https://covers.openlibrary.org';

  private readonly DEFAULT_LIMIT = 10;
  /**
   * Поиск книг по названию.
   * Возвращает нормализованные объекты {@link OpenLibraryBook}.
   */
  public async searchByTitle(
    request: SearchBooksRequest,
  ): Promise<OpenLibraryBook[]> {
    const raw = await this.fetchSearch({
      title: request.query,
      limit: request.limit ?? this.DEFAULT_LIMIT,
      offset: request.offset ?? 0,
    });

    return this.normalizeDocs(raw.docs);
  }

  /**
   * Поиск книг по теме (subject).
   * Примеры тем: "machine learning", "javascript", "docker"
   */
  public async searchBySubject(
    request: SearchBooksRequest,
  ): Promise<OpenLibraryBook[]> {
    const raw = await this.fetchSearch({
      subject: request.query,
      limit: request.limit ?? this.DEFAULT_LIMIT,
      offset: request.offset ?? 0,
    });

    return this.normalizeDocs(raw.docs);
  }

  /**
   * Получение книги с полными данными по её work key.
   * Делает запрос к Works API для гарантированного получения описания.
   *
   * @param workKey — например "/works/OL15444205W" или "OL15444205W"
   */
  public async getBook(workKey: string): Promise<OpenLibraryBook | null> {
    const normalizedKey = workKey.startsWith('/works/')
      ? workKey
      : `/works/${workKey}`;

    try {
      const work = await this.fetchWork(normalizedKey);
      return this.normalizeWork(work);
    } catch {
      return null;
    }
  }
  private async fetchSearch(
    params: Record<string, string | number>,
  ): Promise<OpenLibrarySearchResponse> {
    const response = await axios.get<OpenLibrarySearchResponse>(
      `${this.baseUrl}/search.json`,
      { params: { ...params, fields: SEARCH_FIELDS } },
    );
    return response.data;
  }

  private async fetchWork(
    normalizedKey: string,
  ): Promise<OpenLibraryWorkResponse> {
    const response = await axios.get<OpenLibraryWorkResponse>(
      `${this.baseUrl}${normalizedKey}.json`,
    );
    return response.data;
  }

  private normalizeDocs(docs: OpenLibrarySearchDoc[]): OpenLibraryBook[] {
    return docs.map((doc) => this.normalizeDoc(doc));
  }

  private normalizeDoc(doc: OpenLibrarySearchDoc): OpenLibraryBook {
    const ebookAccess = (doc.ebook_access ?? 'no_ebook') as EbookAccess;

    return {
      key: doc.key,
      title: doc.title,
      authors: doc.author_name ?? [],
      description: doc.description ?? null,
      coverUrl: this.buildCoverUrl(doc.cover_i),
      readUrl: this.buildReadUrl(doc),
      isFreelyReadable: doc.public_scan_b === true,
      ebookAccess,
      firstPublishYear: doc.first_publish_year ?? null,
      subjects: doc.subject ?? [],
      numberOfPagesMedian: doc.number_of_pages_median ?? null,
    };
  }

  private normalizeWork(work: OpenLibraryWorkResponse): OpenLibraryBook {
    const coverId = work.covers?.[0];

    return {
      key: work.key,
      title: work.title,
      authors: [],
      description: this.extractDescription(work.description),
      coverUrl: this.buildCoverUrl(coverId),
      readUrl: `${this.baseUrl}${work.key}`,
      isFreelyReadable: false,
      ebookAccess: 'no_ebook',
      firstPublishYear: null,
      subjects: work.subjects ?? [],
      numberOfPagesMedian: null,
    };
  }
  private buildCoverUrl(coverId: number | undefined): string | null {
    if (!coverId) return null;
    return `${this.coversUrl}/b/id/${coverId}-L.jpg`;
  }

  private buildReadUrl(doc: OpenLibrarySearchDoc): string {
    if (doc.public_scan_b && doc.ia?.[0]) {
      return `https://archive.org/details/${doc.ia[0]}`;
    }
    return `${this.baseUrl}${doc.key}`;
  }

  /**
   * Works API возвращает описание в двух форматах:
   * - простая строка
   * - объект { type: "/type/text", value: "..." }
   */
  private extractDescription(
    raw: OpenLibraryWorkResponse['description'],
  ): string | null {
    if (!raw) return null;
    if (typeof raw === 'string') return raw;
    return raw.value ?? null;
  }
}

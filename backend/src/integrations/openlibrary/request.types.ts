export interface SearchBooksRequest {
  /** Поисковый запрос (title или subject в зависимости от метода) */
  query: string;
  /** Количество результатов (по умолчанию 10, максимум 100) */
  limit?: number;
  /** Смещение для пагинации */
  offset?: number;
}

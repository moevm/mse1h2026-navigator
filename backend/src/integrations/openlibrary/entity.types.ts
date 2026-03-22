export type EbookAccess = 'public' | 'borrowable' | 'printdisabled' | 'no_ebook';

/**
 * Нормализованная книга — результат работы клиента.
 * Объединяет данные из Search API и Works API.
 */
export interface OpenLibraryBook {
  /** Идентификатор произведения, например /works/OL15444205W */
  key: string;

  title: string;

  authors: string[];

  /** Описание книги. Может отсутствовать, если OpenLibrary не заполнил поле */
  description: string | null;

  /** Прямая ссылка на обложку (размер L). null если обложки нет */
  coverUrl: string | null;

  /**
   * Ссылка для чтения/скачивания.
   * - Если книга в открытом доступе (public scan) → ссылка на Internet Archive
   * - Иначе → страница книги на OpenLibrary (займ с регистрацией или просто инфо)
   */
  readUrl: string;

  /** true = книга доступна бесплатно без регистрации (public domain scan) */
  isFreelyReadable: boolean;

  ebookAccess: EbookAccess;

  firstPublishYear: number | null;

  subjects: string[];

  numberOfPagesMedian: number | null;
}

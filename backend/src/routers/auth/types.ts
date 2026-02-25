/**
 * Информация о пользователе, возвращаемая Yandex OAuth API
 * @see https://yandex.ru/dev/id/doc/ru/user-information
 */
export interface YandexUserInfo {
  /** Уникальный идентификатор пользователя Яндекс */
  id: string;
  /** Логин пользователя */
  login: string;
  /** Имя пользователя */
  first_name: string;
  /** Фамилия пользователя */
  last_name: string;
  /** Идентификатор аватара по умолчанию */
  default_avatar_id: string;
  /** Флаг отсутствия аватара */
  is_avatar_empty: boolean;
}

/**
 * Ошибка, возвращаемая Yandex OAuth API
 */
export interface YandexApiError {
  /** Код ошибки */
  error?: string;
  /** Описание ошибки */
  error_description?: string;
}

/**
 * Ответ эндпоинта авторизации, отправляемый на фронтенд
 */
export interface AuthResponse {
  /** SHA256-хэш Yandex ID пользователя */
  id: string;
  /** Логин пользователя */
  username: string;
  /** Имя пользователя */
  firstName: string;
  /** Фамилия пользователя */
  lastName: string;
  /** URL аватара пользователя (пустая строка, если аватар отсутствует) */
  avatarUrl: string;
}

# Wikipedia API Client (Short Guide)

Клиент для работы с Wikipedia API: поиск статьи, получение краткого описания и ссылки на изображение.

## Env

```
WIKIPEDIA_USER_AGENT=...
```

## Использование

```
const client = new WikipediaApiClient();

await client.searchArticlesByName("Python");
await client.getArticleExtract("Machine learning");
```

## Методы

- **searchArticlesByName(query, limit?)** — поиск статьи через `generator=search`
- **getArticleMediaList(title)** — получить список медиа по названию статьи
- **getArticleExtract(query?)** — получить краткое описание и `imageSrc` первой найденной статьи

## Что делает

- Отправляет запросы в Wikipedia API
- Запрашивает `media-list` через REST API Wikipedia
- Проставляет `User-Agent` и `Api-User-Agent`
- Возвращает `extract` и ссылку на изображение (`items[0].srcset[0].src`)
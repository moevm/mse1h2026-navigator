# Habr API Client (Short Guide)

Клиент для работы с Habr API: поиск статей и преобразование ответа в удобный формат.

## Использование

```
const client = new HabrApiClient();

await client.searchArticlesByQuery("python");
await client.getParsedArticles("python");
```

## Методы

- **searchArticlesByQuery(query)** — сырой запрос в `https://habr.com/kek/v2/articles/`
- **getParsedArticles(query?)** — список статей с полями:
  - `titleHtml`
  - `link` (`https://habr.com/ru/articles/{id}/`)
  - `description` (`leadData.textHtml`)
  - `rating` (`statistics.score`)
  - `hubs`

## Что делает

- Запрашивает статьи по `query`
- Использует сортировку `relevance`
- Возвращает только нужные поля для конечного ответа
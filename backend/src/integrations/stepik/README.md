# Stepik API Client (Short Guide)

Клиент для работы с Stepik API: поиск курсов и оценка времени изучения навыков.

## Env

```
STEPIK_CLIENT_ID=...
STEPIK_CLIENT_SECRET=...
```

## Использование

```
const client = container.resolve(StepikApiClient);

await client.searchCoursesByName("Python");
await client.getAllCoursesByName("JavaScript");
await client.estimateSkillLearningTime("Machine Learning");
```

## Методы

- **searchCoursesByName(name, page?)** — поиск курсов
- **getAllCoursesByName(name, maxLength?)** — получить несколько страниц
- **estimateSkillLearningTime(skill, sampleSize?)** — статистика времени

## Что делает

- Авто OAuth токен
- Запросы к /api/courses
- Анализ длительности курсов

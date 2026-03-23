## Как работает запрос `skillGraph`

```
[GraphQL клиент]
      │  query skillGraph(professionName, isMock)
      ▼
[SkillGraphResolver]          — принимает аргументы, вызывает сервис
      │
      ▼
[SkillGraphService]           — оркестратор
      │
      ├─[1/3] GraphDataServiceRepository.getGraph(name, isMock)
      │         │
      │         ▼
      │       GraphDataServiceClient → POST /get_profession_graph
      │         (Python FastAPI, порт 8000)
      │         Ответ: { nodes: string[], edges: [{from_skill, to_skill}] }
      │
      ├─[2/3] для каждой ноды параллельно:
      │
      │   isMock=true  →  buildMockSkill()   — данные без вызовов API
      │   isMock=false →  buildSkill()
      │                       │
      │                       ▼
      │                 EnrichmentService.enrichSkill(title)
      │                       │  Promise.allSettled([...])
      │                       ├─ StepikApiClient     → courses[]
      │                       ├─ OpenLibraryClient   → books[]
      │                       ├─ HabrApiClient       → articles[]
      │                       └─ WikipediaApiClient  → description
      │
      └─[3/3] маппинг рёбер title → slug-id
```
## GraphQL endpoint

```
POST http://localhost:3000/graphql
```

Подробные примеры запросов — в [`graphql/README.md`](./README.md).

## Паттерны

### Repository pattern

Бизнес-логика работает через интерфейс `ISkillGraphRepository`, а не напрямую с HTTP-клиентом. Замена источника данных (например, добавление MongoDB-кэша) — это новый класс + одна строка в `container.ts`:

```typescript
// container.ts
container.register<ISkillGraphRepository>("ISkillGraphRepository", {
  useClass: MongoSkillGraphRepository,  // ← меняем только здесь
});
```

### Resolver

Резолвер не содержит логики — только принимает аргументы и вызывает сервис. Сервис можно тестировать независимо от GraphQL.

### Mappers

Статические классы с методами `toGql` / `toGqlList`. Преобразуют типы внешних API в GraphQL-типы:

```
CourseMapper   : Course (Stepik entity)    → CourseGql
BookMapper     : OpenLibraryBook           → BookGql
ArticleMapper  : HabrParsedArticle         → ArticleGql  (+ stripHtml)
```

### DI через tsyringe

Все сервисы и клиенты помечены `@injectable()`. Контейнер настраивается в `container.ts` до старта сервера. В `schema.ts` type-graphql подключается к тому же контейнеру:

```typescript
buildSchema({
  container: { get: (cls) => container.resolve(cls) },
});
```

## Добавление MongoDB-кэша (итерация 3)

1. Создать `src/repositories/skillGraph/MongoSkillGraphRepository.ts implements ISkillGraphRepository`
2. Логика: `findOne(name)` → если есть, вернуть; иначе `GraphDataServiceRepository.getGraph()` → сохранить → вернуть
3. В `container.ts` поменять `useClass` на `MongoSkillGraphRepository`

Весь остальной код не трогается.

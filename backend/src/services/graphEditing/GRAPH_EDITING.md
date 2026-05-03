# Редактирование графа через GraphQL

Документация описывает серверный интерфейс для построения, сохранения и редактирования пользовательского графа компетенций.

## Основной принцип

Все пользовательские операции с графом выполняются через точку входа GraphQL:

```http
POST /graphql
```

REST `/graphs` не является публичным интерфейсом для работы с графом. Логика редактирования вынесена во внутренний слой сервиса и вызывается из обработчика GraphQL.

Для операций с сохраненными графами нужен заголовок авторизации:

```http
Authorization: Bearer <app-token>
```

## Где находится код

- `backend/src/app.ts` — создает приложение Express, подключает Apollo Server и служебные REST-маршрутизаторы.
- `backend/src/index.ts` — загружает переменные окружения и запускает сервер.
- `backend/src/graphql/context.ts` — достает пользователя из GraphQL-запроса по Bearer-токену.
- `backend/src/graphql/resolvers/skillGraph.resolver.ts` — GraphQL-запросы и мутации графа.
- `backend/src/graphql/types/*.ts` — типы объектов и входных данных GraphQL.
- `backend/src/services/skillGraph/SkillGraphService.ts` — построение и обогащение графа из ветки `T41-Mappers-For-Graph`.
- `backend/src/services/graphEditing/service.ts` — внутренняя прикладная логика сохранения и редактирования графа.
- `backend/src/services/graphEditing/types.ts` — TypeScript-типы внутреннего слоя редактирования графа.
- `backend/prisma/schema.prisma` — схема MongoDB/Prisma.

## Хранение графа

Граф сохраняется в MongoDB как документ `Graph`:

```prisma
model Graph {
  id                        String           @id @default(auto()) @map("_id") @db.ObjectId
  userId                    String           @db.ObjectId
  professionTitle           String
  normalizedProfessionTitle String
  mainSkill                 MainSkill
  nodes                     Skill[]
  edges                     SkillsRelation[]
  createdAt                 DateTime         @default(now())
  updatedAt                 DateTime         @updatedAt

  @@unique([userId, normalizedProfessionTitle])
}
```

`mainSkill` — целевая профессия.  
`nodes` — навыки.  
`edges` — зависимости между навыками.

Граф уникален для пары `userId + normalizedProfessionTitle`.

## Справочные коллекции

Добавлены отдельные коллекции для промежуточных данных:

- `CourseResource` — курсы из Stepik и других источников.
- `CompanyResource` — компании из HH и других источников.

Эти коллекции нужны для переиспользования данных при будущей сборке графа. Внутри `Graph.nodes[].courses` хранится снимок ресурсов на момент генерации графа.

## Операции GraphQL

### Получить обогащенный граф без сохранения

```graphql
query SkillGraph($professionName: String!, $isMock: Boolean) {
  skillGraph(professionName: $professionName, isMock: $isMock) {
    mainSkill { id title description }
    nodes { id title description learnHours }
    edges { fromId toId }
  }
}
```

Этот запрос использует логику `SkillGraphService`: получает исходный граф из graph-data-service и обогащает навыки курсами, книгами и статьями.

### Создать или загрузить сохраненный граф

```graphql
mutation CreateOrLoadGraph($input: CreateOrLoadGraphInput!) {
  createOrLoadGraph(input: $input) {
    id
    professionTitle
    mainSkill { id title description }
    nodes { id title isCompleted isRequired priority learnHours }
    edges { fromId toId }
    createdAt
    updatedAt
  }
}
```

Переменные:

```json
{
  "input": {
    "professionTitle": "Backend Developer",
    "isMock": true,
    "forceRegenerate": false
  }
}
```

Если сохраненный граф уже есть и `forceRegenerate = false`, вернется существующий граф.  
Если `forceRegenerate = true`, граф будет построен заново через `SkillGraphService` и перезаписан.

### Список сохраненных графов

```graphql
query SavedGraphs {
  savedGraphs {
    id
    professionTitle
    normalizedProfessionTitle
    createdAt
    updatedAt
  }
}
```

### Получить сохраненный граф

```graphql
query SavedGraph($graphId: String!) {
  savedGraph(graphId: $graphId) {
    id
    professionTitle
    nodes { id title }
    edges { fromId toId }
  }
}
```

Если граф принадлежит другому пользователю, обработчик вернет ошибку `Graph not found`.

### Обновить узел

```graphql
mutation UpdateGraphNode(
  $graphId: String!
  $nodeId: String!
  $input: UpdateGraphNodeInput!
) {
  updateGraphNode(graphId: $graphId, nodeId: $nodeId, input: $input) {
    node {
      id
      title
      description
      isCompleted
      isRequired
      isArchieved
      priority
      learnHours
    }
    skills
  }
}
```

Пример переменных:

```json
{
  "graphId": "...",
  "nodeId": "node-js",
  "input": {
    "description": "Среда выполнения для серверной разработки",
    "isCompleted": true,
    "priority": 2,
    "learnHours": 12
  }
}
```

`skills` — обновленный список изученных навыков пользователя. Он пересчитывается по всем сохраненным графам пользователя.

### Добавить узел

```graphql
mutation AddGraphNode($graphId: String!, $input: CreateGraphNodeInput!) {
  addGraphNode(graphId: $graphId, input: $input) {
    id
    nodes { id title }
  }
}
```

Переменные:

```json
{
  "graphId": "...",
  "input": {
    "title": "Docker",
    "description": "Контейнеризация приложений",
    "isRequired": true,
    "priority": 4,
    "learnHours": 8
  }
}
```

Бэкенд сам генерирует уникальный `id` по текущему шаблону `skill-*`.

### Удалить узел

```graphql
mutation DeleteGraphNode($graphId: String!, $nodeId: String!) {
  deleteGraphNode(graphId: $graphId, nodeId: $nodeId) {
    id
    nodes { id title }
    edges { fromId toId }
  }
}
```

Удаляется сам навык и все связанные с ним ребра.  
`mainSkill` удалить нельзя.

### Добавить связь

```graphql
mutation AddGraphEdge($graphId: String!, $input: GraphEdgeInput!) {
  addGraphEdge(graphId: $graphId, input: $input) {
    id
    edges { fromId toId }
  }
}
```

Переменные:

```json
{
  "graphId": "...",
  "input": {
    "fromId": "http",
    "toId": "node-js"
  }
}
```

Правила:

- оба узла должны существовать;
- `fromId` и `toId` должны быть разными;
- дубликаты связей запрещены;
- связь не должна создавать цикл;
- `mainSkill` может быть источником связи, но не может быть целью.

### Удалить связь

```graphql
mutation DeleteGraphEdge($graphId: String!, $input: GraphEdgeInput!) {
  deleteGraphEdge(graphId: $graphId, input: $input) {
    id
    edges { fromId toId }
  }
}
```

### Получить подграф

```graphql
query GraphSubgraph($graphId: String!, $nodeId: String!, $depth: Int!) {
  graphSubgraph(graphId: $graphId, nodeId: $nodeId, depth: $depth) {
    id
    nodes { id title }
    edges { fromId toId }
  }
}
```

`depth` должен быть неотрицательным целым числом. Бэкенд ограничивает глубину максимумом `5`.

## Ошибки

GraphQL возвращает ошибки в стандартном поле `errors`.

Типичные сообщения:

- `Authorization token is required`
- `Graph not found`
- `Graph node not found`
- `Graph edge not found`
- `Graph edge already exists`
- `Graph edge would create a cycle`
- `Main skill cannot be deleted`

## Проверки

После изменения Prisma schema:

```bash
bunx prisma generate
```

Проверка TypeScript:

```bash
bun run build
```

Тесты:

```bash
bun run test
```

Интеграционные тесты требуют `DATABASE_URL`. Если переменная не задана, набор тестов пропускается.

## Личный демонстрационный сценарий

Для ручной проверки сценариев редактирования есть запускаемый файл:

```text
backend/src/scripts/graphEditingDemo.ts
```

Демонстрационный сценарий поднимает приложение GraphQL внутри процесса, создает временного пользователя в MongoDB, выполняет операции редактирования графа и печатает подробный журнал `до/после`:

- создание/загрузка графа;
- состояние графа до редактирования;
- обновление узла;
- добавление узла `Docker`;
- добавление связи `Node.js -> Docker`;
- получение подграфа;
- удаление узла `Docker`;
- очистка демонстрационных данных из MongoDB.

Перед запуском нужен набор реплик MongoDB:

```bash
docker compose up -d mongo mongo-init
```

Запуск:

```bash
cd backend
DATABASE_URL='mongodb://localhost:27017/navigator?replicaSet=rs0&directConnection=true' JWT_SECRET='test-secret' bun run demo:graph-editing
```

Демонстрационный сценарий использует реальную MongoDB, но подменяет только graph-data-service, чтобы вывод был стабильным и не зависел от внешних API.

## Что покрывают тесты

`backend/src/graphql/resolvers/skillGraph.resolver.test.ts` проверяет:

- создание/загрузку графа через GraphQL-мутацию;
- доступ только к своим графам;
- обновление параметров узла;
- синхронизацию `user.skills`;
- добавление узла;
- добавление связи;
- запрет дубликатов связей;
- удаление узла с каскадным удалением ребер;
- получение подграфа.

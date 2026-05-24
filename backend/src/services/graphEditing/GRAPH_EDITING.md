# Редактирование графа через GraphQL

Документация описывает серверный интерфейс для построения, сохранения и редактирования пользовательского графа компетенций.

## Основной принцип

Все пользовательские операции с графом выполняются через точку входа GraphQL:

```http
POST /graphql
```

REST `/graphs` не является публичным интерфейсом для редактирования графа. Исключение — скачивание и загрузка графа во внешнем формате через `/graphs/:graphId/export` и `/graphs/import`.

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
- `backend/src/services/skillList/service.ts` — read-model для списочного представления сохраненного графа.
- `backend/src/services/graphExport/service.ts` — общий фасад экспорта и импорта графа.
- `backend/src/services/graphExport/RdfXmlGraphExporter.ts` и `TurtleGraphExporter.ts` — сериализация сохраненного графа в RDF/XML и Turtle.
- `backend/src/services/graphExport/RdfXmlGraphImporter.ts` и `TurtleGraphImporter.ts` — восстановление графа из RDF/XML и Turtle.
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
  initialMainSkill          MainSkill
  initialNodes              Skill[]
  initialEdges              SkillsRelation[]
  createdAt                 DateTime         @default(now())
  updatedAt                 DateTime         @updatedAt

  @@unique([userId, normalizedProfessionTitle])
}
```

`mainSkill` — целевая профессия.  
`nodes` — навыки.  
`edges` — зависимости между навыками.

Поля `mainSkill`, `nodes` и `edges` являются текущей редактируемой версией графа. Пользовательские изменения узлов и связей записываются только в эти поля.

Поля `initialMainSkill`, `initialNodes` и `initialEdges` хранят исходный полный граф, полученный сразу после построения. Этот исходный снимок не меняется при редактировании. При `forceRegenerate = true` граф строится заново, поэтому перезаписываются и текущая версия, и исходный снимок.

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

### Получить сохраненный граф списком

```graphql
query SavedGraphSkillList($graphId: String!) {
  savedGraphSkillList(graphId: $graphId) {
    graphId
    professionTitle
    currentPlan {
      priority
      skills { id title priority isCompleted isArchieved learnHours }
    }
    completedSkills { id title priority isCompleted isArchieved }
    archivedSkills { id title priority isCompleted isArchieved }
  }
}
```

Этот запрос использует те же сохраненные `nodes`, что и графическое представление, но возвращает их в виде read-model для списка:

- `currentPlan` — навыки без `isCompleted` и без `isArchieved`, сгруппированные по `priority`.
- `completedSkills` — навыки с `isCompleted = true`, если они не архивированы.
- `archivedSkills` — навыки с `isArchieved = true`.

Группы приоритетов и навыки внутри групп возвращаются в стабильном порядке, чтобы интерфейс мог отображать список без дополнительной бизнес-логики.

### Получить исходный снимок графа

```graphql
query InitialSavedGraph($graphId: String!) {
  initialSavedGraph(graphId: $graphId) {
    id
    professionTitle
    nodes { id title }
    edges { fromId toId }
  }
}
```

Запрос возвращает исходный вид графа. В ответе поля `nodes` и `edges` соответствуют сохраненным `initialNodes` и `initialEdges`.

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

### Сбросить граф к исходному виду

```graphql
mutation ResetGraphToInitial($graphId: String!) {
  resetGraphToInitial(graphId: $graphId) {
    id
    nodes { id title }
    edges { fromId toId }
    initialNodes { id title }
    initialEdges { fromId toId }
  }
}
```

Мутация копирует `initialMainSkill`, `initialNodes` и `initialEdges` в текущие поля `mainSkill`, `nodes` и `edges`. После сброса список изученных навыков пользователя пересчитывается по текущим графам.

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

## Экспорт графа в RDF/OWL

Экспорт выполняется через REST-точку входа на backend-порту `3000`:

```http
GET /graphs/:graphId/export?format=rdfxml
GET /graphs/:graphId/export?format=turtle
```

Нужен тот же заголовок авторизации:

```http
Authorization: Bearer <app-token>
```

Экспортируется текущая версия графа: `mainSkill`, `nodes`, `edges` и ресурсы внутри узлов. Поля исходного снимка `initialMainSkill`, `initialNodes`, `initialEdges` не используются.

Параметр `format`:

- `rdfxml` — RDF/XML, значение по умолчанию, файл `graph-<graphId>.owl`, `Content-Type: application/rdf+xml`;
- `turtle` — Turtle, файл `graph-<graphId>.ttl`, `Content-Type: text/turtle`.

Пример скачивания RDF/XML:

```bash
curl -L 'http://localhost:3000/graphs/GRAPH_ID/export?format=rdfxml' \
  -H 'Authorization: Bearer <app-token>' \
  -o graph.owl
```

Пример скачивания Turtle:

```bash
curl -L 'http://localhost:3000/graphs/GRAPH_ID/export?format=turtle' \
  -H 'Authorization: Bearer <app-token>' \
  -o graph.ttl
```

В RDF-модель попадают:

- сам граф как `nav:SkillGraph`;
- целевая профессия как `nav:MainSkill`;
- навыки как `nav:Skill`;
- связи обучения как `nav:requires` и `nav:dependsOn`;
- курсы, книги и статьи как `nav:Course`, `nav:Book`, `nav:Article`;
- пользовательские параметры узлов: `isCompleted`, `isRequired`, `isArchieved`, `priority`, `learnHours`.

Если граф не принадлежит пользователю, ответ будет `404 Graph not found`. Если передан неизвестный формат, ответ будет `400 Unsupported export format`.

## Импорт графа из RDF/OWL

Импорт выполняется через REST-точку входа на backend-порту `3000`:

```http
POST /graphs/import?format=rdfxml
POST /graphs/import?format=turtle
```

Точка входа создает новый граф для текущего пользователя. Существующий граф не перезаписывается. Если у пользователя уже есть граф с таким же названием профессии, сервер сохранит импортированный граф с безопасным названием вида `Backend Developer (import 2)`.

Нужен заголовок авторизации:

```http
Authorization: Bearer <app-token>
```

Тело запроса — содержимое файла RDF/XML или Turtle. Поддерживаемые `Content-Type`:

- `application/rdf+xml`;
- `application/xml`;
- `text/turtle`;
- `text/plain`.

Пример загрузки RDF/XML:

```bash
curl -X POST 'http://localhost:3000/graphs/import?format=rdfxml' \
  -H 'Authorization: Bearer <app-token>' \
  -H 'Content-Type: application/rdf+xml' \
  --data-binary @graph.owl
```

Пример загрузки Turtle:

```bash
curl -X POST 'http://localhost:3000/graphs/import?format=turtle' \
  -H 'Authorization: Bearer <app-token>' \
  -H 'Content-Type: text/turtle' \
  --data-binary @graph.ttl
```

Ответ `201` возвращает сохраненный `GraphResponse` с новым `id`. Импортированное состояние сразу записывается и как текущий граф, и как исходный снимок: `initialMainSkill`, `initialNodes`, `initialEdges`.

Перед сохранением сервер проверяет:

- наличие `nav:SkillGraph`, `nav:hasMainSkill` и хотя бы одного `nav:Skill`;
- обязательные поля профессии, главного навыка и узлов;
- уникальность идентификаторов узлов и ресурсов;
- корректность чисел, логических значений и ссылок ресурсов;
- отсутствие связей на неизвестные узлы.

Если передан неизвестный формат, ответ будет `400 Unsupported import format`. Если файл не удалось разобрать или граф не прошел проверку, ответ будет `400` с описанием ошибки.

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
- `Unsupported import format`
- `Invalid graph import content`
- `Edge references unknown target node: <nodeId>`

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

## Демонстрационный сценарий сохранения графа

Для ручного просмотра реального построения, записи в MongoDB и повторной загрузки добавлен файл:

```text
backend/src/scripts/graphBuildPersistenceDemo.ts
```

Он выводит подробный журнал:

- GraphQL-ответ после построения графа;
- документ `Graph`, прочитанный напрямую из MongoDB через Prisma;
- сравнение текущих `nodes/edges` с исходными `initialNodes/initialEdges`;
- изменение текущего графа;
- доказательство, что исходный снимок не изменился;
- сброс текущего графа к исходному виду;
- повторную загрузку через `createOrLoadGraph(forceRegenerate: false)`;
- очистку демонстрационных данных.

Этот сценарий не подменяет graph-data-service и вызывает реальную генерацию с `isMock: false`. Перед запуском должен быть доступен graph-data-service с рабочими переменными окружения, включая `HF_TOKEN` и `HF_MODEL_NAME`.

Запуск:

```bash
cd backend
DATABASE_URL='mongodb://localhost:27017/navigator?replicaSet=rs0&directConnection=true' JWT_SECRET='test-secret' bun run demo:graph-build-persistence
```

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
- получение подграфа;
- неизменность исходного снимка;
- сброс текущего графа к исходному виду.

# GraphQL API

## Endpoint

```
POST http://localhost:3000/graphql
Content-Type: application/json
```

## Запросы

### `skillGraph` — граф навыков по профессии

Возвращает граф с главным навыком (профессией), списком нод (скиллов) и рёбрами между ними. Каждый скилл обогащён курсами, книгами и статьями.

**Аргументы:**

| Аргумент | Тип | Описание |
|---|---|---|
| `professionName` | `String!` | Название профессии, например `"Backend Developer"` |

**Полный запрос:**

```graphql
query GetSkillGraph($professionName: String!) {
  skillGraph(professionName: $professionName) {
    mainSkill {
      id
      title
      description
    }
    nodes {
      id
      title
      description
      isCompleted
      isRequired
      isArchieved
      priority
      learnHours
      courses {
        id
        title
        description
        link
        image
        learningTimeInfo {
          minHours
          avgHours
          maxHours
          coursesAnalyzed
        }
      }
      books {
        id
        title
        author
        description
        link
        image
      }
      articles {
        title
        description
        link
        rating
        tags
      }
    }
    edges {
      fromId
      toId
    }
  }
}
```

**Переменные:**

```json
{
  "professionName": "Backend Developer"
}
```

---

## Примеры вызова

### curl

Минимальный запрос:

```bash
curl -X POST <APP.SOURCE>/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "query GetSkillGraph($professionName: String!) { skillGraph(professionName: $professionName) { mainSkill { id title } nodes { id title learnHours } edges { fromId toId } } }",
    "variables": { "professionName": "Backend Developer" }
  }'
```

Запрос со всеми полями:

```bash
curl -X POST <APP.SOURCE>/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "query GetSkillGraph($professionName: String!) { skillGraph(professionName: $professionName) { mainSkill { id title description } nodes { id title description isCompleted isRequired isArchieved priority learnHours courses { id title description link image learningTimeInfo { minHours avgHours maxHours coursesAnalyzed } } books { id title author description link image } articles { title description link rating tags } } edges { fromId toId } } }",
    "variables": { "professionName": "Backend Developer" }
  }'
```

### fetch (TypeScript/JavaScript)

```typescript
const query = `
  query GetSkillGraph($professionName: String!) {
    skillGraph(professionName: $professionName) {
      mainSkill {
        id
        title
        description
      }
      nodes {
        id
        title
        description
        learnHours
        courses {
          id
          title
          link
          learningTimeInfo {
            avgHours
          }
        }
        books {
          id
          title
          author
          link
        }
        articles {
          title
          link
          rating
          tags
        }
      }
      edges {
        fromId
        toId
      }
    }
  }
`;

const response = await fetch("<APP.SOURCE>/graphql", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    query,
    variables: { professionName: "Backend Developer" },
  }),
});

const { data } = await response.json();
console.log(data.skillGraph);
```

---

## Схема типов

```graphql
type Query {
  skillGraph(professionName: String!): SkillGraph!
}

type SkillGraph {
  mainSkill: MainSkill!
  nodes: [Skill!]!
  edges: [SkillsRelation!]!
}

type MainSkill {
  id: String!
  title: String!
  description: String!
}

type Skill {
  id: String!
  title: String!
  description: String!
  isCompleted: Boolean!
  isRequired: Boolean!
  isArchieved: Boolean!
  priority: Int!
  learnHours: Float!
  courses: [Course!]
  books: [Book!]
  articles: [Article!]
}

type SkillsRelation {
  fromId: String!
  toId: String!
}

type Course {
  id: String!
  title: String!
  description: String!
  link: String!
  image: String
  learningTimeInfo: LearningTimeInfo!
}

type LearningTimeInfo {
  minHours: Float!
  avgHours: Float!
  maxHours: Float!
  coursesAnalyzed: Int!
}

type Book {
  id: String!
  title: String!
  author: String!
  description: String!
  link: String!
  image: String
}

type Article {
  title: String!
  description: String!
  link: String!
  rating: Float!
  tags: [String!]!
}
```


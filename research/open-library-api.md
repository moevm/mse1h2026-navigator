# OpenLibrary API — исследование для поиска книг по технологиям

---

**Сайт:** https://openlibrary.org  
**Документация:** https://openlibrary.org/developers/api  
**Аутентификация:** не требуется  

---

## Доступные эндпоинты

### 1. Search API — `/search.json`

Основной эндпоинт для поиска книг.

**Базовый URL:** `https://openlibrary.org/search.json`

| Параметр | Описание | Пример |
|---|---|---|
| `title` | Поиск по названию | `title=javascript` |
| `subject` | Поиск по теме | `subject=machine+learning` |
| `q` | Полнотекстовый поиск | `q=react` |
| `author` | Поиск по автору | `author=robert+martin` |
| `fields` | Ограничение возвращаемых полей | `fields=title,author_name,cover_i` |
| `limit` | Количество результатов (по умолчанию 10, макс. 100) | `limit=20` |
| `offset` | Смещение для пагинации | `offset=20` |
| `sort` | Сортировка (`editions`, `old`, `new`, `key`, `random`) | `sort=new` |
| `lang` | Предпочтительный язык | `lang=eng` |

Комбинирование параметров: `q=react&subject=javascript`

---

### 2. Subjects API — `/subjects/{subject}.json`

Поиск книг по точной теме.

**Базовый URL:** `https://openlibrary.org/subjects/{subject}.json`

| Параметр | Описание | Пример |
|---|---|---|
| `limit` | Количество результатов | `limit=20` |
| `offset` | Смещение | `offset=0` |
| `ebooks` | Только с электронным доступом | `ebooks=true` |

**Важно:** subject указывается в нижнем регистре, пробелы заменяются на `_`.  
Примеры: `javascript`, `python`, `machine_learning`, `docker`, `kubernetes`

---

### 3. Works API — `/works/{id}.json`

Получение полной информации о конкретной книге, включая описание и ссылки.
**Пример:** `https://openlibrary.org/works/OL15444205W.json`

---

## Маппинг нужных полей

| Нужное поле | Источник в OpenLibrary | Примечание |
|---|---|---|
| Название | `title` | Всегда присутствует |
| Автор | `author_name[]` | Массив, присутствует почти всегда |
| Описание | `description` | **Нестабильно** в search.json; надёжнее через `/works/{key}.json` |
| Обложка | `cover_i` | ID обложки → URL ниже |
| Ссылка на чтение | `public_scan_b`, `ia[]`, `ebook_access` | Логика формирования URL — ниже |

### Формирование URL обложки

```
https://covers.openlibrary.org/b/id/{cover_i}-{size}.jpg
```

Размеры: `S` (small), `M` (medium), `L` (large)

Пример:
```
https://covers.openlibrary.org/b/id/10737959-L.jpg   ← JavaScript: Definitive Guide
https://covers.openlibrary.org/b/id/7082166-L.jpg    ← Eloquent JavaScript
```

### Логика формирования ссылки на чтение

| Значение `ebook_access` | Значение `public_scan_b` | Доступ | Ссылка |
|---|---|---|---|
| `public` | `true` | Бесплатно, без регистрации | `https://archive.org/details/{ia[0]}` |
| `borrowable` | `false` | Займ на 1 час, **нужна регистрация** | `https://openlibrary.org{key}` |
| `printdisabled` | `false` | Только для людей с ограниченными возможностями | `https://openlibrary.org{key}` |
| `no_ebook` | `false` | Только физическая копия | — |

Страница книги всегда доступна по: `https://openlibrary.org{key}`  
Пример: `https://openlibrary.org/works/OL15444205W`

---

## Тестовые запросы и ответы

### Запрос 1 — Поиск по названию: `title=javascript`

```
GET https://openlibrary.org/search.json?title=javascript&limit=2&fields=title,author_name,cover_i,key,description,ebook_access,ia,has_fulltext,public_scan_b,first_publish_year,subject
```

**Ответ:**
```json
{
  "numFound": 1708,
  "docs": [
    {
      "author_name": ["David Flanagan"],
      "cover_i": 10737959,
      "ebook_access": "borrowable",
      "first_publish_year": 1996,
      "has_fulltext": true,
      "ia": ["javascriptdefini00flan"],
      "key": "/works/OL1643770W",
      "public_scan_b": false,
      "subtitle": "The Definitive Guide",
      "title": "JavaScript"
    },
    {
      "author_name": ["Marijn Haverbeke"],
      "cover_i": 7082166,
      "ebook_access": "public",
      "first_publish_year": 2009,
      "has_fulltext": true,
      "ia": ["2018eloquentjavascript"],
      "key": "/works/OL15444205W",
      "public_scan_b": true,
      "title": "Eloquent Javascript"
    }
  ]
}
```

**Результат маппинга для "Eloquent Javascript":**
| Поле | Значение |
|---|---|
| Название | Eloquent Javascript |
| Автор | Marijn Haverbeke |
| Ссылка на чтение | https://archive.org/details/2018eloquentjavascript *(бесплатно)* |
| Обложка | https://covers.openlibrary.org/b/id/7082166-L.jpg |
| Описание | Доступно через `/works/OL15444205W.json` |

---

### Запрос 2 — Поиск по subject: `subject=machine+learning`

```
GET https://openlibrary.org/search.json?subject=machine+learning&limit=2&fields=title,author_name,cover_i,key,description,ebook_access,ia,has_fulltext,public_scan_b,first_publish_year
```

**Ответ:**
```json
{
  "numFound": 1794,
  "docs": [
    {
      "author_name": ["Aurélien Géron"],
      "cover_i": 9388208,
      "ebook_access": "no_ebook",
      "first_publish_year": 2019,
      "has_fulltext": false,
      "key": "/works/OL20709638W",
      "public_scan_b": false,
      "title": "Hands-On Machine Learning with Scikit-Learn, Keras, and TensorFlow",
      "description": "Through a series of recent breakthroughs, deep learning has boosted the entire field of machine learning..."
    },
    {
      "author_name": ["Ian Goodfellow", "Yoshua Bengio", "Aaron Courville", "Francis Bach"],
      "cover_i": 8086288,
      "ebook_access": "printdisabled",
      "first_publish_year": 2016,
      "has_fulltext": true,
      "ia": ["deeplearning0000good"],
      "key": "/works/OL17801809W",
      "public_scan_b": false,
      "title": "Deep Learning",
      "description": "\"Deep learning is a form of machine learning that enables computers to learn from experience...\""
    }
  ]
}
```

> **Наблюдение:** при поиске по `subject` описание (`description`) возвращается прямо в search.json значительно чаще, чем при поиске по `title`.

---

### Запрос 3 — Поиск по названию: `title=clean+code`

```
GET https://openlibrary.org/search.json?title=clean+code&limit=2&fields=title,author_name,cover_i,key,description,ebook_access,ia,has_fulltext,public_scan_b,first_publish_year,subject
```

**Ответ:**
```json
{
  "numFound": 50,
  "docs": [
    {
      "author_name": ["Robert C. Martin"],
      "cover_i": 8065615,
      "ebook_access": "printdisabled",
      "first_publish_year": 2008,
      "has_fulltext": true,
      "ia": ["cleancodehandboo0000unse"],
      "key": "/works/OL17618370W",
      "public_scan_b": false,
      "title": "Clean Code",
      "subject": ["Agile software development", "Reliability", "Computer software", "Coding theory"]
    },
    {
      "author_name": ["Mariano Anaya"],
      "cover_i": 10541843,
      "ebook_access": "no_ebook",
      "first_publish_year": 2018,
      "has_fulltext": false,
      "key": "/works/OL24143787W",
      "public_scan_b": false,
      "title": "Clean Code in Python"
    }
  ]
}
```

---

### Запрос 4 — Subjects endpoint: `javascript`

```
GET https://openlibrary.org/subjects/javascript.json?limit=2
```

**Ответ (сокращён):**
```json
{
  "key": "/subjects/javascript",
  "name": "javascript",
  "work_count": 207,
  "works": [
    {
      "key": "/works/OL1701007W",
      "title": "Learning Perl",
      "cover_id": 805582,
      "authors": [{"key": "/authors/OL193717A", "name": "Randal L. Schwartz"}],
      "first_publish_year": 1993,
      "has_fulltext": true,
      "availability": {
        "status": "borrow_available",
        "available_to_browse": true,
        "available_to_borrow": false,
        "is_previewable": true,
        "identifier": "learningperl00schw"
      }
    }
  ]
}
```

---

### Запрос 5 — Works API для получения описания и ссылок

```
GET https://openlibrary.org/works/OL15444205W.json
```

**Ответ (сокращён):**
```json
{
  "title": "Eloquent Javascript",
  "description": "\"Eloquent JavaScript is a book providing an introduction to the JavaScript programming language and programming in general.\"",
  "covers": [7082166, 8508178, 8513405],
  "subjects": ["JavaScript (Computer program language)", "Computer science", "JavaScript"],
  "links": [
    {
      "title": "Full Text HTML",
      "url": "http://eloquentjavascript.net/contents.html"
    },
    {
      "title": "Goodreads (Work)",
      "url": "https://www.goodreads.com/work/editions/13787033"
    }
  ]
}
```

> Works API иногда содержит `links[]` с прямой ссылкой на онлайн-версию книги (например, сайт автора или бесплатный HTML).
---

## Рекомендуемый алгоритм получения данных

```
1. Запрос: GET /search.json?title={query}&fields=...
   ИЛИ:    GET /search.json?subject={topic}&fields=...
   ИЛИ:    GET /search.json?q={query}&subject={topic}&fields=...

2. Для каждой книги:
   a. title        ← docs[i].title
   b. author       ← docs[i].author_name.join(', ')
   c. cover_url    ← "https://covers.openlibrary.org/b/id/{cover_i}-L.jpg"  (если cover_i есть)
   d. description  ← docs[i].description  (если есть)
                     ИНАЧЕ → доп. запрос GET /works/{key}.json → .description
   e. read_url     ← если public_scan_b = true  → "https://archive.org/details/{ia[0]}"
                     если ebook_access = "borrowable" → "https://openlibrary.org{key}"
                     иначе → "https://openlibrary.org{key}"  (страница книги)
```
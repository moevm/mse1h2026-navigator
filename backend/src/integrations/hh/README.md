# HeadHunter (HH.ru) Integration

Интеграция с API HeadHunter для поиска вакансий и анализа требований к профессиям.

##  Структура

```
hh/
├── index.ts              # Public API - экспорт основных классов и типов
├── HHClient.ts          # Основной класс с бизнес-логикой
├── api/
│   ├── wrapper.ts       # HTTP-клиент для работы с HH API
│   ├── types.ts         # Все типы и интерфейсы
│   └── TYPES_README.md  # Документация по типам
└── README.md           # Этот файл
```

### Настройка переменных окружения

Создайте файл `.env` в корне `backend/`:

```env
USER_AGENT="YourAppName/1.0.0 (your-email@example.com)"
```

> **Важно:** Согласно [правилам API HH.ru](https://github.com/hhru/api/blob/master/docs/general.md#user-agent), в `USER_AGENT` должно быть название вашего приложения и контактный email.

### Использование

```typescript
import { HHClient } from './integrations/hh';
import { HHApiWrapper } from './integrations/hh/api/wrapper';

// Создаем клиент
const apiWrapper = new HHApiWrapper();
const hhClient = new HHClient(apiWrapper);

// Поиск навыков для профессии
const skills = await hhClient.findVacancySkillsForProfession('Frontend разработчик');
console.log('Навыки:', skills);

// Получение детальной информации о вакансиях
const vacancies = await hhClient.getVanaciesForProfessionDetails({
  text: 'Python developer',
  area: '1', // Москва
  per_page: 20
});

vacancies.forEach(v => {
  console.log(v.name, v.employer.name);
  console.log('Навыки:', v.key_skills.map(s => s.name).join(', '));
});
```

### HHClient

Основной класс для работы с HH.ru API. Содержит только публичные методы для выполнения полноценных бизнес-флоу.

#### Конструктор

```typescript
constructor(api: HHApiWrapper)
```

**Параметры:**
- `api` - экземпляр `HHApiWrapper` для выполнения HTTP-запросов

#### Методы

##### `findVacancySkillsForProfession(profession: string): Promise<string[]>`

Поиск навыков для заданной профессии.

**Параметры:**
- `profession` - название профессии для поиска (например, "Frontend разработчик")

**Возвращает:**
- Массив уникальных навыков, найденных в вакансиях

**Пример:**
```typescript
const skills = await hhClient.findVacancySkillsForProfession('Backend developer');
// ['Python', 'Django', 'PostgreSQL', 'Docker', ...]
```

**Логика работы:**
1. Ищет вакансии по ключевому слову (первые 10 результатов)
2. Для каждой вакансии получает детальную информацию
3. Собирает все ключевые навыки (поле `key_skills`)
4. Возвращает уникальный список навыков

---

##### `getVanaciesForProfessionDetails(params: VacancySearchParams): Promise<VacancyDetail[]>`

Получение детальной информации о вакансиях по параметрам поиска.

**Параметры:**
- `params` - объект параметров поиска (см. `VacancySearchParams` в types.ts)

**Возвращает:**
- Массив вакансий с полной детальной информацией

**Пример:**
```typescript
const vacancies = await hhClient.getVanaciesForProfessionDetails("Data Scientist");

vacancies.forEach(v => {
  console.log(`${v.name} в ${v.employer.name}`);
  console.log(`Описание: ${v.description}`);
  console.log(`Навыки: ${v.key_skills.map(s => s.name).join(', ')}`);
});
```

**Логика работы:**
1. Выполняет поиск вакансий с заданными параметрами
2. Для каждой вакансии из результатов получает детальную информацию
3. Возвращает массив полных данных о вакансиях

---

### HHApiWrapper

HTTP-клиент для выполнения запросов к HH.ru API. Инкапсулирует работу с axios и обработку запросов.

#### Конструктор

```typescript
constructor(
  baseURL: string = 'https://api.hh.ru',
  timeout: number = 10000
)
```

**Параметры:**
- `baseURL` - базовый URL API (по умолчанию: `https://api.hh.ru`)
- `timeout` - таймаут запросов в миллисекундах (по умолчанию: 10000)

#### Методы

##### `searchVacancies(params: VacancySearchParams): Promise<VacancySearchResponse>`

Поиск вакансий через API endpoint `/vacancies`.

**Параметры:**
- `params` - параметры поиска (см. документацию типов)

**Возвращает:**
- Объект с результатами поиска:
  - `items` - массив вакансий
  - `found` - всего найдено
  - `pages` - количество страниц
  - `page` - текущая страница
  - `per_page` - элементов на странице

**Пример:**
```typescript
const result = await apiWrapper.searchVacancies({
  text: 'Java developer',
  area: '2',  // Санкт-Петербург
  per_page: 100
});

console.log(`Найдено ${result.found} вакансий`);
console.log(`Показано ${result.items.length} на странице`);
```

---

##### `getVacancyDetail(vacancyId: string): Promise<VacancyDetail>`

Получение детальной информации о вакансии по ID через endpoint `/vacancies/{id}`.

**Параметры:**
- `vacancyId` - идентификатор вакансии

**Возвращает:**
- Полная информация о вакансии включая:
  - Описание в HTML
  - Ключевые навыки
  - Контакты (если доступны)
  - Требуемые языки
  - Тестовые задания
  - И многое другое (см. `VacancyDetail` в types.ts)

**Пример:**
```typescript
const vacancy = await apiWrapper.getVacancyDetail('130624048');

console.log(vacancy.name);
console.log(vacancy.description);
console.log(vacancy.key_skills.map(s => s.name));
console.log(vacancy.employer.name);
```

---

##### `get<T>(url: string, config?: AxiosRequestConfig): Promise<T>`

Универсальный метод для GET-запросов.

##### `post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>`

Универсальный метод для POST-запросов.
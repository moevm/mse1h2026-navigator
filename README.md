# Navigator

## Требования

- [Docker](https://docs.docker.com/get-docker/) и Docker Compose
- [Node.js](https://nodejs.org/) >= 18 (для frontend)

## Установка и запуск

### 1. Настройка переменных окружения

```bash
cp backend/.env.example backend/.env
cp graph-data-service/.env.example graph-data-service/.env
```

Заполните значения в созданных `.env` файлах.

### 2. Быстрый запуск (все сервисы)

```bash
chmod +x start.sh
./start.sh
```

### 3. Запуск по отдельности

**Backend + MongoDB:**

```bash
docker compose up -d --build
```

**Graph Data Service:**

```bash
docker compose -f graph-data-service/docker-compose.yaml up -d --build
```

**Frontend (dev-режим):**

```bash
cd frontend
npm install
npm run dev
```

## Проверка работоспособности

После запуска сервисы доступны по адресам:

| Сервис | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:3000 |
| Health check | http://localhost:3000/health |

```bash
curl http://localhost:3000/health
```

## Остановка

```bash
docker compose down
docker compose -f graph-data-service/docker-compose.yaml down
```

FROM python:3.11-slim as builder
WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

COPY requirements.txt .
RUN pip wheel --no-cache-dir --no-deps --wheel-dir /app/wheels -r requirements.txt

FROM python:3.11-slim
WORKDIR /app

RUN addgroup --system app && adduser --system --group app

COPY --from=builder /app/wheels /wheels
RUN pip install --no-cache /wheels/*

COPY . .
RUN chown -R app:app /app
USER app

ENV APP_PORT=8000

CMD uvicorn main:app --host 0.0.0.0 --port ${APP_PORT} --proxy-headers

FROM oven/bun:1

WORKDIR /app

COPY package.json bun.lock ./

RUN bun install

COPY . .

RUN bun run build

ENV PORT=3000

EXPOSE 3000

CMD ["bun", "run", "start"]

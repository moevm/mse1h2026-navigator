import "reflect-metadata";
import dotenv from "dotenv";
import { createApp } from "./app";

dotenv.config();

const PORT: number = Number(process.env.PORT) || 3000;

async function bootstrap() {
  const app = await createApp();

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`GraphQL playground: http://localhost:${PORT}/graphql`);
  });
}

bootstrap();

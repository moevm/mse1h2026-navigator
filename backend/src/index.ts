import "reflect-metadata";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { healthRouter } from "./routers/health";
import { habrRouter } from "./routers/habr";
import { wikipediaRouter } from "./routers/wikipedia";
import { createSchema } from "./graphql/schema";

dotenv.config();

const PORT: number = Number(process.env.PORT) || 3000;

async function bootstrap() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  const schema = await createSchema();
  const apolloServer = new ApolloServer({ schema });
  await apolloServer.start();

  app.use("/graphql", cors(), express.json(), expressMiddleware(apolloServer) as any);

  app.use("/health", healthRouter);
  app.use("/habr", habrRouter);
  app.use("/wikipedia", wikipediaRouter);

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`GraphQL playground: http://localhost:${PORT}/graphql`);
  });
}

bootstrap();

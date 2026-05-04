import "reflect-metadata";
import express from "express";
import cors from "cors";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { healthRouter } from "./routers/health";
import { habrRouter } from "./routers/habr";
import { wikipediaRouter } from "./routers/wikipedia";
import { authRouter } from "./routers/auth";
import { graphsRouter } from "./routers/graphs";
import { setupContainer } from "./container";
import { createSchema } from "./graphql/schema";
import { createGraphQLContext } from "./graphql/context";

export async function createApp(): Promise<express.Express> {
  setupContainer();

  const app = express();
  app.use(cors());
  app.use(express.json());

  const schema = await createSchema();
  const apolloServer = new ApolloServer({ schema });
  await apolloServer.start();

  app.use(
    "/graphql",
    cors(),
    express.json(),
    expressMiddleware(apolloServer, {
      context: createGraphQLContext,
    }) as unknown as express.RequestHandler
  );

  app.use("/health", healthRouter);
  app.use("/habr", habrRouter);
  app.use("/wikipedia", wikipediaRouter);
  app.use("/auth", authRouter);
  app.use("/graphs", graphsRouter);

  return app;
}

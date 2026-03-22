import "reflect-metadata";
import { container } from "tsyringe";
import { buildSchema } from "type-graphql";
import { GraphQLSchema } from "graphql";
import { SkillGraphResolver } from "./resolvers/skillGraph.resolver";

export async function createSchema(): Promise<GraphQLSchema> {
  return buildSchema({
    resolvers: [SkillGraphResolver],
    validate: false,
    container: { get: (cls) => container.resolve(cls) },
  });
}

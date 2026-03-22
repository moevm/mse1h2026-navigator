import "reflect-metadata";
import { buildSchema } from "type-graphql";
import { GraphQLSchema } from "graphql";
import { SkillGraphResolver } from "./resolvers/skillGraph.resolver";

export async function createSchema(): Promise<GraphQLSchema> {
  return buildSchema({
    resolvers: [SkillGraphResolver],
    validate: false,
  });
}

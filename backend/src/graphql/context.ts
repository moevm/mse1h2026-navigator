import type { User } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { verifyAppToken } from "../lib/token";

export interface GraphQLContext {
  user: User | null;
}

interface ContextParams {
  req: {
    header(name: string): string | undefined;
  };
}

export async function createGraphQLContext({
  req,
}: ContextParams): Promise<GraphQLContext> {
  const authHeader = req.header("authorization");
  const [scheme, token] = authHeader?.split(" ") ?? [];

  if (scheme !== "Bearer" || !token) {
    return { user: null };
  }

  const payload = verifyAppToken(token);
  if (!payload) {
    return { user: null };
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  return { user };
}

export function requireGraphQLUser(context: GraphQLContext): User {
  if (!context.user) {
    throw new Error("Authorization token is required");
  }

  return context.user;
}

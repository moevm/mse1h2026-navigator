import type { NextFunction, Request, Response } from "express";
import type { User } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { verifyAppToken } from "../lib/token";

export interface AuthenticatedRequest extends Request {
  user: User;
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.header("authorization");
  const [scheme, token] = authHeader?.split(" ") ?? [];

  if (scheme !== "Bearer" || !token) {
    res.status(401).json({ error: "Authorization token is required" });
    return;
  }

  const payload = verifyAppToken(token);
  if (!payload) {
    res.status(401).json({ error: "Invalid or expired authorization token" });
    return;
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }

  (req as AuthenticatedRequest).user = user;
  next();
}

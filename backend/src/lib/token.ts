import { createHmac, timingSafeEqual } from "crypto";

const DEFAULT_EXPIRES_IN_SECONDS = 60 * 60 * 24 * 30;

interface TokenPayload {
  sub: string;
  iat: number;
  exp: number;
}

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is required");
  }
  return secret;
}

function base64UrlEncode(value: string): string {
  return Buffer.from(value).toString("base64url");
}

function base64UrlDecode(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8");
}

function sign(input: string): string {
  return createHmac("sha256", getJwtSecret()).update(input).digest("base64url");
}

export function createAppToken(userId: string): string {
  const now = Math.floor(Date.now() / 1000);
  const header = base64UrlEncode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = base64UrlEncode(
    JSON.stringify({
      sub: userId,
      iat: now,
      exp: now + DEFAULT_EXPIRES_IN_SECONDS,
    } satisfies TokenPayload)
  );
  const signature = sign(`${header}.${payload}`);

  return `${header}.${payload}.${signature}`;
}

export function verifyAppToken(token: string): TokenPayload | null {
  const [header, payload, signature] = token.split(".");
  if (!header || !payload || !signature) {
    return null;
  }

  const expectedSignature = sign(`${header}.${payload}`);
  const signatureBuffer = Buffer.from(signature);
  const expectedSignatureBuffer = Buffer.from(expectedSignature);

  if (signatureBuffer.length !== expectedSignatureBuffer.length) {
    return null;
  }

  if (!timingSafeEqual(signatureBuffer, expectedSignatureBuffer)) {
    return null;
  }

  try {
    const parsedPayload = JSON.parse(base64UrlDecode(payload)) as Partial<TokenPayload>;
    if (
      typeof parsedPayload.sub !== "string" ||
      typeof parsedPayload.iat !== "number" ||
      typeof parsedPayload.exp !== "number"
    ) {
      return null;
    }

    const now = Math.floor(Date.now() / 1000);
    if (parsedPayload.exp <= now) {
      return null;
    }

    return {
      sub: parsedPayload.sub,
      iat: parsedPayload.iat,
      exp: parsedPayload.exp,
    };
  } catch {
    return null;
  }
}

import { Router, Request, Response } from "express";
import axios, { AxiosError } from "axios";
import { createHash } from "crypto";
import { YandexUserInfo, YandexApiError, AuthResponse } from "./types";

export const router = Router();

function hashId(id: string): string {
  return createHash("sha256").update(id).digest("hex");
}

function buildAvatarUrl(avatarId: string, isAvatarEmpty: boolean): string {
  if (isAvatarEmpty) {
    return "";
  }
  return `https://avatars.yandex.net/get-yapic/${avatarId}/islands-200`;
}

router.post("/", async (req: Request, res: Response): Promise<void> => {
  const { oauthToken } = req.body as { oauthToken?: string };

  if (!oauthToken || typeof oauthToken !== "string" || oauthToken.trim().length === 0) {
    res.status(400).json({ error: "OAuth token is required" });
    return;
  }

  try {
    const response = await axios.get<YandexUserInfo>(
      "https://login.yandex.ru/info",
      {
        headers: {
          Authorization: `OAuth ${oauthToken}`,
        },
        params: { format: "json" },
        timeout: 10000,
        validateStatus: (status) => status < 500,
      }
    );

    if (response.status === 401) {
      res.status(401).json({ error: "Invalid or expired OAuth token" });
      return;
    }

    if (response.status === 403) {
      res.status(403).json({ error: "Access denied. Check OAuth token permissions" });
      return;
    }

    if (response.status !== 200 || !response.data) {
      res.status(502).json({ error: "Failed to get user info from Yandex" });
      return;
    }

    const yandexUser = response.data;

    // TODO: save user to the database

    const authResponse: AuthResponse = {
      id: hashId(yandexUser.id),
      username: yandexUser.login,
      firstName: yandexUser.first_name,
      lastName: yandexUser.last_name,
      avatarUrl: buildAvatarUrl(yandexUser.default_avatar_id, yandexUser.is_avatar_empty),
    };

    res.json(authResponse);
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<YandexApiError>;

      if (axiosError.response) {
        const status = axiosError.response.status;
        const data = axiosError.response.data;

        if (status === 401) {
          res.status(401).json({ error: "Invalid or expired OAuth token" });
          return;
        }

        if (status === 403) {
          res.status(403).json({ error: "Access denied. Check OAuth token permissions" });
          return;
        }

        const errorMessage = data?.error_description || data?.error || "Unknown error";
        res.status(502).json({ error: `Yandex API error (${status}): ${errorMessage}` });
        return;
      }

      if (axiosError.request) {
        res.status(502).json({ error: "No response from Yandex API" });
        return;
      }
    }

    res.status(500).json({ error: "Internal server error" });
  }
});

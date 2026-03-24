import axios from "axios";
import { Request, Response, Router } from "express";
import { HabrApiClient } from "../../integrations/habr";

const habrClient = new HabrApiClient();

export const router = Router();

router.get("/", async (req: Request, res: Response) => {
  try {
    const query = typeof req.query.query === "string" ? req.query.query : undefined;
    const articles = await habrClient.getParsedArticles(query);

    res.json({ articles });
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("Failed to fetch habr articles:", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
    } else {
      console.error("Failed to fetch habr articles:", error);
    }

    res.status(500).json({ message: "Failed to fetch habr articles" });
  }
});
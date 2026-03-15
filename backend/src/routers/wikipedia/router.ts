import axios from "axios";
import { Request, Response, Router } from "express";
import { WikipediaApiClient } from "../../integrations/wikipedia";

const wikipediaClient = new WikipediaApiClient();

export const router = Router();

router.get("/", async (req: Request, res: Response) => {
  try {
    const gsrsearch =
      typeof req.query.gsrsearch === "string" ? req.query.gsrsearch : undefined;
    const article = await wikipediaClient.getArticleExtract(gsrsearch);

    res.json({
      extract: article.extract,
      imageSrc: article.imageSrc,
    });
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("Failed to fetch wikipedia article extract:", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
    } else {
      console.error("Failed to fetch wikipedia article extract:", error);
    }

    res.status(500).json({ message: "Failed to fetch wikipedia article extract" });
  }
});

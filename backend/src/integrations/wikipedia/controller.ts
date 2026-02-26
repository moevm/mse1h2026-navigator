import type { Request, Response } from "express";
import axios from "axios";
import { WikipediaService } from "./service";

export class WikipediaController {
  constructor(private readonly service: WikipediaService) {}

  public getArticleExtract = async (req: Request, res: Response): Promise<void> => {
    try {
      const gsrsearch = typeof req.query.gsrsearch === "string" ? req.query.gsrsearch : undefined;
      const extract = await this.service.getArticleExtract(gsrsearch);

      res.json({ extract });
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
  };
}

import axios from "axios";
import type { WikipediaApiResponse, WikipediaRequestParams } from "./types";

export class WikipediaRepository {
  private readonly apiUrl = "https://ru.wikipedia.org/w/api.php";
  private readonly userAgent =
    process.env.WIKIPEDIA_USER_AGENT ||
    "mse1h2026-navigator/1.0 (educational project; contact: local-dev)";

  public async findArticleIntroExtract(gsrsearch: string): Promise<WikipediaApiResponse> {
    const params: WikipediaRequestParams = {
      action: "query",
      generator: "search",
      gsrsearch,
      gsrlimit: 1,
      prop: "extracts",
      exintro: 1,
      explaintext: 1,
      origin: "*",
      format: "json",
    };

    const { data } = await axios.get<WikipediaApiResponse>(this.apiUrl, {
      params,
      timeout: 10000,
      headers: {
        "User-Agent": this.userAgent,
        "Api-User-Agent": this.userAgent,
      },
    });

    return data;
  }
}

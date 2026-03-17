import axios, { AxiosRequestConfig } from "axios";

import { WikipediaArticleExtract } from "./basic.types";
import { WikipediaSearchExtractRequest } from "./request.types";
import {
  WikipediaApiResponse,
  WikipediaMediaListResponse,
} from "./response.types";

export class WikipediaApiClient {
  private readonly apiUrl = "https://ru.wikipedia.org/w/api.php";
  private readonly restApiUrl = "https://ru.wikipedia.org/api/rest_v1";
  private readonly defaultSearchValue = "python";
  private readonly defaultLimit = 1;
  private readonly timeoutMs = 10_000;
  private readonly userAgent =
    process.env.WIKIPEDIA_USER_AGENT ||
    "mse1h2026-navigator/1.0 (educational project; contact: local-dev)";

  public async searchArticlesByName(
    gsrsearch: string,
    gsrlimit: number = this.defaultLimit,
  ): Promise<WikipediaApiResponse> {
    const params: WikipediaSearchExtractRequest = {
      action: "query",
      generator: "search",
      gsrsearch,
      gsrlimit,
      prop: "extracts",
      exintro: 1,
      explaintext: 1,
      origin: "*",
      format: "json",
    };

    return this.request<WikipediaApiResponse>({
      method: "GET",
      url: this.apiUrl,
      params,
    });
  }

  public async getArticleExtract(
    gsrsearch?: string,
  ): Promise<WikipediaArticleExtract> {
    const searchValue = gsrsearch?.trim() || this.defaultSearchValue;
    const response = await this.searchArticlesByName(searchValue);
    const firstPage = response.query ? Object.values(response.query.pages)[0] : undefined;

    if (!firstPage) {
      return {
        pageId: null,
        title: "",
        extract: "",
        imageSrc: "",
      };
    }

    const imageSrc = await this.getFirstArticleImageSrc(firstPage.title);

    return {
      pageId: firstPage.pageid,
      title: firstPage.title,
      extract: firstPage.extract,
      imageSrc,
    };
  }

  public async getArticleMediaList(title: string): Promise<WikipediaMediaListResponse> {
    return this.request<WikipediaMediaListResponse>({
      method: "GET",
      url: `${this.restApiUrl}/page/media-list/${encodeURIComponent(title)}`,
    });
  }

  private async getFirstArticleImageSrc(title: string): Promise<string> {
    try {
      const mediaList = await this.getArticleMediaList(title);
      const rawSrc = mediaList.items[0]?.srcset?.[0]?.src;

      if (!rawSrc) {
        return "";
      }

      return rawSrc.startsWith("//") ? `https:${rawSrc}` : rawSrc;
    } catch {
      return "";
    }
  }

  private async request<TResponse>(
    config: AxiosRequestConfig,
  ): Promise<TResponse> {
    const response = await axios({
      ...config,
      timeout: this.timeoutMs,
      headers: {
        ...(config.headers || {}),
        "User-Agent": this.userAgent,
        "Api-User-Agent": this.userAgent,
      },
    });

    return response.data;
  }
}
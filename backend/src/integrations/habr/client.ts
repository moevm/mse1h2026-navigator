import axios, { AxiosRequestConfig } from "axios";

import { HabrParsedArticle } from "./basic.types";
import { HabrSearchArticlesRequest } from "./request.types";
import { HabrSearchArticlesResponse } from "./response.types";

export class HabrApiClient {
  private readonly apiUrl = "https://habr.com/kek/v2/articles/";
  private readonly defaultQuery = "python";
  private readonly timeoutMs = 10_000;

  public async searchArticlesByQuery(
    query: string,
  ): Promise<HabrSearchArticlesResponse> {
    const params: HabrSearchArticlesRequest = {
      query,
      order: "relevance",
      fl: "ru",
      hl: "ru",
    };

    return this.request<HabrSearchArticlesResponse>({
      method: "GET",
      url: this.apiUrl,
      params,
    });
  }

  public async getParsedArticles(query?: string): Promise<HabrParsedArticle[]> {
    const normalizedQuery = query?.trim() || this.defaultQuery;
    const response = await this.searchArticlesByQuery(normalizedQuery);
    const publications = Object.values(response.publicationRefs || {});

    return publications.map((publication) => ({
      titleHtml: publication.titleHtml,
      link: `https://habr.com/ru/articles/${publication.id}/`,
      description: publication.leadData?.textHtml || "",
      rating: publication.statistics?.score ?? 0,
      hubs: publication.hubs || [],
    }));
  }

  private async request<TResponse>(
    config: AxiosRequestConfig,
  ): Promise<TResponse> {
    const response = await axios({
      ...config,
      timeout: this.timeoutMs,
    });

    return response.data;
  }
}
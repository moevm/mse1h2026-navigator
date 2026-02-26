import { WikipediaRepository } from "./repository";

export class WikipediaService {
  constructor(private readonly repository: WikipediaRepository) {}

  public async getArticleExtract(gsrsearch?: string): Promise<string> {
    const searchValue = gsrsearch?.trim() || "python";
    const response = await this.repository.findArticleIntroExtract(searchValue);
    const pages = response.query?.pages;

    if (!pages) {
      return "";
    }

    const firstPage = Object.values(pages)[0];

    return firstPage?.extract || "";
  }
}

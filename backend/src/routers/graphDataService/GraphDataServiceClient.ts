import axios, { AxiosError } from "axios";
import { injectable } from "tsyringe";
import type {
  GetProfessionGraphRequest,
  RawSkillGraph,
} from "./types";

@injectable()
export class GraphDataServiceClient {
  private readonly baseUrl: string;
  private readonly timeoutMs: number;

  constructor() {
    this.baseUrl =
      process.env.GRAPH_DATA_SERVICE_URL || "http://localhost:8000";
    this.timeoutMs = Number(process.env.GRAPH_DATA_SERVICE_TIMEOUT_MS || 180000);
  }

  public async getProfessionGraph(
    professionTitle: string,
    isMock = true,
    useCache = true,
    initialTechnologies: string[] = [],
  ): Promise<RawSkillGraph> {
    const payload: GetProfessionGraphRequest = {
      profession_title: professionTitle,
      initial_technologies: normalizeTechnologyList(initialTechnologies),
      is_mock: process.env.IS_MOCK_GRAPH_DATA_SERVICE === "true" || isMock,
      use_cache: useCache,
    };

    console.log(
      `[GraphDataServiceClient] POST ${this.baseUrl}/get_profession_graph`,
      JSON.stringify(payload),
    );

    try {
      const response = await axios.post<RawSkillGraph>(
        `${this.baseUrl}/get_profession_graph`,
        payload,
        { timeout: this.timeoutMs },
      );
      return response.data;
    } catch (err) {
      const axiosErr = err as AxiosError;

      if (axiosErr.code === "ECONNREFUSED") {
        throw new Error(
          `graph-data-service недоступен по адресу ${this.baseUrl}. ` +
            `Запустите сервис: cd graph-data-service && python3 -m uvicorn src.main:app --reload`,
        );
      }

      if (axiosErr.response?.status === 500) {
        throw new Error(
          `graph-data-service вернул 500. ` +
            `Если isMock=false — убедитесь, что HF_TOKEN задан в graph-data-service/.env. ` +
            `Для разработки используйте isMock=true.`,
        );
      }

      if (axiosErr.code === "ECONNABORTED") {
        throw new Error(
          `graph-data-service не успел ответить за ${this.timeoutMs} мс. ` +
            `Будет использован fallback по HeadHunter-вакансиям.`,
        );
      }

      throw err;
    }
  }
}

function normalizeTechnologyList(technologies: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const technology of technologies) {
    const normalized = technology.trim();
    const key = normalized.toLowerCase();
    if (!normalized || seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push(normalized);
  }

  return result;
}

export interface WikipediaPage {
  pageid: number;
  ns: number;
  title: string;
  index: number;
  extract: string;
}

export interface WikipediaQuery {
  pages: Record<string, WikipediaPage>;
}

export interface WikipediaContinue {
  gsroffset: number;
  continue: string;
}

export interface WikipediaApiResponse {
  batchcomplete: string;
  continue?: WikipediaContinue;
  query?: WikipediaQuery;
}

export interface WikipediaRequestParams {
  action: "query";
  generator: "search";
  gsrsearch: string;
  gsrlimit: number;
  prop: "extracts";
  exintro: 1;
  explaintext: 1;
  origin: "*";
  format: "json";
}

export interface WikipediaQueryParams {
  gsrsearch?: string;
}
export interface WikipediaSearchExtractRequest {
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
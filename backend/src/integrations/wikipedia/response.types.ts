import { WikipediaPage } from "./entity.types";

export interface WikipediaContinue {
  gsroffset: number;
  continue: string;
}

export interface WikipediaQuery {
  pages: Record<string, WikipediaPage>;
}

export interface WikipediaApiResponse {
  batchcomplete?: string;
  continue?: WikipediaContinue;
  query?: WikipediaQuery;
}

export interface WikipediaMediaSrcsetItem {
  src: string;
  scale: string;
}

export interface WikipediaMediaItem {
  title: string;
  leadImage: boolean;
  section_id: number;
  type: string;
  showInGallery: boolean;
  srcset?: WikipediaMediaSrcsetItem[];
}

export interface WikipediaMediaListResponse {
  revision: string;
  tid: string;
  items: WikipediaMediaItem[];
}
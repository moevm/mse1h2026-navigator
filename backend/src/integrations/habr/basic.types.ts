import { HabrPublicationHub } from "./entity.types";

export interface HabrParsedArticle {
  titleHtml: string;
  link: string;
  description: string;
  rating: number;
  hubs: HabrPublicationHub[];
}
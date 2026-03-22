export interface HabrPublicationHub {
  id: string;
  alias: string;
  type: string;
  title: string;
  titleHtml: string;
  isProfiled: boolean;
  relatedData: unknown;
}

export interface HabrPublicationStatistics {
  score: number;
}

export interface HabrPublicationLeadData {
  textHtml: string;
}

export interface HabrPublication {
  id: string;
  titleHtml: string;
  leadData?: HabrPublicationLeadData;
  statistics?: HabrPublicationStatistics;
  hubs?: HabrPublicationHub[];
}
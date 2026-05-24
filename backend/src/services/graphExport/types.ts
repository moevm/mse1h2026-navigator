import type { MainSkill, Skill, SkillsRelation } from "@prisma/client";

export type GraphExportFormat = "rdfxml" | "turtle";
export type GraphImportFormat = GraphExportFormat;

export interface GraphExportResult {
  content: string;
  contentType: string;
  fileExtension: "owl" | "ttl";
}

export interface ExportableGraph {
  id: string;
  professionTitle: string;
  mainSkill: MainSkill;
  nodes: Skill[];
  edges: SkillsRelation[];
}

export interface GraphExportNamespaces {
  baseUrl: string;
  nav: string;
  rdf: string;
  rdfs: string;
  dcterms: string;
  owl: string;
  xsd: string;
}

export interface GraphExportContext {
  graphUri: string;
  mainSkillUri: string;
  skillById: Map<string, Skill>;
}

export interface ImportedGraphData {
  professionTitle: string;
  mainSkill: MainSkill;
  nodes: Skill[];
  edges: SkillsRelation[];
}

export interface GraphImportRequest {
  content: string;
  format: GraphImportFormat;
}

export interface GraphImportResult {
  graphData: ImportedGraphData;
}

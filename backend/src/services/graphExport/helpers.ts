import type { Skill } from "@prisma/client";
import type { GraphResponse } from "../graphEditing/types";
import type {
  ExportableGraph,
  GraphExportContext,
  GraphExportNamespaces,
} from "./types";

const DEFAULT_BASE_URL =
  process.env.GRAPH_EXPORT_BASE_URL || "https://mse1h2026-navigator.local";

export function createGraphExportNamespaces(
  baseUrl = DEFAULT_BASE_URL
): GraphExportNamespaces {
  return {
    baseUrl,
    nav: `${baseUrl}/ontology#`,
    rdf: "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
    rdfs: "http://www.w3.org/2000/01/rdf-schema#",
    dcterms: "http://purl.org/dc/terms/",
    owl: "http://www.w3.org/2002/07/owl#",
    xsd: "http://www.w3.org/2001/XMLSchema#",
  };
}

export function createGraphExportContext(
  graph: GraphResponse | ExportableGraph,
  namespaces: GraphExportNamespaces
): GraphExportContext {
  return {
    graphUri: graphUri(namespaces, graph.id),
    mainSkillUri: skillUri(namespaces, graph.id, graph.mainSkill.id),
    skillById: new Map<string, Skill>(graph.nodes.map((node) => [node.id, node])),
  };
}

export function graphUri(
  namespaces: GraphExportNamespaces,
  graphId: string
): string {
  return `${namespaces.baseUrl}/graphs/${uriSegment(graphId)}`;
}

export function skillUri(
  namespaces: GraphExportNamespaces,
  graphId: string,
  skillId: string
): string {
  return `${graphUri(namespaces, graphId)}/skills/${uriSegment(skillId)}`;
}

export function courseUri(
  namespaces: GraphExportNamespaces,
  graphId: string,
  courseId: string
): string {
  return `${graphUri(namespaces, graphId)}/courses/${uriSegment(courseId)}`;
}

export function bookUri(
  namespaces: GraphExportNamespaces,
  graphId: string,
  bookId: string
): string {
  return `${graphUri(namespaces, graphId)}/books/${uriSegment(bookId)}`;
}

export function articleUri(
  namespaces: GraphExportNamespaces,
  graphId: string,
  articleId: string
): string {
  return `${graphUri(namespaces, graphId)}/articles/${uriSegment(articleId)}`;
}

export function extractUriSegment(uri: string, resourcePath: string): string | null {
  const marker = `/${resourcePath}/`;
  const markerIndex = uri.lastIndexOf(marker);
  if (markerIndex === -1) {
    return null;
  }

  const segment = uri.slice(markerIndex + marker.length).split(/[?#/]/)[0];
  return segment ? decodeURIComponent(segment) : null;
}

function uriSegment(value: string): string {
  return encodeURIComponent(value);
}

export function xmlAttr(value: string): string {
  return xmlText(value).replace(/"/g, "&quot;");
}

export function xmlText(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function ttlString(value: string): string {
  return `"${value
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")}"`;
}

export function ttlBoolean(value: boolean): string {
  return `"${value}"^^xsd:boolean`;
}

export function ttlInteger(value: number): string {
  return `"${Math.trunc(value)}"^^xsd:integer`;
}

export function ttlDouble(value: number): string {
  return `"${value}"^^xsd:double`;
}

export function escapeUri(value: string): string {
  return value.replace(/>/g, "%3E").replace(/</g, "%3C").replace(/\s/g, "%20");
}

export function renderTypedRdfXmlLiteral(
  namespaces: GraphExportNamespaces,
  tagName: string,
  value: string | number | boolean,
  typeName: "boolean" | "double" | "integer"
): string {
  return `    <${tagName} rdf:datatype="${namespaces.xsd}${typeName}">${xmlText(
    String(value)
  )}</${tagName}>`;
}

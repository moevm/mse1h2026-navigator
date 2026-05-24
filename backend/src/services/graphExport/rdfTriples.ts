import type { GraphExportNamespaces } from "./types";

export interface RdfObject {
  kind: "literal" | "uri";
  value: string;
  datatype?: string;
}

export interface RdfTriple {
  subject: string;
  predicate: string;
  object: RdfObject;
}

export function uriObject(value: string): RdfObject {
  return { kind: "uri", value };
}

export function literalObject(value: string, datatype?: string): RdfObject {
  return { kind: "literal", value, datatype };
}

export function rdfType(namespaces: GraphExportNamespaces): string {
  return `${namespaces.rdf}type`;
}

export function nav(namespaces: GraphExportNamespaces, name: string): string {
  return `${namespaces.nav}${name}`;
}

export function rdfs(namespaces: GraphExportNamespaces, name: string): string {
  return `${namespaces.rdfs}${name}`;
}

export function dcterms(namespaces: GraphExportNamespaces, name: string): string {
  return `${namespaces.dcterms}${name}`;
}

export function tagNameToUri(
  namespaces: GraphExportNamespaces,
  tagName: string
): string | null {
  const [prefix, localName] = tagName.split(":");
  if (!prefix || !localName) {
    return null;
  }

  const namespaceByPrefix: Record<string, string> = {
    nav: namespaces.nav,
    rdf: namespaces.rdf,
    rdfs: namespaces.rdfs,
    dcterms: namespaces.dcterms,
    owl: namespaces.owl,
    xsd: namespaces.xsd,
  };

  const namespace = namespaceByPrefix[prefix];
  return namespace ? `${namespace}${localName}` : null;
}

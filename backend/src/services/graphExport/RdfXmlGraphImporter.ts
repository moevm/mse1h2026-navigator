import { XMLParser } from "fast-xml-parser";
import { mapRdfTriplesToImportedGraph } from "./rdfGraphMapper";
import {
  literalObject,
  rdfType,
  tagNameToUri,
  uriObject,
  type RdfTriple,
} from "./rdfTriples";
import type { GraphExportNamespaces, GraphImportResult } from "./types";

type XmlNode = Record<string, unknown>;

export class RdfXmlGraphImporter {
  private readonly parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    textNodeName: "#text",
    parseAttributeValue: false,
    parseTagValue: false,
    trimValues: true,
  });

  constructor(private readonly namespaces: GraphExportNamespaces) {}

  import(content: string): GraphImportResult {
    const parsed = this.parser.parse(content) as XmlNode;
    const root = this.asXmlNode(parsed["rdf:RDF"] ?? parsed.RDF);
    if (!root) {
      throw new Error("RDF/XML document must contain rdf:RDF root");
    }

    return {
      graphData: mapRdfTriplesToImportedGraph(
        this.collectTriples(root),
        this.namespaces
      ),
    };
  }

  private collectTriples(root: XmlNode): RdfTriple[] {
    const triples: RdfTriple[] = [];

    Object.entries(root).forEach(([tagName, value]) => {
      if (tagName.startsWith("@_")) {
        return;
      }

      this.toArray(value).forEach((element) => {
        const elementNode = this.asXmlNode(element);
        if (elementNode) {
          triples.push(...this.collectElementTriples(tagName, elementNode));
        }
      });
    });

    return triples;
  }

  private collectElementTriples(tagName: string, element: XmlNode): RdfTriple[] {
    const subject = this.attribute(element, "about");
    if (!subject) {
      return [];
    }

    const triples: RdfTriple[] = [];
    const typeUri = tagName === "rdf:Description" ? null : tagNameToUri(this.namespaces, tagName);
    if (typeUri) {
      triples.push({
        subject,
        predicate: rdfType(this.namespaces),
        object: uriObject(typeUri),
      });
    }

    Object.entries(element).forEach(([propertyName, value]) => {
      if (propertyName.startsWith("@_")) {
        return;
      }

      const predicate = tagNameToUri(this.namespaces, propertyName);
      if (!predicate) {
        return;
      }

      this.toArray(value).forEach((propertyValue) => {
        const object = this.toRdfObject(propertyValue);
        if (object) {
          triples.push({ subject, predicate, object });
        }
      });
    });

    return triples;
  }

  private toRdfObject(value: unknown): RdfTriple["object"] | null {
    const node = this.asXmlNode(value);
    if (node) {
      const resource = this.attribute(node, "resource");
      if (resource) {
        return uriObject(resource);
      }

      const text = this.textValue(node);
      if (text !== null) {
        return literalObject(text, this.attribute(node, "datatype") ?? undefined);
      }
    }

    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      return literalObject(String(value));
    }

    return null;
  }

  private asXmlNode(value: unknown): XmlNode | null {
    return value && typeof value === "object" && !Array.isArray(value)
      ? (value as XmlNode)
      : null;
  }

  private toArray(value: unknown): unknown[] {
    return Array.isArray(value) ? value : [value];
  }

  private attribute(node: XmlNode, localName: string): string | null {
    const match = Object.entries(node).find(
      ([key]) => key.startsWith("@_") && key.endsWith(`:${localName}`)
    );
    const direct = node[`@_${localName}`];
    const value = match?.[1] ?? direct;
    return typeof value === "string" && value.length > 0 ? value : null;
  }

  private textValue(node: XmlNode): string | null {
    const text = node["#text"];
    if (typeof text === "string" || typeof text === "number" || typeof text === "boolean") {
      return String(text);
    }

    return null;
  }
}

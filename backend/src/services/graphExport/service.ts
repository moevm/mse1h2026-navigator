import type { GraphResponse } from "../graphEditing/types";
import { createGraphExportNamespaces } from "./helpers";
import { GraphImportError } from "./rdfGraphMapper";
import { RdfXmlGraphExporter } from "./RdfXmlGraphExporter";
import { RdfXmlGraphImporter } from "./RdfXmlGraphImporter";
import { TurtleGraphExporter } from "./TurtleGraphExporter";
import { TurtleGraphImporter } from "./TurtleGraphImporter";
import { validateImportedGraph } from "./validation";
import type {
  ExportableGraph,
  GraphExportFormat,
  GraphExportResult,
  GraphImportFormat,
  GraphImportResult,
} from "./types";

export type {
  ExportableGraph,
  GraphExportFormat,
  GraphExportResult,
  GraphImportFormat,
  GraphImportRequest,
  GraphImportResult,
  ImportedGraphData,
} from "./types";
export { GraphImportError } from "./rdfGraphMapper";

export class GraphExportService {
  private readonly rdfXmlExporter: RdfXmlGraphExporter;
  private readonly rdfXmlImporter: RdfXmlGraphImporter;
  private readonly turtleExporter: TurtleGraphExporter;
  private readonly turtleImporter: TurtleGraphImporter;

  constructor(baseUrl?: string) {
    const namespaces = createGraphExportNamespaces(baseUrl);
    this.rdfXmlExporter = new RdfXmlGraphExporter(namespaces);
    this.rdfXmlImporter = new RdfXmlGraphImporter(namespaces);
    this.turtleExporter = new TurtleGraphExporter(namespaces);
    this.turtleImporter = new TurtleGraphImporter(namespaces);
  }

  parseFormat(value: unknown): GraphExportFormat | null {
    if (value === undefined || value === null || value === "") {
      return "rdfxml";
    }

    if (value === "rdfxml" || value === "turtle") {
      return value;
    }

    return null;
  }

  exportGraph(
    graph: GraphResponse | ExportableGraph,
    format: GraphExportFormat
  ): GraphExportResult {
    if (format === "turtle") {
      return {
        content: this.turtleExporter.export(graph),
        contentType: "text/turtle; charset=utf-8",
        fileExtension: "ttl",
      };
    }

    return {
      content: this.rdfXmlExporter.export(graph),
      contentType: "application/rdf+xml; charset=utf-8",
      fileExtension: "owl",
    };
  }

  importGraph(content: string, format: GraphImportFormat): GraphImportResult {
    try {
      const result =
        format === "turtle"
          ? this.turtleImporter.import(content)
          : this.rdfXmlImporter.import(content);

      validateImportedGraph(result.graphData);
      return result;
    } catch (error) {
      if (error instanceof GraphImportError) {
        throw error;
      }

      throw new GraphImportError("Invalid graph import content");
    }
  }
}

const graphExportService = new GraphExportService();

export function parseGraphExportFormat(value: unknown): GraphExportFormat | null {
  return graphExportService.parseFormat(value);
}

export function exportGraph(
  graph: GraphResponse | ExportableGraph,
  format: GraphExportFormat
): GraphExportResult {
  return graphExportService.exportGraph(graph, format);
}

export function parseGraphImportFormat(value: unknown): GraphImportFormat | null {
  return graphExportService.parseFormat(value);
}

export function importGraph(
  content: string,
  format: GraphImportFormat
): GraphImportResult {
  return graphExportService.importGraph(content, format);
}

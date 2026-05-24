import { Parser, type Quad } from "n3";
import { mapRdfTriplesToImportedGraph } from "./rdfGraphMapper";
import { literalObject, uriObject, type RdfTriple } from "./rdfTriples";
import type { GraphExportNamespaces, GraphImportResult } from "./types";

export class TurtleGraphImporter {
  constructor(private readonly namespaces: GraphExportNamespaces) {}

  import(content: string): GraphImportResult {
    const parser = new Parser();
    const quads = parser.parse(content);

    return {
      graphData: mapRdfTriplesToImportedGraph(
        quads.map((quad) => this.quadToTriple(quad)),
        this.namespaces
      ),
    };
  }

  private quadToTriple(quad: Quad): RdfTriple {
    return {
      subject: quad.subject.value,
      predicate: quad.predicate.value,
      object:
        quad.object.termType === "NamedNode"
          ? uriObject(quad.object.value)
          : literalObject(
              quad.object.value,
              quad.object.termType === "Literal"
                ? quad.object.datatype.value
                : undefined
            ),
    };
  }
}

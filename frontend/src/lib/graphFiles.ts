import type { GraphFileFormat, GraphFileFormatMeta } from "@/api/types";

export const graphFileFormats: Record<GraphFileFormat, GraphFileFormatMeta> = {
  rdfxml: {
    format: "rdfxml",
    label: "RDF/XML (.owl)",
    extension: "owl",
    contentType: "application/rdf+xml",
  },
  turtle: {
    format: "turtle",
    label: "Turtle (.ttl)",
    extension: "ttl",
    contentType: "text/turtle",
  },
};

const extensionToFormat: Record<string, GraphFileFormat> = {
  owl: "rdfxml",
  rdf: "rdfxml",
  xml: "rdfxml",
  ttl: "turtle",
};

export const graphFileInputAccept = [
  ".owl",
  ".rdf",
  ".xml",
  ".ttl",
  "application/rdf+xml",
  "application/xml",
  "text/turtle",
  "text/plain",
].join(",");

export function getGraphFileFormat(file: File): GraphFileFormat | null {
  const extension = file.name.split(".").pop()?.toLowerCase();
  return extension ? extensionToFormat[extension] ?? null : null;
}

export function getGraphDownloadFileName(
  graphId: string,
  format: GraphFileFormat,
): string {
  return `graph-${graphId}.${graphFileFormats[format].extension}`;
}

export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

import type { Edge } from "@xyflow/react";
import type { GraphNode } from "./nodes";

export type getGraphInfoResponse = {
  edges: Edge[];
  nodes: GraphNode[];
};

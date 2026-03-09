import ELK from "elkjs";
import type { GraphNode } from "../types/nodes";
import type { Edge } from "@xyflow/react";
import { graphConfig } from "../config/graphSettings";

const elk = new ELK();

export async function layoutGraph(nodes: GraphNode[], edges: Edge[]) {
  const graph = {
    id: "root",
    layoutOptions: {
      "elk.algorithm": graphConfig.elkAlgorithm,
      "elk.spacing.nodeNode": graphConfig.elkSpacingNodeNode,
      "elk.layered.spacing.nodeNodeBetweenLayers":
        graphConfig.nodeNodeBetweenLayers,
      "elk.radial.radius": graphConfig.radius,
      "elk.radial.minimizeCrossing": graphConfig.minimizeCrossing,
      "elk.radial.radius.increment": graphConfig.increment,
      "elk.radial.radius.increment.strategy": graphConfig.strategy,
    },
    children: nodes.map((node: GraphNode) => ({
      id: node.id,
      width: 10,
      height: 10,
    })),
    edges: edges.map((edge: Edge) => ({
      id: edge.id,
      sources: [edge.source],
      targets: [edge.target],
    })),
  };

  const layout: ReturnType<typeof elk.layout> = await elk.layout(graph);

  const positionedNodes = nodes.map((node) => {
    const elkNode = layout.children.find((n: GraphNode) => n.id === node.id);

    return {
      ...node,
      position: {
        x: elkNode.x,
        y: elkNode.y,
      },
    };
  });

  return {
    nodes: positionedNodes,
    edges,
  };
}

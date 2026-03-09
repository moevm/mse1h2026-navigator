import type { Node, Edge } from "@xyflow/react";

function getHandleSide(source: Node, target: Node) {
  const dx = target.position.x - source.position.x;
  const dy = target.position.y - source.position.y;

  if (Math.abs(dx) > Math.abs(dy)) {
    return dx > 0
      ? {
          sourceHandle: "right-source",
          targetHandle: "left-target",
        }
      : {
          sourceHandle: "left-source",
          targetHandle: "right-target",
        };
  }

  return dy > 0
    ? {
        sourceHandle: "bottom-source",
        targetHandle: "top-target",
      }
    : {
        sourceHandle: "top-source",
        targetHandle: "bottom-target",
      };
}

export const resolveHandles = (nodes: Node[], edges: Edge[]): Edge[] => {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  return edges.map((edge) => {
    const source = nodeMap.get(edge.source)!;
    const target = nodeMap.get(edge.target)!;

    const handles = getHandleSide(source, target);

    return {
      ...edge,
      ...handles,
    };
  });
};

import type { Node, Edge } from "@xyflow/react";
import { SourceHandleTypes, TargetHandleTypes } from "../config/handleTypes";

function getHandleSide(source: Node, target: Node) {
  const dx = target.position.x - source.position.x;
  const dy = target.position.y - source.position.y;

  if (Math.abs(dx) > Math.abs(dy)) {
    return dx > 0
      ? {
          sourceHandle: SourceHandleTypes.RIGHT_SOURCE,
          targetHandle: TargetHandleTypes.LEFT_TARGET,
        }
      : {
          sourceHandle: SourceHandleTypes.LEFT_SOURCE,
          targetHandle: TargetHandleTypes.RIGHT_TARGET,
        };
  }

  return dy > 0
    ? {
        sourceHandle: SourceHandleTypes.BOTTOM_SOURCE,
        targetHandle: TargetHandleTypes.TOP_TARGET,
      }
    : {
        sourceHandle: SourceHandleTypes.TOP_SOURCE,
        targetHandle: TargetHandleTypes.BOTTOM_TARGET,
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

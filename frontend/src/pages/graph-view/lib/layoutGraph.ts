import type { Edge } from "@xyflow/react";
import type { GraphNode } from "../types/nodes";

const ROW_GAP = 190;
const COLUMN_GAP = 280;
const LAYER_ROW_GAP = 150;
const MAX_NODES_PER_LAYER_ROW = 5;
const collator = new Intl.Collator("en", {
  numeric: true,
  sensitivity: "base",
});

type RankedNode = {
  id: string;
  rawWeight: string;
};

const getNodeWeight = (node: GraphNode): string => {
  const dataId = (node.data as { id?: string | number } | undefined)?.id;

  if (typeof dataId === "number") {
    return String(dataId);
  }

  if (typeof dataId === "string" && dataId.trim().length > 0) {
    return dataId;
  }

  return node.id;
};

const compareByWeight = (a: RankedNode, b: RankedNode): number => {
  const weightCompare = collator.compare(a.rawWeight, b.rawWeight);

  if (weightCompare !== 0) {
    return weightCompare;
  }

  return collator.compare(a.id, b.id);
};

const hasPath = (
  outgoing: Map<string, string[]>,
  sourceId: string,
  targetId: string,
): boolean => {
  const visited = new Set<string>();
  const stack = [sourceId];

  while (stack.length > 0) {
    const currentId = stack.pop()!;
    if (currentId === targetId) {
      return true;
    }
    if (visited.has(currentId)) {
      continue;
    }

    visited.add(currentId);
    stack.push(...(outgoing.get(currentId) ?? []));
  }

  return false;
};

export async function layoutGraph(
  nodes: GraphNode[],
  edges: Edge[],
): Promise<{ nodes: GraphNode[]; edges: Edge[] }> {
  const rankedNodes: RankedNode[] = nodes.map((node) => ({
    id: node.id,
    rawWeight: getNodeWeight(node),
  }));

  const rankedById = new Map(rankedNodes.map((node) => [node.id, node]));
  const nodeIds = rankedNodes.map((node) => node.id);
  const outgoing = new Map<string, string[]>();
  const incoming = new Map<string, string[]>();
  const indegree = new Map<string, number>();

  for (const id of nodeIds) {
    outgoing.set(id, []);
    incoming.set(id, []);
    indegree.set(id, 0);
  }

  const validEdges = edges
    .filter(
      (edge) =>
        rankedById.has(edge.source) &&
        rankedById.has(edge.target) &&
        edge.source !== edge.target,
    )
    .sort((left, right) => {
      const sourceCompare = compareByWeight(
        rankedById.get(left.source)!,
        rankedById.get(right.source)!,
      );
      if (sourceCompare !== 0) {
        return sourceCompare;
      }

      return compareByWeight(
        rankedById.get(left.target)!,
        rankedById.get(right.target)!,
      );
    });

  for (const edge of validEdges) {
    if (hasPath(outgoing, edge.target, edge.source)) {
      continue;
    }

    outgoing.get(edge.source)?.push(edge.target);
    incoming.get(edge.target)?.push(edge.source);
    indegree.set(edge.target, (indegree.get(edge.target) ?? 0) + 1);
  }

  const queue = nodeIds
    .filter((id) => (indegree.get(id) ?? 0) === 0)
    .sort((leftId, rightId) =>
      compareByWeight(rankedById.get(leftId)!, rankedById.get(rightId)!),
    );
  const topologicalOrder: string[] = [];

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    topologicalOrder.push(currentId);

    for (const childId of outgoing.get(currentId) ?? []) {
      const nextIndegree = (indegree.get(childId) ?? 0) - 1;
      indegree.set(childId, nextIndegree);

      if (nextIndegree === 0) {
        queue.push(childId);
        queue.sort((leftId, rightId) =>
          compareByWeight(rankedById.get(leftId)!, rankedById.get(rightId)!),
        );
      }
    }
  }

  const orderedSet = new Set(topologicalOrder);
  const unresolved = nodeIds
    .filter((id) => !orderedSet.has(id))
    .sort((leftId, rightId) =>
      compareByWeight(rankedById.get(leftId)!, rankedById.get(rightId)!),
    );

  topologicalOrder.push(...unresolved);

  const depth = new Map<string, number>();

  for (const id of nodeIds) {
    depth.set(id, 0);
  }

  for (const id of topologicalOrder) {
    const currentDepth = depth.get(id) ?? 0;

    for (const childId of outgoing.get(id) ?? []) {
      depth.set(childId, Math.max(depth.get(childId) ?? 0, currentDepth + 1));
    }
  }

  const layers = new Map<number, string[]>();

  for (const id of topologicalOrder) {
    const layerIndex = depth.get(id) ?? 0;
    const layer = layers.get(layerIndex) ?? [];
    layer.push(id);
    layers.set(layerIndex, layer);
  }

  const orderedLayers = Array.from(layers.entries()).sort(
    ([leftDepth], [rightDepth]) => leftDepth - rightDepth,
  );
  const orderInLayer = new Map<string, number>();

  for (const [layerIndex, layerNodeIds] of orderedLayers) {
    const sortedLayer = [...layerNodeIds].sort((leftId, rightId) => {
      const leftParents = (incoming.get(leftId) ?? [])
        .map((parentId) => orderInLayer.get(parentId))
        .filter((value): value is number => value !== undefined);
      const rightParents = (incoming.get(rightId) ?? [])
        .map((parentId) => orderInLayer.get(parentId))
        .filter((value): value is number => value !== undefined);
      const leftPrimary =
        leftParents.length > 0 ? Math.min(...leftParents) : Number.MAX_SAFE_INTEGER;
      const rightPrimary =
        rightParents.length > 0
          ? Math.min(...rightParents)
          : Number.MAX_SAFE_INTEGER;

      if (leftPrimary !== rightPrimary) {
        return leftPrimary - rightPrimary;
      }

      const leftBarycenter =
        leftParents.length > 0
          ? leftParents.reduce((sum, value) => sum + value, 0) / leftParents.length
          : Number.MAX_SAFE_INTEGER;
      const rightBarycenter =
        rightParents.length > 0
          ? rightParents.reduce((sum, value) => sum + value, 0) / rightParents.length
          : Number.MAX_SAFE_INTEGER;

      if (leftBarycenter !== rightBarycenter) {
        return leftBarycenter - rightBarycenter;
      }

      return compareByWeight(rankedById.get(leftId)!, rankedById.get(rightId)!);
    });

    sortedLayer.forEach((id, index) => {
      orderInLayer.set(id, index);
    });

    layers.set(layerIndex, sortedLayer);
  }

  const positionById = new Map<string, { x: number; y: number }>();
  let yOffset = 0;

  for (const [, sortedLayerIds] of orderedLayers) {
    const sortedLayer = sortedLayerIds;
    const rowCount = Math.max(
      1,
      Math.ceil(sortedLayer.length / MAX_NODES_PER_LAYER_ROW),
    );

    sortedLayer.forEach((id, index) => {
      const rowIndex = Math.floor(index / MAX_NODES_PER_LAYER_ROW);
      const rowStart = rowIndex * MAX_NODES_PER_LAYER_ROW;
      const rowLength = Math.min(
        MAX_NODES_PER_LAYER_ROW,
        sortedLayer.length - rowStart,
      );
      const indexInRow = index - rowStart;
      const totalWidth = (rowLength - 1) * COLUMN_GAP;

      positionById.set(id, {
        x: indexInRow * COLUMN_GAP - totalWidth / 2,
        y: yOffset + rowIndex * LAYER_ROW_GAP,
      });
    });

    yOffset += ROW_GAP + (rowCount - 1) * LAYER_ROW_GAP;
  }

  return {
    nodes: nodes.map((node) => ({
      ...node,
      position: positionById.get(node.id) ?? { x: 0, y: 0 },
    })),
    edges,
  };
}

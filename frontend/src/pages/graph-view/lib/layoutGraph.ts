import type { GraphNode } from "../types/nodes";
import type { Edge } from "@xyflow/react";
const ROW_GAP = 190;
const COLUMN_GAP = 280;
const collator = new Intl.Collator("en", { numeric: true, sensitivity: "base" });

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

export async function layoutGraph(nodes: GraphNode[], edges: Edge[]) {
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

  for (const edge of edges) {
    if (!rankedById.has(edge.source) || !rankedById.has(edge.target)) {
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

  if (unresolved.length > 0) {
    let fallbackDepth = Math.max(...depth.values()) + 1;

    for (const id of unresolved) {
      depth.set(id, fallbackDepth);
      fallbackDepth += 1;
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

      const leftPrimary = leftParents.length > 0 ? Math.min(...leftParents) : Number.MAX_SAFE_INTEGER;
      const rightPrimary = rightParents.length > 0 ? Math.min(...rightParents) : Number.MAX_SAFE_INTEGER;

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

  for (const [layerIndex] of orderedLayers) {
    const sortedLayer = layers.get(layerIndex) ?? [];
    const totalWidth = (sortedLayer.length - 1) * COLUMN_GAP;

    sortedLayer.forEach((id, index) => {
      positionById.set(id, {
        x: index * COLUMN_GAP - totalWidth / 2,
        y: layerIndex * ROW_GAP,
      });
    });
  }

  return {
    nodes: nodes.map((node) => ({
      ...node,
      position: positionById.get(node.id) ?? { x: 0, y: 0 },
    })),
    edges,
  };
}

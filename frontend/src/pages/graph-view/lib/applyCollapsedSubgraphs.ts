import type { MainSkill, Skill, SkillsRelation } from "@/entities/skill/types";

export interface CollapsedSubgraphsResult {
  visibleSkills: Skill[];
  hiddenDescendantCountById: Map<string, number>;
}

const buildOutgoing = (
  nodeIds: Set<string>,
  edges: SkillsRelation[],
): Map<string, string[]> => {
  const outgoing = new Map<string, string[]>();
  for (const id of nodeIds) {
    outgoing.set(id, []);
  }

  for (const edge of edges) {
    if (nodeIds.has(edge.fromId) && nodeIds.has(edge.toId)) {
      outgoing.get(edge.fromId)?.push(edge.toId);
    }
  }

  return outgoing;
};

const collectDescendants = (
  sourceId: string,
  outgoing: Map<string, string[]>,
): Set<string> => {
  const descendants = new Set<string>();
  const visited = new Set([sourceId]);
  const queue = [...(outgoing.get(sourceId) ?? [])];

  for (let index = 0; index < queue.length; index += 1) {
    const nodeId = queue[index];
    if (visited.has(nodeId)) {
      continue;
    }

    visited.add(nodeId);
    descendants.add(nodeId);
    queue.push(...(outgoing.get(nodeId) ?? []));
  }

  return descendants;
};

export const applyCollapsedSubgraphs = (
  mainSkill: MainSkill,
  skills: Skill[],
  edges: SkillsRelation[],
  collapsedNodeIds: Set<string>,
): CollapsedSubgraphsResult => {
  const skillIds = new Set(skills.map((skill) => skill.id));
  const nodeIds = new Set([mainSkill.id, ...skillIds]);
  const outgoing = buildOutgoing(nodeIds, edges);
  const hiddenIds = new Set<string>();
  const hiddenDescendantCountById = new Map<string, number>();

  for (const nodeId of collapsedNodeIds) {
    if (!nodeIds.has(nodeId)) {
      continue;
    }

    const descendants = collectDescendants(nodeId, outgoing);
    const skillDescendants = [...descendants].filter((id) => skillIds.has(id));
    hiddenDescendantCountById.set(nodeId, skillDescendants.length);

    for (const descendantId of skillDescendants) {
      hiddenIds.add(descendantId);
    }
  }

  for (const nodeId of collapsedNodeIds) {
    hiddenIds.delete(nodeId);
  }

  return {
    visibleSkills: skills.filter((skill) => !hiddenIds.has(skill.id)),
    hiddenDescendantCountById,
  };
};

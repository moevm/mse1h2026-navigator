import type { MainSkill, Skill, SkillsRelation } from "@/entities/skill/types";
import type { GraphFilters } from "../services/graphStore";

type GraphNodeInfo = Pick<Skill, "id" | "title" | "description"> | MainSkill;

const matchesQuery = (node: GraphNodeInfo, query: string): boolean =>
  `${node.title} ${node.description}`.toLowerCase().includes(query);

const buildUndirectedAdjacency = (
  nodeIds: Set<string>,
  edges: SkillsRelation[],
): Map<string, string[]> => {
  const adjacency = new Map<string, string[]>();
  for (const id of nodeIds) {
    adjacency.set(id, []);
  }

  for (const edge of edges) {
    if (!nodeIds.has(edge.fromId) || !nodeIds.has(edge.toId)) {
      continue;
    }
    adjacency.get(edge.fromId)?.push(edge.toId);
    adjacency.get(edge.toId)?.push(edge.fromId);
  }

  return adjacency;
};

const findPath = (
  adjacency: Map<string, string[]>,
  startId: string,
  targetId: string,
): string[] => {
  if (startId === targetId) {
    return [startId];
  }

  const queue = [startId];
  const previous = new Map<string, string | null>([[startId, null]]);

  for (let index = 0; index < queue.length; index += 1) {
    const currentId = queue[index];
    for (const nextId of adjacency.get(currentId) ?? []) {
      if (previous.has(nextId)) {
        continue;
      }

      previous.set(nextId, currentId);
      if (nextId === targetId) {
        const path = [targetId];
        let cursor = currentId;
        while (cursor) {
          path.push(cursor);
          cursor = previous.get(cursor) ?? "";
        }
        return path.reverse();
      }
      queue.push(nextId);
    }
  }

  return [];
};

export const filterGraphSkills = (
  mainSkill: MainSkill,
  skills: Skill[],
  edges: SkillsRelation[],
  filters: GraphFilters,
): Skill[] => {
  const query = filters.query.trim().toLowerCase();
  const baseFilteredSkills = skills.filter((skill) => {
    if (filters.requiredOnly && !skill.isRequired) {
      return false;
    }
    if (filters.incompleteOnly && skill.isCompleted) {
      return false;
    }
    if (filters.minHours > 0 && skill.learnHours < filters.minHours) {
      return false;
    }
    if (query && !matchesQuery(skill, query)) {
      return false;
    }
    return true;
  });

  if (!query) {
    return baseFilteredSkills;
  }

  if (matchesQuery(mainSkill, query)) {
    return skills;
  }

  const nodeIds = new Set([mainSkill.id, ...skills.map((skill) => skill.id)]);
  const adjacency = buildUndirectedAdjacency(nodeIds, edges);
  const visibleIds = new Set(baseFilteredSkills.map((skill) => skill.id));

  for (const skill of baseFilteredSkills) {
    for (const id of findPath(adjacency, mainSkill.id, skill.id)) {
      if (id !== mainSkill.id) {
        visibleIds.add(id);
      }
    }
  }

  return skills.filter((skill) => visibleIds.has(skill.id));
};

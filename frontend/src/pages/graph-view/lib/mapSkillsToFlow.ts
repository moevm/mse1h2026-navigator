import type { Node, Edge } from "@xyflow/react";
import type { Skill, MainSkill, SkillsRelation } from "@/entities/skill/types";

type SkillMap = Record<string, Skill>;

export const mapSkillsToFlow = (
  mainSkill: MainSkill,
  skills: Skill[],
  relations: SkillsRelation[],
): { nodes: Node[]; edges: Edge[] } => {
  const skillMap: SkillMap = Object.fromEntries(skills.map((s) => [s.id, s]));

  const adjacency: Record<string, string[]> = {};

  relations.forEach((rel) => {
    if (!adjacency[rel.fromId]) adjacency[rel.fromId] = [];
    adjacency[rel.fromId].push(rel.toId);
  });

  /**
   * BFS — определяем уровни
   */
  const levels: Record<number, string[]> = {};
  const visited = new Set<string>();

  const queue: { id: string; level: number }[] = [
    { id: mainSkill.id, level: 0 },
  ];

  while (queue.length) {
    const { id, level } = queue.shift()!;

    if (visited.has(id)) continue;
    visited.add(id);

    if (!levels[level]) levels[level] = [];
    levels[level].push(id);

    const children = adjacency[id] || [];

    children.forEach((child) => {
      queue.push({ id: child, level: level + 1 });
    });
  }

  /**
   * Радиальная раскладка
   */

  const LEVEL_RADIUS = 250;
  const nodes: Node[] = [];

  Object.entries(levels).forEach(([levelStr, ids]) => {
    const level = Number(levelStr);

    if (level === 0) {
      nodes.push({
        id: mainSkill.id,
        type: "main",
        position: { x: 0, y: 0 },
        data: mainSkill,
      });

      return;
    }

    const radius = LEVEL_RADIUS * level;
    const angleStep = (2 * Math.PI) / ids.length;

    ids.forEach((id, index) => {
      const angle = index * angleStep;

      const x = radius * Math.cos(angle);
      const y = radius * Math.sin(angle);

      nodes.push({
        id,
        type: "basic",
        position: { x, y },
        data: skillMap[id],
      });
    });
  });

  const edges: Edge[] = relations.map((rel) => ({
    id: `${rel.fromId}-${rel.toId}`,
    source: rel.fromId,
    target: rel.toId,
  }));

  return {
    nodes,
    edges,
  };
};

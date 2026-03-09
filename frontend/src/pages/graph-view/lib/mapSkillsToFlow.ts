import type { Edge } from "@xyflow/react";
import type { Skill, MainSkill, SkillsRelation } from "@/entities/skill/types";
import type { GraphNode } from "../types/nodes";

export const mapSkillsToFlow = (
  mainSkill: MainSkill,
  skills: Skill[],
  relations: SkillsRelation[],
): { nodes: GraphNode[]; edges: Edge[] } => {
  const nodes: GraphNode[] = [
    {
      id: mainSkill.id,
      type: "main",
      position: { x: 0, y: 0 },
      data: mainSkill,
    },

    ...skills.map(
      (skill) =>
        ({
          id: skill.id,
          type: "basic",
          position: { x: 0, y: 0 },
          data: skill,
        }) as GraphNode,
    ),
  ];

  const edges: Edge[] = relations.map((rel) => ({
    id: `${rel.fromId}-${rel.toId}`,
    source: rel.fromId,
    target: rel.toId,
  }));

  return { nodes, edges };
};

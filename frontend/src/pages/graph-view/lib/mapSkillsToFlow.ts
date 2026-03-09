import type { Node, Edge } from "@xyflow/react";
import type { Skill, MainSkill, SkillsRelation } from "@/entities/skill/types";

export const mapSkillsToFlow = (
  mainSkill: MainSkill,
  skills: Skill[],
  relations: SkillsRelation[],
): { nodes: Node[]; edges: Edge[] } => {
  const nodes: Node[] = [
    {
      id: mainSkill.id,
      type: "main",
      position: { x: 0, y: 0 },
      data: mainSkill,
    },

    ...skills.map((skill) => ({
      id: skill.id,
      type: "basic",
      position: { x: 0, y: 0 },
      data: skill,
    })),
  ];

  const edges: Edge[] = relations.map((rel) => ({
    id: `${rel.fromId}-${rel.toId}`,
    source: rel.fromId,
    target: rel.toId,
  }));

  return { nodes, edges };
};

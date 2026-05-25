import type { Skill } from "@/entities/skill";
import type { BasicFlowNode } from "../types/nodes";

export function createSkillNode(skill: Skill): BasicFlowNode {
  return {
    id: skill.id,
    type: "basic",
    position: { x: 0, y: 0 },
    data: skill,
  };
}

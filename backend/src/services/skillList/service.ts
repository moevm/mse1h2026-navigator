import type { Skill } from "@prisma/client";
import type { GraphResponse } from "../graphEditing/types";

export interface PrioritySkillGroup {
  priority: number;
  skills: Skill[];
}

export interface SkillListResponse {
  graphId: string;
  professionTitle: string;
  currentPlan: PrioritySkillGroup[];
  completedSkills: Skill[];
  archivedSkills: Skill[];
}

function compareSkills(left: Skill, right: Skill): number {
  if (left.priority !== right.priority) {
    return left.priority - right.priority;
  }

  return left.title.localeCompare(right.title);
}

function groupByPriority(skills: Skill[]): PrioritySkillGroup[] {
  const groupsByPriority = new Map<number, Skill[]>();

  for (const skill of skills) {
    const group = groupsByPriority.get(skill.priority) ?? [];
    group.push(skill);
    groupsByPriority.set(skill.priority, group);
  }

  return Array.from(groupsByPriority.entries())
    .sort(([leftPriority], [rightPriority]) => leftPriority - rightPriority)
    .map(([priority, groupSkills]) => ({
      priority,
      skills: [...groupSkills].sort(compareSkills),
    }));
}

export function buildSkillList(graph: GraphResponse): SkillListResponse {
  const activeSkills = graph.nodes
    .filter((node) => !node.isCompleted && !node.isArchieved)
    .sort(compareSkills);
  const completedSkills = graph.nodes
    .filter((node) => node.isCompleted && !node.isArchieved)
    .sort(compareSkills);
  const archivedSkills = graph.nodes
    .filter((node) => node.isArchieved)
    .sort(compareSkills);

  return {
    graphId: graph.id,
    professionTitle: graph.professionTitle,
    currentPlan: groupByPriority(activeSkills),
    completedSkills,
    archivedSkills,
  };
}

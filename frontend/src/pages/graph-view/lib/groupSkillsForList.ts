import type { Skill } from "@/entities/skill";

export interface SkillPriorityGroup {
  priority: number;
  skills: Skill[];
}

export interface SkillListGroups {
  currentPlan: SkillPriorityGroup[];
  completed: Skill[];
  archived: Skill[];
}

export function groupSkillsForList(skills: Skill[]): SkillListGroups {
  const activeByPriority = new Map<number, Skill[]>();
  const completed: Skill[] = [];
  const archived: Skill[] = [];

  for (const skill of skills) {
    if (skill.isArchieved) {
      archived.push(skill);
      continue;
    }

    if (skill.isCompleted) {
      completed.push(skill);
      continue;
    }

    activeByPriority.set(skill.priority, [
      ...(activeByPriority.get(skill.priority) ?? []),
      skill,
    ]);
  }

  const currentPlan = [...activeByPriority.entries()]
    .sort(([leftPriority], [rightPriority]) => leftPriority - rightPriority)
    .map(([priority, prioritySkills]) => ({
      priority,
      skills: prioritySkills,
    }));

  return {
    currentPlan,
    completed,
    archived,
  };
}

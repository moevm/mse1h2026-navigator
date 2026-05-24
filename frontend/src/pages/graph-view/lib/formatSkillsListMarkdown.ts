import type { Skill } from "@/entities/skill";
import type { SkillListGroups } from "./groupSkillsForList";

interface FormatSkillsListMarkdownParams {
  professionTitle: string;
  groups: SkillListGroups;
}

export function formatSkillsListMarkdown({
  professionTitle,
  groups,
}: FormatSkillsListMarkdownParams): string {
  const title = professionTitle.trim() || "План навыков";
  const lines: string[] = [`# ${title}`, "", "# Текущий план", ""];

  if (groups.currentPlan.length) {
    for (const group of groups.currentPlan) {
      lines.push(`## Приоритет ${group.priority}`, "");
      appendSkillList(lines, group.skills);
      lines.push("");
    }
  } else {
    lines.push("_Нет активных навыков в текущем плане._", "");
  }

  lines.push("# Освоенные навыки", "");
  appendSkillListOrEmpty(lines, groups.completed, "_Пока нет освоенных навыков._");
  lines.push("", "# Архивированные навыки", "");
  appendSkillListOrEmpty(lines, groups.archived, "_Архивированных навыков нет._");

  return `${lines.join("\n").trimEnd()}\n`;
}

export function getSkillsListMarkdownFileName(professionTitle: string): string {
  const normalizedTitle = professionTitle
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^\p{L}\p{N}_-]+/gu, "")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");

  return `${normalizedTitle || "skills"}_skills_list.md`;
}

function appendSkillListOrEmpty(
  lines: string[],
  skills: Skill[],
  emptyMessage: string,
): void {
  if (!skills.length) {
    lines.push(emptyMessage);
    return;
  }

  appendSkillList(lines, skills);
}

function appendSkillList(lines: string[], skills: Skill[]): void {
  for (const skill of skills) {
    lines.push(`- **${skill.title}** — ${formatHours(skill.learnHours)}`);

    const description = skill.description.trim();
    if (description) {
      lines.push(`  - Описание: ${description}`);
    }
  }
}

function formatHours(hours: number): string {
  return `${hours} ч`;
}

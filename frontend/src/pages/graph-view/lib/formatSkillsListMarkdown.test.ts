import { describe, expect, it } from "vitest";
import type { Skill } from "@/entities/skill";
import { groupSkillsForList } from "./groupSkillsForList";
import {
  formatSkillsListMarkdown,
  getSkillsListMarkdownFileName,
} from "./formatSkillsListMarkdown";

const makeSkill = (id: string, overrides: Partial<Skill> = {}): Skill => ({
  id,
  title: id,
  description: "",
  isCompleted: false,
  isRequired: true,
  isArchieved: false,
  priority: 1,
  learnHours: 10,
  ...overrides,
});

describe("formatSkillsListMarkdown", () => {
  it("formats active skills under priority headings", () => {
    const groups = groupSkillsForList([
      makeSkill("React", { priority: 2, learnHours: 40 }),
      makeSkill("Python", {
        priority: 0,
        learnHours: 20,
        description: "Базовый синтаксис",
      }),
    ]);

    expect(
      formatSkillsListMarkdown({
        professionTitle: "ML Engineer",
        groups,
      }),
    ).toBe(`# ML Engineer

# Текущий план

## Приоритет 0

- **Python** — 20 ч
  - Описание: Базовый синтаксис

## Приоритет 2

- **React** — 40 ч

# Освоенные навыки

_Пока нет освоенных навыков._

# Архивированные навыки

_Архивированных навыков нет._
`);
  });

  it("formats completed and archived skills in separate sections", () => {
    const groups = groupSkillsForList([
      makeSkill("SQL", { isCompleted: true, learnHours: 15 }),
      makeSkill("Old Tool", { isArchieved: true, learnHours: 5 }),
    ]);

    const markdown = formatSkillsListMarkdown({
      professionTitle: "Backend Developer",
      groups,
    });

    expect(markdown).toContain("# Освоенные навыки\n\n- **SQL** — 15 ч");
    expect(markdown).toContain("# Архивированные навыки\n\n- **Old Tool** — 5 ч");
    expect(markdown).toContain("_Нет активных навыков в текущем плане._");
  });

  it("uses placeholders for empty sections", () => {
    expect(
      formatSkillsListMarkdown({
        professionTitle: "",
        groups: groupSkillsForList([]),
      }),
    ).toBe(`# План навыков

# Текущий план

_Нет активных навыков в текущем плане._

# Освоенные навыки

_Пока нет освоенных навыков._

# Архивированные навыки

_Архивированных навыков нет._
`);
  });
});

describe("getSkillsListMarkdownFileName", () => {
  it("creates a safe markdown file name from profession title", () => {
    expect(getSkillsListMarkdownFileName("ML Engineer / Data Science")).toBe(
      "ML_Engineer_Data_Science_skills_list.md",
    );
  });

  it("falls back when profession title is empty", () => {
    expect(getSkillsListMarkdownFileName("  ")).toBe("skills_skills_list.md");
  });
});

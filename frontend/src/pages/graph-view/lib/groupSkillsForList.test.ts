import { describe, expect, it } from "vitest";
import type { Skill } from "@/entities/skill";
import { groupSkillsForList } from "./groupSkillsForList";

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

describe("groupSkillsForList", () => {
  it("groups active skills by ascending priority and keeps order inside each group", () => {
    const result = groupSkillsForList([
      makeSkill("priority-2-a", { priority: 2 }),
      makeSkill("priority-0", { priority: 0 }),
      makeSkill("priority-2-b", { priority: 2 }),
      makeSkill("priority-1", { priority: 1 }),
    ]);

    expect(result.currentPlan).toEqual([
      {
        priority: 0,
        skills: [expect.objectContaining({ id: "priority-0" })],
      },
      {
        priority: 1,
        skills: [expect.objectContaining({ id: "priority-1" })],
      },
      {
        priority: 2,
        skills: [
          expect.objectContaining({ id: "priority-2-a" }),
          expect.objectContaining({ id: "priority-2-b" }),
        ],
      },
    ]);
  });

  it("splits completed and archived skills outside of the current plan", () => {
    const result = groupSkillsForList([
      makeSkill("active"),
      makeSkill("completed", { isCompleted: true }),
      makeSkill("archived", { isArchieved: true }),
      makeSkill("archived-completed", {
        isCompleted: true,
        isArchieved: true,
      }),
    ]);

    expect(result.currentPlan.flatMap((group) => group.skills.map((skill) => skill.id))).toEqual([
      "active",
    ]);
    expect(result.completed.map((skill) => skill.id)).toEqual(["completed"]);
    expect(result.archived.map((skill) => skill.id)).toEqual([
      "archived",
      "archived-completed",
    ]);
  });

  it("returns empty groups for an empty skill list", () => {
    expect(groupSkillsForList([])).toEqual({
      currentPlan: [],
      completed: [],
      archived: [],
    });
  });
});

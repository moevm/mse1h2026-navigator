import { describe, expect, it } from "vitest";
import type { Skill } from "@/entities/skill";
import { createSkillNode } from "./createSkillNode";

const skill: Skill = {
  id: "skill-react",
  title: "React",
  description: "UI library",
  isCompleted: false,
  isRequired: true,
  isArchieved: false,
  priority: 1,
  learnHours: 24,
};

describe("createSkillNode", () => {
  it("wraps a skill in the same basic node shape used by graph view", () => {
    expect(createSkillNode(skill)).toEqual({
      id: "skill-react",
      type: "basic",
      position: { x: 0, y: 0 },
      data: skill,
    });
  });
});

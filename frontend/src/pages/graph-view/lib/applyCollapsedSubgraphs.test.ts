import { describe, expect, it } from "vitest";
import { applyCollapsedSubgraphs } from "./applyCollapsedSubgraphs";
import type { MainSkill, Skill, SkillsRelation } from "@/entities/skill/types";

const mainSkill: MainSkill = {
  id: "frontend",
  title: "Frontend Developer",
  description: "",
};

const makeSkill = (id: string): Skill => ({
  id,
  title: id,
  description: "",
  isCompleted: false,
  isRequired: true,
  isArchieved: false,
  priority: 1,
  learnHours: 1,
});

const skills = ["html", "css", "react", "graphql", "docker"].map(makeSkill);

const edges: SkillsRelation[] = [
  { fromId: "frontend", toId: "html" },
  { fromId: "html", toId: "css" },
  { fromId: "css", toId: "react" },
  { fromId: "react", toId: "graphql" },
  { fromId: "frontend", toId: "docker" },
];

describe("applyCollapsedSubgraphs", () => {
  it("keeps the collapsed node visible and hides its descendants", () => {
    const result = applyCollapsedSubgraphs(
      mainSkill,
      skills,
      edges,
      new Set(["css"]),
    );

    expect(result.visibleSkills.map((skill) => skill.id)).toEqual([
      "html",
      "css",
      "docker",
    ]);
    expect(result.hiddenDescendantCountById.get("css")).toBe(2);
  });

  it("collapses the whole graph below the main node", () => {
    const result = applyCollapsedSubgraphs(
      mainSkill,
      skills,
      edges,
      new Set(["frontend"]),
    );

    expect(result.visibleSkills).toEqual([]);
    expect(result.hiddenDescendantCountById.get("frontend")).toBe(5);
  });

  it("ignores collapsed ids outside the current visible graph", () => {
    const result = applyCollapsedSubgraphs(
      mainSkill,
      skills.slice(0, 2),
      edges,
      new Set(["react"]),
    );

    expect(result.visibleSkills.map((skill) => skill.id)).toEqual(["html", "css"]);
    expect(result.hiddenDescendantCountById.has("react")).toBe(false);
  });
});

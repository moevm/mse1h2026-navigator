import { describe, expect, it } from "vitest";
import { filterGraphSkills } from "./filterGraphSkills";
import type { MainSkill, Skill, SkillsRelation } from "@/entities/skill/types";
import type { GraphFilters } from "../services/graphStore";

const mainSkill: MainSkill = {
  id: "frontend",
  title: "Frontend Developer",
  description: "Roadmap",
};

const makeSkill = (id: string, title: string, overrides: Partial<Skill> = {}): Skill => ({
  id,
  title,
  description: "",
  isCompleted: false,
  isRequired: true,
  isArchieved: false,
  priority: 1,
  learnHours: 10,
  ...overrides,
});

const defaultFilters: GraphFilters = {
  query: "",
  requiredOnly: false,
  incompleteOnly: false,
  minHours: 0,
};

const skills = [
  makeSkill("html", "HTML"),
  makeSkill("css", "CSS"),
  makeSkill("react", "React"),
  makeSkill("graphql", "GraphQL"),
  makeSkill("docker", "Docker"),
];

const edges: SkillsRelation[] = [
  { fromId: "frontend", toId: "html" },
  { fromId: "html", toId: "css" },
  { fromId: "css", toId: "react" },
  { fromId: "react", toId: "graphql" },
];

describe("filterGraphSkills", () => {
  it("keeps the original filters when there is no search query", () => {
    const result = filterGraphSkills(mainSkill, skills, edges, {
      ...defaultFilters,
      minHours: 11,
    });

    expect(result).toEqual([]);
  });

  it("returns matched nodes with the path from the main skill", () => {
    const result = filterGraphSkills(mainSkill, skills, edges, {
      ...defaultFilters,
      query: "graphql",
    });

    expect(result.map((skill) => skill.id)).toEqual([
      "html",
      "css",
      "react",
      "graphql",
    ]);
  });

  it("returns the full graph when the main skill matches the query", () => {
    const result = filterGraphSkills(mainSkill, skills, edges, {
      ...defaultFilters,
      query: "frontend",
    });

    expect(result).toBe(skills);
  });

  it("keeps matching disconnected nodes visible", () => {
    const result = filterGraphSkills(mainSkill, skills, edges, {
      ...defaultFilters,
      query: "docker",
    });

    expect(result.map((skill) => skill.id)).toEqual(["docker"]);
  });
});

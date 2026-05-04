import { MarkerType } from "@xyflow/react";
import { describe, expect, it } from "vitest";
import { mapSkillsToFlow } from "./mapSkillsToFlow";
import type { MainSkill, Skill } from "@/entities/skill/types";

const mainSkill: MainSkill = {
  id: "frontend",
  title: "Frontend Developer",
  description: "Roadmap",
};

const reactSkill: Skill = {
  id: "react",
  title: "React",
  description: "",
  isCompleted: false,
  isRequired: true,
  isArchieved: false,
  priority: 1,
  learnHours: 10,
};

const typescriptSkill: Skill = {
  ...reactSkill,
  id: "typescript",
  title: "TypeScript",
};

describe("mapSkillsToFlow", () => {
  it("maps main and skill nodes to React Flow nodes", () => {
    const flow = mapSkillsToFlow(mainSkill, [reactSkill, typescriptSkill], []);

    expect(flow.nodes).toHaveLength(3);
    expect(flow.nodes[0]).toMatchObject({
      id: "frontend",
      type: "main",
      data: mainSkill,
    });
    expect(flow.nodes[1]).toMatchObject({
      id: "react",
      type: "basic",
      data: reactSkill,
    });
  });

  it("adds closed arrow markers to graph edges", () => {
    const flow = mapSkillsToFlow(mainSkill, [reactSkill, typescriptSkill], [
      { fromId: "react", toId: "typescript" },
    ]);

    expect(flow.edges).toEqual([
      expect.objectContaining({
        id: "react-typescript",
        source: "react",
        target: "typescript",
        markerEnd: expect.objectContaining({
          type: MarkerType.ArrowClosed,
          color: "#64748b",
        }),
      }),
    ]);
  });

  it("initializes every mapped node at the origin before layout", () => {
    const flow = mapSkillsToFlow(mainSkill, [reactSkill, typescriptSkill], []);

    expect(flow.nodes.map((node) => node.position)).toEqual([
      { x: 0, y: 0 },
      { x: 0, y: 0 },
      { x: 0, y: 0 },
    ]);
  });

  it("preserves duplicate relations as distinct edge entries with stable ids", () => {
    const flow = mapSkillsToFlow(mainSkill, [reactSkill, typescriptSkill], [
      { fromId: "react", toId: "typescript" },
      { fromId: "react", toId: "typescript" },
    ]);

    expect(flow.edges).toHaveLength(2);
    expect(flow.edges.map((edge) => edge.id)).toEqual([
      "react-typescript",
      "react-typescript",
    ]);
  });
});

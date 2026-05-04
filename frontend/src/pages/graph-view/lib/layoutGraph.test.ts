import type { Edge } from "@xyflow/react";
import { describe, expect, it } from "vitest";
import { layoutGraph } from "./layoutGraph";
import type { GraphNode } from "../types/nodes";

function node(id: string): GraphNode {
  return {
    id,
    type: "basic",
    position: { x: 0, y: 0 },
    data: { id, title: id },
  } as GraphNode;
}

function edge(source: string, target: string): Edge {
  return {
    id: `${source}-${target}`,
    source,
    target,
  };
}

describe("layoutGraph", () => {
  it("places dependencies in lower layers than their prerequisites", async () => {
    const { nodes } = await layoutGraph(
      [node("root"), node("middle"), node("leaf")],
      [edge("root", "middle"), edge("middle", "leaf")],
    );

    const byId = new Map(nodes.map((item) => [item.id, item]));

    expect(byId.get("root")?.position.y).toBe(0);
    expect(byId.get("middle")?.position.y).toBeGreaterThan(
      byId.get("root")!.position.y,
    );
    expect(byId.get("leaf")?.position.y).toBeGreaterThan(
      byId.get("middle")!.position.y,
    );
  });

  it("centers sibling nodes within the same layer", async () => {
    const { nodes } = await layoutGraph(
      [node("root"), node("a"), node("b")],
      [edge("root", "a"), edge("root", "b")],
    );

    const children = nodes
      .filter((item) => item.id === "a" || item.id === "b")
      .sort((left, right) => left.position.x - right.position.x);

    expect(children.map((item) => item.position.y)).toEqual([190, 190]);
    expect(children.map((item) => item.position.x)).toEqual([-140, 140]);
  });

  it("keeps edges unchanged while assigning node positions", async () => {
    const edges = [edge("root", "leaf")];
    const result = await layoutGraph([node("root"), node("leaf")], edges);

    expect(result.edges).toBe(edges);
    expect(result.edges).toEqual([expect.objectContaining({ id: "root-leaf" })]);
  });

  it("keeps cyclic graphs compact by ignoring feedback edges for ranking", async () => {
    const { nodes } = await layoutGraph(
      [node("b"), node("a")],
      [edge("a", "b"), edge("b", "a")],
    );

    expect(nodes.map((item) => [item.id, item.position])).toEqual([
      ["b", { x: 0, y: 190 }],
      ["a", { x: 0, y: 0 }],
    ]);
  });

  it("wraps large layers into multiple centered rows", async () => {
    const children = Array.from({ length: 7 }, (_, index) =>
      node(`child-${index + 1}`),
    );
    const { nodes } = await layoutGraph(
      [node("root"), ...children],
      children.map((child) => edge("root", child.id)),
    );

    const childPositions = nodes
      .filter((item) => item.id.startsWith("child-"))
      .map((item) => item.position);

    expect(childPositions).toEqual([
      { x: -560, y: 190 },
      { x: -280, y: 190 },
      { x: 0, y: 190 },
      { x: 280, y: 190 },
      { x: 560, y: 190 },
      { x: -140, y: 340 },
      { x: 140, y: 340 },
    ]);
  });
});

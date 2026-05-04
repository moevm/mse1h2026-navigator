import type { Edge, Node } from "@xyflow/react";
import { describe, expect, it } from "vitest";
import { SourceHandleTypes, TargetHandleTypes } from "../config/handleTypes";
import { resolveHandles } from "./resolveHandles";

function node(id: string, x: number, y: number): Node {
  return {
    id,
    position: { x, y },
    data: {},
  };
}

function edge(source: string, target: string): Edge {
  return {
    id: `${source}-${target}`,
    source,
    target,
  };
}

describe("resolveHandles", () => {
  it("uses horizontal handles for nodes placed left to right", () => {
    const [resolved] = resolveHandles(
      [node("left", 0, 0), node("right", 300, 40)],
      [edge("left", "right")],
    );

    expect(resolved).toMatchObject({
      sourceHandle: SourceHandleTypes.RIGHT_SOURCE,
      targetHandle: TargetHandleTypes.LEFT_TARGET,
    });
  });

  it("uses vertical handles for nodes placed top to bottom", () => {
    const [resolved] = resolveHandles(
      [node("top", 0, 0), node("bottom", 20, 300)],
      [edge("top", "bottom")],
    );

    expect(resolved).toMatchObject({
      sourceHandle: SourceHandleTypes.BOTTOM_SOURCE,
      targetHandle: TargetHandleTypes.TOP_TARGET,
    });
  });
});

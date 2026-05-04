import { describe, expect, it } from "vitest";
import { parseTechnologyList } from "./parseTechnologyList";

describe("parseTechnologyList", () => {
  it("splits technologies by commas, semicolons, and new lines", () => {
    expect(parseTechnologyList("React, TypeScript\nGraphQL; Vite")).toEqual([
      "React",
      "TypeScript",
      "GraphQL",
      "Vite",
    ]);
  });

  it("trims empty values and keeps first occurrence order", () => {
    expect(parseTechnologyList(" React, ,Mobx;React\nZod ")).toEqual([
      "React",
      "Mobx",
      "Zod",
    ]);
  });

  it("returns an empty list for whitespace-only input", () => {
    expect(parseTechnologyList(" \n, ; \t ")).toEqual([]);
  });

  it("treats values with different casing as separate technologies", () => {
    expect(parseTechnologyList("React, react, REACT")).toEqual([
      "React",
      "react",
      "REACT",
    ]);
  });
});

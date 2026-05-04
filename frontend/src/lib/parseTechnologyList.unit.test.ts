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
});

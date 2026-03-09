import type { MainSkill, Skill } from "@/entities/skill";
import type { Node } from "@xyflow/react";

export interface MainNode extends Node {
  type: "main";
  data: MainSkill;
}

export interface BasicNode extends Node {
  type: "basic";
  data: Skill;
}

export type GraphNode = MainNode | BasicNode;
